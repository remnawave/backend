export const INSTALLATION_GUIDE_BLOCKS_VARIANTS = {
    CARDS: 'cards',
    ACCORDION: 'accordion',
    MINIMAL: 'minimal',
    TIMELINE: 'timeline',
} as const;

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
