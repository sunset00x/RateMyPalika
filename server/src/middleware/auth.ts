import {NextFunction,Request,Response} from "express";
import jwt from "jsonwebtoken";
import {UserRole} from "@prisma/client";
export interface AuthRequest extends Request { user?: {id:number;role:UserRole} }
export function authenticate(req:AuthRequest,res:Response,next:NextFunction){
 const h=req.headers.authorization; const token=h?.startsWith("Bearer ")?h.slice(7):null;
 if(!token)return res.status(401).json({success:false,message:"Authentication required"});
 try{const p=jwt.verify(token,process.env.JWT_SECRET||"dev-secret") as {id:number;role:UserRole};req.user={id:p.id,role:p.role};next()}
 catch{return res.status(401).json({success:false,message:"Invalid or expired token"})}
}
export function requireRoles(...roles:UserRole[]){return (req:AuthRequest,res:Response,next:NextFunction)=>{if(!req.user||!roles.includes(req.user.role))return res.status(403).json({success:false,message:"Insufficient permissions"});next()}}
