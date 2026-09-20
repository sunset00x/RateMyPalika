import express, {
  NextFunction,
  Request,
  Response,
} from "express";
import cors from "cors";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT) || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET || "ratemypalika-development-secret";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
  };
}

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

/*
|--------------------------------------------------------------------------
| Health
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
| Authentication
|--------------------------------------------------------------------------
*/

/*
POST /auth/login

Body:
{
  "email": "admin@ratemypalika.local",
  "password": "ChangeMe123!"
}
*/

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.MUNICIPALITY_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        municipalityId: user.municipalityId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Authentication Middleware
|--------------------------------------------------------------------------
*/

function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = header.substring(7);

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as {
      id: number;
      email: string;
      role: UserRole;
    };

    if (
      decoded.role !== UserRole.SUPER_ADMIN &&
      decoded.role !== UserRole.MUNICIPALITY_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

/*
|--------------------------------------------------------------------------
| PUBLIC MUNICIPALITIES
|--------------------------------------------------------------------------
*/

app.get("/municipalities", async (_req, res) => {
  try {
    const municipalities =
      await prisma.municipality.findMany({
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
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load municipalities",
    });
  }
});

/*
|--------------------------------------------------------------------------
| PUBLIC MUNICIPALITY DETAIL
|--------------------------------------------------------------------------
*/

app.get(
  "/municipalities/:id",
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid municipality ID",
        });
      }

      const municipality =
        await prisma.municipality.findUnique({
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
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Failed to load municipality",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/

app.get(
  "/admin/stats",
  requireAdmin,
  async (_req: AuthRequest, res) => {
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
        success: true,

        stats: {
          provinces,
          districts,
          municipalities,
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
        message: "Failed to load admin statistics",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN MUNICIPALITIES
|--------------------------------------------------------------------------
*/

app.get(
  "/admin/municipalities",
  requireAdmin,
  async (_req: AuthRequest, res) => {
    try {
      const municipalities =
        await prisma.municipality.findMany({
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
        message: "Failed to load admin municipalities",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADMIN UPDATE MUNICIPALITY
|--------------------------------------------------------------------------
*/

app.put(
  "/admin/municipalities/:id",
  requireAdmin,
  async (req: AuthRequest, res) => {
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
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Municipality name is required",
        });
      }

      const validTypes = [
        "METROPOLITAN",
        "SUB_METROPOLITAN",
        "MUNICIPALITY",
        "RURAL_MUNICIPALITY",
      ];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid municipality type",
        });
      }

      const updated =
        await prisma.municipality.update({
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
        });

      res.json({
        success: true,
        message: "Municipality updated successfully",
        municipality: updated,
      });
    } catch (error) {
      console.error(
        "Update municipality error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to update municipality",
      });
    }
  }
);

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

    const rankings =
      await prisma.municipalityScore.findMany({
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
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load rankings",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GENERAL STATS
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
    console.error(error);

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
| Start
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(
    `ratemypalika API running on http://localhost:${PORT}`
  );
});