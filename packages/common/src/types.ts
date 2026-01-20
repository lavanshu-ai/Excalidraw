import {z} from "zod"

export const CreateUserSchema=z.object({
  name:z.string().min(3,"too short").max(20),
  email:z.email("enter valid email").min(3).max(50),
  password:z.string().min(8,"password is too short")
   .regex(/[a-z]/,"at least 1 lower case letter")
   .regex(/[A-Z]/,"at least 1 upper case letter")
   .regex(/\d/,"at least 1 number")
})

export const signinSchema=z.object({
  email:z.email("enter valid email").min(3).max(50),
  password:z.string().min(8,"password is too short")
   .regex(/[a-z]/,"at least 1 lower case letter")
   .regex(/[A-Z]/,"at least 1 upper case letter")
   .regex(/\d/,"at least 1 number")
})

export const roomSchema=z.object({
  RoomName:z.string().min(3,"too short")
})