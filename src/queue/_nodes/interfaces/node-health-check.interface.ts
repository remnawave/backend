export interface INodeHealthCheckPayload {
    nodeUuid: string;
    nodeAddress: string;
    nodePort: number | null;
    isConnected: boolean;
    isConnecting: boolean;
}
