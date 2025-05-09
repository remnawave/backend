export const SUBSCRIPTION_TEMPLATE_CONTROLLER = 'subscription-templates' as const;

export const SUBSCRIPTION_TEMPLATE_ROUTES = {
    GET: (templateType: string) => `${templateType}`,
    UPDATE: '',
} as const;
