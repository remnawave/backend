import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as acme from 'acme-client';
import { createHash, X509Certificate } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import {
    ACME_CERTIFICATE_STATUS,
    ACME_CHALLENGE_TYPE,
    ACME_EVENT_LEVEL,
    ACME_KEY_TYPE,
    ACME_RECORD_PREFIX,
    TAcmeKeyType,
} from '@libs/contracts/constants';

import { AcmeSecretBoxService } from '../crypto/acme-secret-box.service';
import { AcmeAccountEntity, AcmeCertificateEntity } from '../entities';
import { AcmeAccountsRepository } from '../repositories/acme-accounts.repository';
import { AcmeCertificatesRepository } from '../repositories/acme-certificates.repository';
import { AcmeCredentialsRepository } from '../repositories/acme-credentials.repository';
import { AcmeEventsRepository } from '../repositories/acme-events.repository';
import { waitForTxtRecord } from './dns-propagation.util';
import {
    buildPersistRecordName,
    buildPersistRecordValue,
    resolveIssuerDomain,
} from './persist-record.util';
import { SolverFactory } from './solvers/solver.factory';
import { IDnsSolver } from './solvers/solver.interface';

/** Retry backoff: doubles per consecutive failure, capped so a broken setup still retries daily. */
const MAX_RETRY_HOURS = 24;

interface IPublishedRecord {
    fqdn: string;
    value: string;
}

export interface IIssueResult {
    /** Nodes that must be restarted to pick up the new certificate. */
    affectedNodeUuids: string[];
    isIssued: boolean;
    message: string;
}

/**
 * Runs one ACME order from start to finish.
 *
 * The low-level acme-client API is used rather than client.auto(), because
 * dns-persist-01 has no key authorization to compute and no record to publish:
 * the challenge is answered by an authorization record that already exists.
 * auto() cannot express that.
 */
@Injectable()
export class AcmeOrderService {
    private readonly logger = new Logger(AcmeOrderService.name);

    constructor(
        private readonly certificatesRepository: AcmeCertificatesRepository,
        private readonly credentialsRepository: AcmeCredentialsRepository,
        private readonly accountsRepository: AcmeAccountsRepository,
        private readonly eventsRepository: AcmeEventsRepository,
        private readonly secretBox: AcmeSecretBoxService,
        private readonly solverFactory: SolverFactory,
    ) {}

    public async issue(certificateUuid: string, force: boolean): Promise<IIssueResult> {
        const certificate = await this.certificatesRepository.findByUUID(certificateUuid);

        if (!certificate) {
            return { isIssued: false, message: 'Certificate not found', affectedNodeUuids: [] };
        }

        if (!certificate.isEnabled && !force) {
            return { isIssued: false, message: 'Certificate is disabled', affectedNodeUuids: [] };
        }

        if (!this.secretBox.isConfigured) {
            await this.fail(certificate, 'ACME_SECRET_KEY is not configured');

            return {
                isIssued: false,
                message: 'ACME_SECRET_KEY is not configured',
                affectedNodeUuids: [],
            };
        }

        const published: IPublishedRecord[] = [];
        let solver: IDnsSolver | null = null;

        try {
            const credential = certificate.credentialUuid
                ? await this.credentialsRepository.findByUUID(certificate.credentialUuid)
                : null;

            if (!credential) {
                throw new Error('Certificate has no credential');
            }

            solver = this.solverFactory.create(credential);

            if (certificate.challengeType === ACME_CHALLENGE_TYPE.DNS_01 && !solver.canPublish) {
                throw new Error(
                    `Credential "${credential.name}" cannot publish records, so it cannot answer dns-01. ` +
                        'Switch the certificate to dns-persist-01 or pick another credential.',
                );
            }

            await this.certificatesRepository.updateResult(certificate.uuid, {
                status: ACME_CERTIFICATE_STATUS.ISSUING,
                lastError: null,
            });

            const { account, client } = await this.buildClient(certificate);

            const order = await client.createOrder({
                identifiers: certificate.domains.map((domain) => ({
                    type: 'dns',
                    value: domain,
                })),
            });

            const authorizations = await client.getAuthorizations(order);

            for (const authorization of authorizations) {
                if (authorization.status === 'valid') {
                    // The CA still remembers a recent validation for this name.
                    continue;
                }

                await this.solveAuthorization(
                    client,
                    certificate,
                    account,
                    authorization,
                    solver,
                    published,
                );
            }

            const [key, csr] = await acme.crypto.createCsr(
                {
                    commonName: certificate.domains[0],
                    altNames: certificate.domains,
                },
                await this.createPrivateKey(certificate.keyType),
            );

            // getCertificate must see the order state AFTER finalization. The
            // object from createOrder is stale: when the CA reused still-valid
            // authorizations, it reads status 'ready' - which acme-client treats
            // as "no need to refresh" - and then finds no certificate URL on it.
            // Renewals within the authorization lifetime (~30 days at LE) always
            // hit that path.
            const finalizedOrder = await client.finalizeOrder(order, csr);
            const fullchain = await client.getCertificate(finalizedOrder);

            const affectedNodeUuids = await this.store(certificate, fullchain, key.toString());

            return {
                isIssued: true,
                message: `Issued certificate for ${certificate.domains.join(', ')}`,
                affectedNodeUuids,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            this.logger.error(`Issuance failed for ${certificate.name}: ${message}`);
            await this.fail(certificate, message);

            return { isIssued: false, message, affectedNodeUuids: [] };
        } finally {
            // Challenge records are cleaned up whether the order succeeded or not:
            // leftovers accumulate in the zone and, for a failed order, hint at a
            // token that is no longer valid.
            if (solver) {
                for (const record of published) {
                    try {
                        await solver.cleanup(record.fqdn, record.value);
                    } catch (error) {
                        // The certificate may already be issued, but a record left
                        // in the zone is an operator problem: without an event the
                        // journal shows a clean success and nobody goes looking.
                        this.logger.warn(`Failed to clean up ${record.fqdn}: ${error}`);

                        await this.eventsRepository
                            .create(
                                certificate.uuid,
                                ACME_EVENT_LEVEL.ERROR,
                                `Failed to remove ${record.fqdn} after the order; delete the TXT record manually`,
                            )
                            .catch(() => {});
                    }
                }
            }
        }
    }

    /**
     * Registers the ACME account if needed and returns a client bound to it.
     * Accounts are shared by directory and e-mail: CAs rate-limit registrations,
     * and a dns-persist-01 authorization is tied to one account URI.
     */
    public async buildClient(
        certificate: AcmeCertificateEntity,
    ): Promise<{ account: AcmeAccountEntity; client: acme.Client }> {
        // Null only for imported certificates, which never reach this code: they
        // have no CA behind them and nothing to order.
        const { directoryUrl, email } = certificate;

        if (!directoryUrl || !email) {
            throw new Error(
                'The certificate has no certificate authority configured, so it cannot be ordered',
            );
        }

        let account = await this.accountsRepository.findByDirectoryAndEmail(directoryUrl, email);

        if (!account) {
            const accountKey = await acme.crypto.createPrivateEcdsaKey('P-256');

            try {
                account = await this.accountsRepository.create({
                    directoryUrl,
                    email,
                    accountKeyEncrypted: this.secretBox.encrypt(accountKey.toString()),
                    eabKid: certificate.eabKid,
                });
            } catch (error) {
                // Parallel orders race to register the same (directory, email)
                // account; the loser takes the winner's row and discards its own
                // key. Registering with a shared key is idempotent on the CA side.
                if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
                    account = await this.accountsRepository.findByDirectoryAndEmail(
                        directoryUrl,
                        email,
                    );
                }

                if (!account) {
                    throw error;
                }
            }
        }

        const client = new acme.Client({
            directoryUrl,
            accountKey: this.secretBox.decrypt(account.accountKeyEncrypted),
            ...(account.accountUrl ? { accountUrl: account.accountUrl } : {}),
            ...(account.eabKid && account.eabHmacEncrypted
                ? {
                      externalAccountBinding: {
                          kid: account.eabKid,
                          hmacKey: this.secretBox.decrypt(account.eabHmacEncrypted),
                      },
                  }
                : {}),
        });

        if (!account.accountUrl) {
            await client.createAccount({
                termsOfServiceAgreed: true,
                contact: [`mailto:${certificate.email}`],
            });

            account = await this.accountsRepository.setAccountUrl(
                account.uuid,
                client.getAccountUrl(),
            );
        }

        return { account, client };
    }

    private async solveAuthorization(
        client: acme.Client,
        certificate: AcmeCertificateEntity,
        account: AcmeAccountEntity,
        authorization: acme.Authorization,
        solver: IDnsSolver,
        published: IPublishedRecord[],
    ): Promise<void> {
        const wantedType =
            certificate.challengeType === ACME_CHALLENGE_TYPE.DNS_PERSIST_01
                ? 'dns-persist-01'
                : 'dns-01';

        const challenge = authorization.challenges.find(
            (candidate) => candidate.type === wantedType,
        );

        if (!challenge) {
            const offered = authorization.challenges.map((c) => c.type).join(', ');

            throw new Error(
                `The CA does not offer ${wantedType} for ${authorization.identifier.value} ` +
                    `(offered: ${offered}). As of 2026 dns-persist-01 is available on staging endpoints only.`,
            );
        }

        if (wantedType === 'dns-01') {
            const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);
            const fqdn = `${ACME_RECORD_PREFIX.DNS_01}.${authorization.identifier.value}`;

            await solver.present(fqdn, keyAuthorization);
            published.push({ fqdn, value: keyAuthorization });

            await this.event(
                certificate.uuid,
                ACME_EVENT_LEVEL.INFO,
                `Published ${fqdn}, waiting for DNS propagation`,
            );

            const isVisible = await waitForTxtRecord(fqdn, keyAuthorization);

            if (!isVisible) {
                throw new Error(
                    `Record ${fqdn} did not become visible on public resolvers in time`,
                );
            }
        } else {
            // Nothing to publish: the authorization record was placed once, and
            // the CA reads it directly. All we can do is check it is there, so a
            // missing record reports itself instead of surfacing as a validation
            // failure from the CA.
            const name = buildPersistRecordName(certificate.domains);
            const value = buildPersistRecordValue(
                resolveIssuerDomain(certificate.directoryUrl ?? ''),
                account.accountUrl!,
                certificate.domains,
            );

            await this.event(
                certificate.uuid,
                ACME_EVENT_LEVEL.INFO,
                `Using the persistent authorization record ${name} ("${value}")`,
            );
        }

        await client.completeChallenge(challenge);
        await client.waitForValidStatus(challenge);
    }

    private async createPrivateKey(keyType: TAcmeKeyType): Promise<Buffer> {
        switch (keyType) {
            case ACME_KEY_TYPE.ECDSA_P256:
                return acme.crypto.createPrivateEcdsaKey('P-256');
            case ACME_KEY_TYPE.ECDSA_P384:
                return acme.crypto.createPrivateEcdsaKey('P-384');
            case ACME_KEY_TYPE.RSA_2048:
                return acme.crypto.createPrivateRsaKey(2048);
            case ACME_KEY_TYPE.RSA_4096:
                return acme.crypto.createPrivateRsaKey(4096);
            default:
                return acme.crypto.createPrivateEcdsaKey('P-256');
        }
    }

    private async store(
        certificate: AcmeCertificateEntity,
        fullchain: string,
        privateKey: string,
    ): Promise<string[]> {
        const leaf = new X509Certificate(fullchain);
        const fingerprint = createHash('sha256').update(leaf.raw).digest('hex');

        await this.certificatesRepository.updateResult(certificate.uuid, {
            status: ACME_CERTIFICATE_STATUS.ACTIVE,
            fullchainPem: fullchain,
            keyEncrypted: this.secretBox.encrypt(privateKey),
            fingerprint,
            issuedAt: new Date(leaf.validFrom),
            expiresAt: new Date(leaf.validTo),
            lastError: null,
            failCount: 0,
            nextRetryAt: null,
        });

        await this.event(
            certificate.uuid,
            ACME_EVENT_LEVEL.INFO,
            `Issued certificate valid until ${new Date(leaf.validTo).toISOString()}`,
        );

        return certificate.nodes.map((binding) => binding.nodeUuid);
    }

    private async fail(certificate: AcmeCertificateEntity, message: string): Promise<void> {
        const failCount = certificate.failCount + 1;
        const delayHours = Math.min(2 ** failCount, MAX_RETRY_HOURS);

        await this.certificatesRepository.updateResult(certificate.uuid, {
            status: ACME_CERTIFICATE_STATUS.ERROR,
            lastError: message,
            failCount,
            nextRetryAt: new Date(Date.now() + delayHours * 60 * 60 * 1000),
        });

        await this.event(certificate.uuid, ACME_EVENT_LEVEL.ERROR, message);
    }

    private async event(
        certificateUuid: string,
        level: (typeof ACME_EVENT_LEVEL)[keyof typeof ACME_EVENT_LEVEL],
        message: string,
    ): Promise<void> {
        try {
            await this.eventsRepository.create(certificateUuid, level, message);
        } catch (error) {
            this.logger.error(`Failed to record ACME event: ${error}`);
        }
    }
}
