import { NextFunction, Request, Response } from 'express';

const INVALID_PATH_CHARS = /[\s\(\)<>"'{}\\]/;

export function pathSecurityMiddleware(req: Request, res: Response, next: NextFunction): void {
    let pathname = req.path;
    if (pathname.includes('%')) {
        try {
            pathname = decodeURI(pathname);
        } catch {
            res.status(400).end();
            return;
        }
    }

    if (INVALID_PATH_CHARS.test(pathname)) {
        res.status(400).end();
        return;
    }

    next();
}
