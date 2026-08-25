export class EvaluateVaultResponseModel {
    public readonly evaluated: string;

    constructor(data: EvaluateVaultResponseModel) {
        this.evaluated = data.evaluated;
    }
}
