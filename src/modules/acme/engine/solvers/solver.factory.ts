import { Injectable } from '@nestjs/common';

import { ACME_PROVIDER } from '@libs/contracts/constants';

import { AcmeSecretBoxService } from '../../crypto/acme-secret-box.service';
import { AcmeCredentialEntity } from '../../entities';
import { TAcmeCredentialPayload } from '../../interfaces/credential-payload.interface';
import { CloudflareSolver } from './cloudflare.solver';
import { CustomSolver } from './custom.solver';
import { ManualSolver } from './manual.solver';
import { DesecSolver } from './providers/desec.solver';
import { DigitalOceanSolver } from './providers/digitalocean.solver';
import { GandiSolver } from './providers/gandi.solver';
import { HetznerSolver } from './providers/hetzner.solver';
import { PorkbunSolver } from './providers/porkbun.solver';
import { PowerDnsSolver } from './providers/powerdns.solver';
import { VultrSolver } from './providers/vultr.solver';
import { IDnsSolver } from './solver.interface';

@Injectable()
export class SolverFactory {
    constructor(private readonly secretBox: AcmeSecretBoxService) {}

    public create(credential: AcmeCredentialEntity): IDnsSolver {
        switch (credential.provider) {
            case ACME_PROVIDER.CLOUDFLARE:
                return new CloudflareSolver(this.readPayload(credential));
            case ACME_PROVIDER.CUSTOM:
                return new CustomSolver(this.readPayload(credential));
            case ACME_PROVIDER.DESEC:
                return new DesecSolver(this.readPayload(credential));
            case ACME_PROVIDER.DIGITALOCEAN:
                return new DigitalOceanSolver(this.readPayload(credential));
            case ACME_PROVIDER.GANDI:
                return new GandiSolver(this.readPayload(credential));
            case ACME_PROVIDER.HETZNER:
                return new HetznerSolver(this.readPayload(credential));
            case ACME_PROVIDER.MANUAL:
                return new ManualSolver();
            case ACME_PROVIDER.PORKBUN:
                return new PorkbunSolver(this.readPayload(credential));
            case ACME_PROVIDER.POWERDNS:
                return new PowerDnsSolver(this.readPayload(credential));
            case ACME_PROVIDER.VULTR:
                return new VultrSolver(this.readPayload(credential));
            default:
                throw new Error(`Unsupported ACME credential provider: ${credential.provider}`);
        }
    }

    private readPayload(credential: AcmeCredentialEntity): TAcmeCredentialPayload {
        if (!credential.payloadEncrypted) {
            throw new Error(`Credential "${credential.name}" has no stored secret`);
        }

        return this.secretBox.decryptJson<TAcmeCredentialPayload>(credential.payloadEncrypted);
    }
}
