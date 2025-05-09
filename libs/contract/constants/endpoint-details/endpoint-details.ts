export interface EndpointDetails {
    CONTROLLER_URL: string;
    REQUEST_METHOD: 'post' | 'get' | 'put' | 'delete' | 'patch';
    METHOD_DESCRIPTION: string;
    METHOD_LONG_DESCRIPTION?: string;
}

export function getEndpointDetails(
    controllerUrl: string,
    requestMethod: 'post' | 'get' | 'put' | 'delete' | 'patch',
    methodDescription: string,
    methodLongDescription?: string,
): EndpointDetails {
    return {
        CONTROLLER_URL: controllerUrl,
        REQUEST_METHOD: requestMethod,
        METHOD_DESCRIPTION: methodDescription,
        METHOD_LONG_DESCRIPTION: methodLongDescription,
    };
}
