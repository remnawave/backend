export const SUBSCRIPTION_INFO_BLOCK_VARIANTS = {
    COLLAPSED: 'collapsed',
    EXPANDED: 'expanded',
    CARDS: 'cards',
    HIDDEN: 'hidden',
} as const;

export const INSTALLATION_GUIDE_BLOCKS_VARIANTS = {
    CARDS: 'cards',
    ACCORDION: 'accordion',
    MINIMAL: 'minimal',
    TIMELINE: 'timeline',
} as const;

export type TSubscriptionInfoBlockVariant =
    (typeof SUBSCRIPTION_INFO_BLOCK_VARIANTS)[keyof typeof SUBSCRIPTION_INFO_BLOCK_VARIANTS];

export const SUBSCRIPTION_INFO_BLOCK_VARIANTS_VALUES = Object.values(
    SUBSCRIPTION_INFO_BLOCK_VARIANTS,
);

export type TInstallationGuideBlockVariant =
    (typeof INSTALLATION_GUIDE_BLOCKS_VARIANTS)[keyof typeof INSTALLATION_GUIDE_BLOCKS_VARIANTS];

export const INSTALLATION_GUIDE_BLOCKS_VARIANTS_VALUES = Object.values(
    INSTALLATION_GUIDE_BLOCKS_VARIANTS,
);

export const isInstallationGuideBlockVariant = (
    value: string,
): value is TInstallationGuideBlockVariant => {
    return INSTALLATION_GUIDE_BLOCKS_VARIANTS_VALUES.includes(
        value as TInstallationGuideBlockVariant,
    );
};

export const isSubscriptionInfoBlockVariant = (
    value: string,
): value is TSubscriptionInfoBlockVariant => {
    return SUBSCRIPTION_INFO_BLOCK_VARIANTS_VALUES.includes(value as TSubscriptionInfoBlockVariant);
};
