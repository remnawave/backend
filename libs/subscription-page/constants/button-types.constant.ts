export const BUTTON_TYPES = {
    EXTERNAL: 'external',
    SUBSCRIPTION_LINK: 'subscriptionLink',
    COPY_BUTTON: 'copyButton',
} as const;

export type TButtonType = (typeof BUTTON_TYPES)[keyof typeof BUTTON_TYPES];

export const BUTTON_TYPES_VALUES = Object.values(BUTTON_TYPES);

export const isButtonType = (value: string): value is TButtonType => {
    return BUTTON_TYPES_VALUES.includes(value as TButtonType);
};
