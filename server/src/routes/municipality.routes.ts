import { Router, Request, Response, NextFunction } from "express";
import prisma from "../config/db";

const router = Router();

// GET /municipalities - Return all municipalities for frontend components
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const municipalities = await prisma.municipality.findMany({
      include: {
        district: {
          include: {
            province: true,
          },
        },
        scores: {
          where: { year: 2025 },
          take: 1,
        },
      },
      orderBy: { id: "asc" },
    });

    res.json(municipalities);
  } catch (error) {
    next(error);
  }
});

export default router;