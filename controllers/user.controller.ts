require('dotenv').config();
import { Request, Response, NextFunction } from "express";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsynsError } from "../middleware/CatchAsynsErrors";
import Jwt, { Secret }  from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import senMail from "../utils/sendMail";


// register user
interface IRegistrationBody{
    name : string;
    email : string;
    password : string;
    avatar ?: string;
}

export const registrationUser = CatchAsynsError(async(req:Request, res:Response, next: NextFunction)=>{
    try{
        const {name, email, password} =  req.body;
        const isEmailExist = await userModel.findOne({email});
        if(isEmailExist){
            return next(new ErrorHandler("Email alreay Exist",400  ));
        }

        const user:IRegistrationBody={
            name,
            email,
            password
        };
        const activationToken = createActivationToken(user);
        const activationCode = activationToken.activationCode;
        const data = {user: {name: user.name}, activationCode};
        const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejsl"), data)


        try {
            await senMail({
                email : user.email,
                subject : "Activate your account",
                template : "activation-mail.ejs",
                data
            });

            res.status(200).json({
                sucess : true,
                message : `Please check your email: ${user.email} to activate your account!`,
                activationToken : activationToken.token,
            })
        } catch (error :any) {
            return next(new ErrorHandler(error.message, 400))
        }   
    }
    catch(error :any){
        return next(new ErrorHandler(error.message, 400))
    }

});

interface IActivationToken{
    token : String,
    activationCode : String
}


const createActivationToken =(user:any): IActivationToken=>{
    const activationCode = Math.floor(100 + Math.random() * 9000).toString();
    const token = Jwt.sign({
        user, activationCode
    }, process.env.ACTIVATION_SECRET as Secret,{
        expiresIn: "Sm"
    })


    return {token, activationCode}
}