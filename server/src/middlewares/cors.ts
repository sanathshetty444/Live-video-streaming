import { Request, Response, NextFunction } from "express";

const corsMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.log("inside cors");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
        console.log("Preflight request detected");
        res.status(200).json({ success: true });
        return;
    }

    next();
};

export default corsMiddleware;
