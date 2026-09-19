import express from "express";
import cors from "cors";
import municipalityRoutes from "./routes/municipality.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/municipalities", municipalityRoutes);

// Error Middleware
app.use(errorHandler);

export default app;