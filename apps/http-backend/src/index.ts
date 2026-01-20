import express,{Request,Response} from "express"
import { prisma } from "@repo/db";
import jwt from "jsonwebtoken"
import { middleware } from "./middleware";
import { JWT_SECRET } from "./config";
import bcrypt from "bcrypt"
const app=express();

app.post("/signin",async(req:Request,res:Response)=>{
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
    const token= jwt.sign(user.Id,JWT_SECRET)

})
app.post("/signup",async(req:Request,res:Response)=>{
   const {email,password,name}=req.body;
   const hashedPassword=bcrypt.hash(password,108)
    await prisma.user.create({
      data:{
        name,
        email,
        password:hashedPassword
      }
    })
})
app.post("/room",middleware,(req:Request,res:Response)=>{

})
app.listen(3003)