import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config";

export function middleware(req:Request,res:Response,next:NextFunction){

  const token =req.header("authorization")??"";
  const decoded=jwt.verify(token,JWT_SECRET)
  if (typeof decoded === "string" || !decoded) {
    
    res.status(403).json({
      message:"unauthorized"
    })
  }
  else{
     req.userId=decoded.userId;
    next();
  }
}