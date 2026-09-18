import express from "express"; import cors from "cors";
import auth from "./routes/auth.routes"; import municipalities from "./routes/municipality.routes";
import scores from "./routes/score.routes"; import reports from "./routes/report.routes"; import projects from "./routes/project.routes";
const app=express(); app.use(cors({origin:process.env.CLIENT_URL||"http://localhost:5173"})); app.use(express.json());
app.get("/api/health",(_req,res)=>res.json({success:true,message:"ratemypalika API is running"}));
app.use("/api/auth",auth); app.use("/api/municipalities",municipalities); app.use("/api/scores",scores); app.use("/api/reports",reports); app.use("/api/projects",projects);
app.use((_req,res)=>res.status(404).json({success:false,message:"Route not found"})); export default app;
