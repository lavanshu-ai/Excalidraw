import express,{Request,Response} from "express"
import { prisma } from "@repo/db";
import jwt from "jsonwebtoken"
import { middleware } from "./middleware";
import {JWT_SECRET} from "@repo/backend-common"
import {CreateUserSchema,signinSchema,roomSchema} from "@repo/common"
import bcrypt from "bcrypt"
const app=express();

app.post("/signin",async(req:Request,res:Response)=>{
  const data=await signinSchema.safeParse(req.body)
  if(!data.success){
    res.json({
      message:"Incorrect Input"
    })
    return;
  }

   const {email,password}=req.body;
    const user=await prisma.user.findFirst({
      where:{
        email
      }
    })
    if(!user){
       res.status(403).json({
       message:"No user found"
        })
    }
    res.status(200).json({
    message:"you are logged in"
    })
    const token= jwt.sign(user.Id,JWT_SECRET);
    localStorage.setItem(token,"authorization");


})
app.post("/signup",async(req:Request,res:Response)=>{
  const data=await CreateUserSchema.safeParse(req.body)
  if(!data.success){
    res.json({
      message:"Incorrect Input"
    })
    return;
  }
   const {email,password,name}=req.body;
   const hashedPassword=bcrypt.hash(password,108)
   try{
     await prisma.user.create({
      data:{
        name,
        email,
        password:hashedPassword
      }
    })}
    catch{
      res.status(411).json({
        message:"user already exist with this user name"
      })
    }
})
   
   
app.post("/room",middleware,async(req:Request,res:Response)=>{
const data=await roomSchema.safeParse(req.body)
  if(!data.success){
    res.json({
      message:"Incorrect Input"
    })
    return;
  }
})
app.listen(3003)