import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

/*
|--------------------------------------------------------------------------
| HEALTH
|--------------------------------------------------------------------------
*/

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "RateMyPalika API is running",
  });
});

/*
|--------------------------------------------------------------------------
| MUNICIPALITIES
|--------------------------------------------------------------------------
*/

app.get("/municipalities", async (_req, res) => {
  try {
    const municipalities = await prisma.municipality.findMany({
      include: {
        district: {
          include: {
            province: true,
          },
        },
        scores: {
          orderBy: {
            year: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(municipalities);
  } catch (error) {
    console.error("GET /municipalities error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load municipalities",
    });
  }
});

/*
|--------------------------------------------------------------------------
| SINGLE MUNICIPALITY
|--------------------------------------------------------------------------
*/

app.get("/municipalities/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid municipality ID",
      });
    }

    const municipality = await prisma.municipality.findUnique({
      where: {
        id,
      },
      include: {
        district: {
          include: {
            province: true,
          },
        },
        wards: true,
        scores: {
          orderBy: {
            year: "desc",
          },
        },
        budgets: {
          orderBy: {
            year: "desc",
          },
        },
        projects: {
          orderBy: {
            createdAt: "desc",
          },
        },
        reports: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!municipality) {
      return res.status(404).json({
        success: false,
        message: "Municipality not found",
      });
    }

    res.json(municipality);
  } catch (error) {
    console.error("GET /municipalities/:id error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load municipality",
    });
  }
});

/*
|--------------------------------------------------------------------------
| RANKINGS
|--------------------------------------------------------------------------
*/

app.get("/rankings", async (req, res) => {
  try {
    const year = req.query.year
      ? Number(req.query.year)
      : undefined;

    const rankings = await prisma.municipalityScore.findMany({
      where: year
        ? {
            year,
          }
        : undefined,
      include: {
        municipality: {
          include: {
            district: {
              include: {
                province: true,
              },
            },
          },
        },
      },
      orderBy: {
        overallScore: "desc",
      },
    });

    res.json(rankings);
  } catch (error) {
    console.error("GET /rankings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load rankings",
    });
  }
});

/*
|--------------------------------------------------------------------------
| DATABASE STATISTICS
|--------------------------------------------------------------------------
*/

app.get("/stats", async (_req, res) => {
  try {
    const [
      provinces,
      districts,
      municipalities,
      wards,
      projects,
      budgets,
      reports,
    ] = await Promise.all([
      prisma.province.count(),
      prisma.district.count(),
      prisma.municipality.count(),
      prisma.ward.count(),
      prisma.project.count(),
      prisma.budget.count(),
      prisma.citizenReport.count(),
    ]);

    res.json({
      provinces,
      districts,
      municipalities,
      wards,
      projects,
      budgets,
      reports,
    });
  } catch (error) {
    console.error("GET /stats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load statistics",
    });
  }
});

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled server error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(
    `ratemypalika API running on http://localhost:${PORT}`
  );
});