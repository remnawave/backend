import { Request, Response } from 'express';

import { HttpException } from '@nestjs/common';

const DRAINABLE_BODY_LIMIT_BYTES = 64 * 1024;

export function hasRequestBody(req: Request): boolean {
    return (
        req.headers['transfer-encoding'] !== undefined || Number(req.headers['content-length']) > 0
    );
}

function hasUndrainableBody(req: Request): boolean {
    return (
        req.headers['transfer-encoding'] !== undefined ||
        Number(req.headers['content-length']) > DRAINABLE_BODY_LIMIT_BYTES
    );
}

export function rejectRequest(req: Request, res: Response, exception: HttpException): void {
    if (hasUndrainableBody(req)) {
        res.setHeader('Connection', 'close');
    }

    const status = exception.getStatus();
    const response = exception.getResponse();

    res.status(status).json(
        typeof response === 'string' ? { statusCode: status, message: response } : response,
    );
}
