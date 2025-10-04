export const resolveSubscriptionUrl = (
    shortUuid: string,
    username: string,
    addUsernameToBaseSubscription: boolean,
    subPublicDomain: string,
): string => {
    if (addUsernameToBaseSubscription) {
        return `https://${subPublicDomain}/${shortUuid}#${username}`;
    }

    return `https://${subPublicDomain}/${shortUuid}`;
};
