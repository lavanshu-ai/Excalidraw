import express,{Request,Response} from "express"
import { prisma } from "@repo/db";
const app=express();

app.get("/signin",async(req:Request,res:Response)=>{
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

})
app.post("/signup",async(req:Request,res:Response)=>{
   const {email,password,name}=req.body;
    await prisma.user.create({
      data:{
        name,
        email,
        password
      }
    })
})
app.listen(3003)