import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------------
// 1. GET ALL MUNICIPALITIES (for Municipalities.tsx & Ranking.tsx)
// -----------------------------------------------------------------------------
app.get("/municipalities", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const municipalities = await prisma.municipality.findMany({
      include: {
        district: {
          include: {
            province: true,
          },
        },
        scores: {
          orderBy: { year: "desc" },
          take: 1,
        },
        wards: true,
      },
      orderBy: { id: "asc" },
    });

    res.json(municipalities);
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------
// 2. GET SINGLE MUNICIPALITY BY ID (for Detail View)
// -----------------------------------------------------------------------------
app.get("/municipalities/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const municipality = await prisma.municipality.findUnique({
      where: { id: Number(id) },
      include: {
        district: {
          include: {
            province: true,
          },
        },
        scores: {
          orderBy: { year: "desc" },
        },
        wards: true,
        projects: true,
        budgets: true,
        citizenReports: true,
      },
    });

    if (!municipality) {
      return res.status(404).json({ error: "Municipality not found" });
    }

    res.json(municipality);
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------
// 3. SCORES ENDPOINTS (uses prisma.score in lowercase)
// -----------------------------------------------------------------------------
app.get("/scores", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scores = await prisma.score.findMany({
      include: {
        municipality: true,
      },
      orderBy: { year: "desc" },
    });
    res.json(scores);
  } catch (error) {
    next(error);
  }
});

app.post("/scores", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { overallScore, year, municipalityId } = req.body;
    const newScore = await prisma.score.create({
      data: {
        overallScore: Number(overallScore),
        year: Number(year),
        municipalityId: Number(municipalityId),
      },
    });
    res.status(201).json(newScore);
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------
// 4. AUXILIARY ENTITY ROUTE HANDLERS
// -----------------------------------------------------------------------------

// Wards Handler
app.get("/wards", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wards = await prisma.ward.findMany();
    res.json(wards);
  } catch (error) {
    next(error);
  }
});

// Projects Handler
app.get("/projects", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Budgets Handler
app.get("/budgets", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budgets = await prisma.budget.findMany();
    res.json(budgets);
  } catch (error) {
    next(error);
  }
});

// Citizen Reports Handler
app.get("/citizen-reports", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.citizenReport.findMany();
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// -----------------------------------------------------------------------------
// GLOBAL ERROR MIDDLEWARE & SERVER INITIALIZATION
// -----------------------------------------------------------------------------
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Internal Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`RateMyPalika backend running on http://localhost:${PORT}`);
});