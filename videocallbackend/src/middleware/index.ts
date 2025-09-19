import { NextFunction, Request, Response } from "express";
import morgan from "morgan";

export const requestLogger = morgan("combined");

export const corsMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
    }

    next();
};
