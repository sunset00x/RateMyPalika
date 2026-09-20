import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient, MunicipalityType } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

/* =========================================================
   ADMIN CONFIG
========================================================= */

const ADMIN_EMAIL = "admin@ratemypalika.local";
const ADMIN_PASSWORD = "ChangeMe123!";

/* =========================================================
   TYPES
========================================================= */

interface AdminRequest extends Request {
  isAdmin?: boolean;
}

/* =========================================================
   SIMPLE ADMIN AUTH
   Development version
========================================================= */

function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  const adminToken = req.headers["x-admin-token"];

  if (adminToken !== "ratemypalika-admin-session") {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required",
    });
  }

  req.isAdmin = true;
  next();
}

/* =========================================================
   HEALTH
========================================================= */

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "RateMyPalika API is running",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({
      success: true,
      token: "ratemypalika-admin-session",
      admin: {
        email: ADMIN_EMAIL,
        role: "ADMIN",
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid email or password",
  });
});

/* =========================================================
   GET ALL MUNICIPALITIES
========================================================= */

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

    const formatted = municipalities.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      population: m.population,

      district: {
        id: m.district.id,
        name: m.district.name,
      },

      province: {
        id: m.district.province.id,
        name: m.district.province.name,
      },

      overallScore: m.scores[0]?.overallScore ?? null,
      scoreYear: m.scores[0]?.year ?? null,
    }));

    res.json({
      success: true,
      count: formatted.length,
      municipalities: formatted,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch municipalities",
    });
  }
});

/* =========================================================
   GET SINGLE MUNICIPALITY
========================================================= */

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

        scores: {
          orderBy: {
            year: "desc",
          },
        },

        wards: true,
        projects: true,
        budgets: {
          orderBy: {
            fiscalYear: "desc",
          },
        },
        citizenReports: true,
      },
    });

    if (!municipality) {
      return res.status(404).json({
        success: false,
        message: "Municipality not found",
      });
    }

    res.json({
      success: true,
      municipality,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch municipality",
    });
  }
});

/* =========================================================
   PROVINCE MUNICIPALITIES
========================================================= */

app.get("/provinces/:provinceId/municipalities", async (req, res) => {
  try {
    const provinceId = Number(req.params.provinceId);

    const municipalities = await prisma.municipality.findMany({
      where: {
        district: {
          provinceId,
        },
      },
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

    res.json({
      success: true,
      municipalities,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch municipalities",
    });
  }
});

/* =========================================================
   RANKINGS
========================================================= */

app.get("/rankings", async (_req, res) => {
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
    });

    const rankings = municipalities
      .map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        district: m.district.name,
        province: m.district.province.name,
        score: m.scores[0]?.overallScore ?? 0,
        year: m.scores[0]?.year ?? null,
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    res.json({
      success: true,
      rankings,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to generate rankings",
    });
  }
});

/* =========================================================
   GENERAL STATS
========================================================= */

app.get("/stats", async (_req, res) => {
  try {
    const [
      municipalities,
      provinces,
      districts,
      wards,
      projects,
      budgets,
      reports,
    ] = await Promise.all([
      prisma.municipality.count(),
      prisma.province.count(),
      prisma.district.count(),
      prisma.ward.count(),
      prisma.project.count(),
      prisma.budget.count(),
      prisma.citizenReport.count(),
    ]);

    res.json({
      success: true,
      stats: {
        municipalities,
        provinces,
        districts,
        wards,
        projects,
        budgets,
        reports,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

/* =========================================================
   ADMIN STATS
========================================================= */

app.get("/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const [
      municipalities,
      provinces,
      districts,
      projects,
      budgets,
      reports,
    ] = await Promise.all([
      prisma.municipality.count(),
      prisma.province.count(),
      prisma.district.count(),
      prisma.project.count(),
      prisma.budget.count(),
      prisma.citizenReport.count(),
    ]);

    res.json({
      success: true,
      stats: {
        municipalities,
        provinces,
        districts,
        projects,
        budgets,
        reports,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
    });
  }
});

/* =========================================================
   ADMIN - GET MUNICIPALITIES
========================================================= */

app.get("/admin/municipalities", requireAdmin, async (_req, res) => {
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

        _count: {
          select: {
            wards: true,
            projects: true,
            budgets: true,
            citizenReports: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      municipalities,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch admin municipalities",
    });
  }
});

/* =========================================================
   ADMIN - GET ONE MUNICIPALITY
========================================================= */

app.get(
  "/admin/municipalities/:id",
  requireAdmin,
  async (req, res) => {
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

          scores: {
            orderBy: {
              year: "desc",
            },
          },

          wards: true,
          projects: true,
          budgets: true,
          citizenReports: true,
        },
      });

      if (!municipality) {
        return res.status(404).json({
          success: false,
          message: "Municipality not found",
        });
      }

      res.json({
        success: true,
        municipality,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch municipality",
      });
    }
  }
);

/* =========================================================
   ADMIN - EDIT MUNICIPALITY
========================================================= */

app.put(
  "/admin/municipalities/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid municipality ID",
        });
      }

      const {
        name,
        type,
        population,
        districtId,
      } = req.body;

      /* ---------------------------------------------
         Validation
      --------------------------------------------- */

      if (!name || typeof name !== "string") {
        return res.status(400).json({
          success: false,
          message: "Municipality name is required",
        });
      }

      const validTypes = Object.values(MunicipalityType);

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid municipality type",
          validTypes,
        });
      }

      if (
        population !== null &&
        population !== undefined &&
        (!Number.isInteger(Number(population)) ||
          Number(population) < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Population must be a positive integer",
        });
      }

      if (!districtId || Number.isNaN(Number(districtId))) {
        return res.status(400).json({
          success: false,
          message: "Valid district ID is required",
        });
      }

      /* ---------------------------------------------
         Check municipality
      --------------------------------------------- */

      const existing = await prisma.municipality.findUnique({
        where: {
          id,
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Municipality not found",
        });
      }

      /* ---------------------------------------------
         Check district
      --------------------------------------------- */

      const district = await prisma.district.findUnique({
        where: {
          id: Number(districtId),
        },
      });

      if (!district) {
        return res.status(400).json({
          success: false,
          message: "District not found",
        });
      }

      /* ---------------------------------------------
         Update
      --------------------------------------------- */

      const updated = await prisma.municipality.update({
        where: {
          id,
        },

        data: {
          name: name.trim(),
          type,
          population:
            population === null ||
            population === undefined ||
            population === ""
              ? null
              : Number(population),
          districtId: Number(districtId),
        },

        include: {
          district: {
            include: {
              province: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: "Municipality updated successfully",
        municipality: updated,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to update municipality",
      });
    }
  }
);

/* =========================================================
   ADMIN - GET PROVINCES
========================================================= */

app.get("/admin/provinces", requireAdmin, async (_req, res) => {
  try {
    const provinces = await prisma.province.findMany({
      include: {
        districts: {
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      provinces,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch provinces",
    });
  }
});

/* =========================================================
   ADMIN - GET DISTRICTS
========================================================= */

app.get("/admin/districts", requireAdmin, async (_req, res) => {
  try {
    const districts = await prisma.district.findMany({
      include: {
        province: true,
      },

      orderBy: {
        name: "asc",
      },
    });

    res.json({
      success: true,
      districts,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch districts",
    });
  }
});

/* =========================================================
   ADMIN - UPDATE SCORE
========================================================= */

app.put(
  "/admin/municipalities/:id/score",
  requireAdmin,
  async (req, res) => {
    try {
      const municipalityId = Number(req.params.id);
      const { score, year } = req.body;

      if (Number.isNaN(municipalityId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid municipality ID",
        });
      }

      const numericScore = Number(score);
      const numericYear = Number(year);

      if (
        Number.isNaN(numericScore) ||
        numericScore < 0 ||
        numericScore > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Score must be between 0 and 100",
        });
      }

      if (
        Number.isNaN(numericYear) ||
        numericYear < 2000 ||
        numericYear > 2100
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid year",
        });
      }

      const municipality = await prisma.municipality.findUnique({
        where: {
          id: municipalityId,
        },
      });

      if (!municipality) {
        return res.status(404).json({
          success: false,
          message: "Municipality not found",
        });
      }

      const existingScore = await prisma.score.findFirst({
        where: {
          municipalityId,
          year: numericYear,
        },
      });

      let result;

      if (existingScore) {
        result = await prisma.score.update({
          where: {
            id: existingScore.id,
          },
          data: {
            overallScore: numericScore,
          },
        });
      } else {
        result = await prisma.score.create({
          data: {
            municipalityId,
            year: numericYear,
            overallScore: numericScore,
          },
        });
      }

      res.json({
        success: true,
        message: "Score updated successfully",
        score: result,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to update score",
      });
    }
  }
);

/* =========================================================
   404
========================================================= */

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (
    error: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    await prisma.$connect();

    console.log("PostgreSQL database connected");

    app.listen(PORT, () => {
      console.log(
        `RateMyPalika API running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();

/* =========================================================
   SHUTDOWN
========================================================= */

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});