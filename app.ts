require("dotenv").config();
import { NextFunction } from "express";
const express = require("express")
export const app = express();
const cors = require("cors")
const cookieParser = require("cookie-parser");
import {ErrorMiddleware} from "./middleware/error";

// body parser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

//cors => cross origin resource sharing 
app.use(cors({
    origin: process.env.ORIGIN
}));

// testing API's 
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: "API is working"
    })
})


// Unknown route
app.all("*", (req:Request, res:Response, next:NextFunction)=>{
     const err = new Error(`Route ${req.originalUrl} not found`) as any;
     err.statusCode = 404;
     next(err)
})

app.use(ErrorMiddleware);