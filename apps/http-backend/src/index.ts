import express,{Request,Response} from "express"
import { prisma } from "@repo/db";
import jwt from "jsonwebtoken"
import { middleware } from "./middleware";
import {JWT_SECRET} from "@repo/backend-common";
import {CreateUserSchema,signinSchema,roomSchema} from "@repo/common"
import bcrypt from "bcrypt"
const app=express();
app.use(express.json());

app.post("/signin",async(req:Request,res:Response)=>{
  const parseddata= signinSchema.safeParse(req.body)
  if(!parseddata.success){
    res.json({
      message:"Incorrect Input"
    })
    return;
  } 
    const user=await prisma.user.findFirst({
      where:{
        email:parseddata.data.email
      }
    })
    if(!user){
       res.status(403).json({
       message:"No user found"
        })
        return;
    }
      console.log("user found")
    const check=await bcrypt.compare(parseddata.data.password,user.password)
    if(!check) {
       res.status(403).json({
       message:"Incorrect password"
        })
        return;
    }
    const token= jwt.sign({userId:user?.id},JWT_SECRET,{expiresIn:"7d"});
     res.status(200).json({
       message:"you are logged in",
       token
      })

})
app.post("/signup",async(req:Request,res:Response)=>{
  const parseddata=CreateUserSchema.safeParse(req.body)
  if(!parseddata.success){
    console.log(parseddata.error.issues[0])
    res.json({
      message:"Incorrect Input"
    })
    return;
  }
   const hashedPassword=await bcrypt.hash(parseddata.data.password,10)
   try{
     await prisma.User.create({
      data:{
        name:parseddata.data.name,
        email:parseddata.data.email,
        password:hashedPassword
      }
    })
    res.json({
      msg:"user created"
    })
  }
    catch{
      res.status(409).json({
        message:"user already exist with this username"
      })
    }
})
   
   
app.post("/room",middleware,async(req:Request,res:Response)=>{
const parseddata=roomSchema.safeParse(req.body)
  if(!parseddata.success){
    res.json({
      message:"Incorrect Input"
    })
    return;
  }
  const Userid=req.userId;
  try{
    const room=await prisma.Room.create({
    data:{
      slug:parseddata.data.RoomName,
      userCount:0,
      adminId:Userid
    }
  })
  res.json({
    message:"Room Created",
    roomId:room.id
  })
  }catch{
    res.status(400).json({
      messag:"can,t create room !try another name"
    })
  }
  
})

app.listen(3003,()=>{
  console.log("server is running")
})