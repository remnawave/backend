import { TSubscriptionPageBaseTranslationKeys } from '../models';

export const BASE_TRANSLATION_LABELS: Record<TSubscriptionPageBaseTranslationKeys, string> = {
    installationGuideHeader: 'Installation Guide Header',
    connectionKeysHeader: 'Connection Keys Header',
    linkCopied: 'Link Copied',
    linkCopiedToClipboard: 'Link Copied to Clipboard',
    getLink: 'Get Link',
    scanQrCode: 'Scan QR Code',
    scanQrCodeDescription: 'Scan QR Code Description',
    copyLink: 'Copy Link',
    name: 'Name',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    expires: 'Expires',
    bandwidth: 'Bandwidth',
    scanToImport: 'Scan to Import',
    expiresIn: 'Expires In',
    expired: 'Expired',
    unknown: 'Unknown',
    indefinitely: 'Indefinitely',
};

export const BASE_TRANSLATION_KEYS: TSubscriptionPageBaseTranslationKeys[] = Object.keys(
    BASE_TRANSLATION_LABELS,
) as TSubscriptionPageBaseTranslationKeys[];
