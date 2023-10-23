import { NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";

export const ErrorMiddleware = (err:any, req: Request, res: Response, next: NextFunction)=>{
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Interal Server Error';

    // wrong mongodb  id error
    if(err.name === 'CastError'){
        const message = `Resource Not Found. ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // Duplicate key error
    if(err.code === 11000){
        const message = `Duplicate ${err.keyValue} entered`;
        err = new ErrorHandler(message, 400);
    }

    //  wrong JWT Error
    if(err.name === 'JsonWebTokenError'){
        const message = `Json web token is invlid, try again`;
        err = new ErrorHandler(message, 400);
    }

    // JWT expired error
    if(err.name === 'TokeExpiredError'){
        const message = 'Json web token is expired, try again';
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({
        success : false,
        message: err.message
    })

}