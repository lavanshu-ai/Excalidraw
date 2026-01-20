import { Request } from "express";
import "jsonwebtoken"
declare global {
  namespace Express{
  interface Request{
    userId?:string;
  }
  }
}

declare module "jsonwebtoken"{
 export interface JwtPayload {
    userId: string;
 }
}