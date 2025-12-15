export const SUBSCRIPTION_INFO_BLOCK_VARIANTS = {
    COLLAPSED: 'collapsed',
    EXPANDED: 'expanded',
    CARDS: 'cards',
    HIDDEN: 'hidden',
} as const;

export type TSubscriptionInfoBlockVariant =
    (typeof SUBSCRIPTION_INFO_BLOCK_VARIANTS)[keyof typeof SUBSCRIPTION_INFO_BLOCK_VARIANTS];

export const SUBSCRIPTION_INFO_BLOCK_VARIANTS_VALUES = Object.values(
    SUBSCRIPTION_INFO_BLOCK_VARIANTS,
);

export const isSubscriptionInfoBlockVariant = (
    value: string,
): value is TSubscriptionInfoBlockVariant => {
    return SUBSCRIPTION_INFO_BLOCK_VARIANTS_VALUES.includes(value as TSubscriptionInfoBlockVariant);
};
