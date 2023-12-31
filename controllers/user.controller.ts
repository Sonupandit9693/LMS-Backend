require('dotenv').config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsynsError } from "../middleware/CatchAsynsErrors";
import Jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import senMail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";


// register user
interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registrationUser = CatchAsynsError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
            return next(new ErrorHandler("Email alreay Exist", 400));
        }

        const user: IRegistrationBody = {
            name,
            email,
            password
        };
        const activationToken = createActivationToken(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        console.log(__dirname)
        const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);
        console.log(path.join(__dirname, "../mails/activation-mail.ejs"));
        try {
            await senMail({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data,
            });

            res.status(201).json({
                sucess: true,
                message: `Please check your email: ${user.email} to activate your account!`,
                activationToken: activationToken.token,
            })
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400))
        }
    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }

});

interface IActivationToken {
    token: String,
    activationCode: String
}


const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(100 + Math.random() * 9000).toString();
    const token = Jwt.sign({
        user, activationCode
    }, process.env.ACTIVATION_SECRET as Secret, {
        expiresIn: "5m"
    })


    return { token, activationCode }
}



// activate user
interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = CatchAsynsError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activation_token, activation_code } = req.body as IActivationRequest;
        const newUser: { user: IUser, activationCode: string } = Jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
        ) as { user: IUser, activationCode: string };

        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler('Invalid Activation code', 400));
        }

        const { name, email, password } = newUser.user;
        const existUser = await userModel.findOne({ email });
        if (existUser) {
            return next(new ErrorHandler('Email Already Exist', 400));
        }

        const user = await userModel.create({
            name,
            email,
            password,
        });

        res.status(201).json({
            success: true,
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});


// // User Login

interface ILoginRequest {
    email: string;
    password: string
}

export const loginUser = CatchAsynsError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { email, password } = req.body as ILoginRequest;
        if (!email || !password) {
            return next(new ErrorHandler("Pleasev Enter your email and password", 400));
        }

        const user = await userModel.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid Email and Password", 400));
        }

        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid Email or password", 400));
        }



        sendToken(user, 200, res);

    } catch (error: any) {
        return next(new ErrorHandler("Invalid User or password", 400));
    }
})

// logoutuser

export const logoutUser = CatchAsynsError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });

        const userId = req.user?.id || '';

        redis.del(userId);

        res.status(200).json({
            success: true,
            message: "Logout successfully"
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})