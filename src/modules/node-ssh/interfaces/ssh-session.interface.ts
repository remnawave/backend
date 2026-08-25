export interface ISshSessionOptions {
    allowedHosts: string[];
    nodeAddress: string;
    onClosed: (reason: string, durationSeconds: null | number) => void;
    onOpened: (target: string, username: string) => void;
}
