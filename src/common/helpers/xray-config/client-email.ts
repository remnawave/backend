export function buildClientEmail(userId: bigint, inboundUuid: string | undefined): string {
    if (!inboundUuid) {
        return userId.toString();
    }

    return `${userId.toString()}@${inboundUuid}`;
}

export function parseClientEmail(email: string): {
    userId: string;
    inboundUuid: string | null;
} {
    const atIndex = email.lastIndexOf('@');

    if (atIndex === -1) {
        return { userId: email, inboundUuid: null };
    }

    return {
        userId: email.slice(0, atIndex),
        inboundUuid: email.slice(atIndex + 1),
    };
}
