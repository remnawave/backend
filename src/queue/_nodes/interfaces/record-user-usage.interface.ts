export interface IRecordUserUsagePayload {
    nodeId: string;
    nodeUuid: string;
    nodeAddress: string;
    nodePort: number | null;
    consumptionMultiplier: string;
}
