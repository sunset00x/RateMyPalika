import {Router} from "express"; import {prisma} from "../config/database"; const r=Router();
r.get("/",async(_req,res)=>{const data=await prisma.municipality.findMany({include:{district:{include:{province:true}}},orderBy:{name:"asc"}});res.json({success:true,data})});
r.get("/:id",async(req,res)=>{const data=await prisma.municipality.findUnique({where:{id:Number(req.params.id)},include:{district:{include:{province:true}},wards:true,scores:{orderBy:{year:"desc"}},projects:true,budgets:true,indicatorValues:{include:{indicator:{include:{category:true}},source:true}}}});if(!data)return res.status(404).json({success:false,message:"Municipality not found"});res.json({success:true,data})});
export default r;
