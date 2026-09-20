import express from "express";
import cors from "cors";
import path from "path";
import municipalityRoutes from "./routes/municipality.routes";
import prisma from "./config/db";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Handle HTML Form Submissions

// Configure EJS Template Engine for Admin GUI
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Public API Routes
app.use("/municipalities", municipalityRoutes);

// -----------------------------------------------------------------------------
// BACKEND ADMIN GUI DASHBOARD (Served at http://localhost:5000/admin)
// -----------------------------------------------------------------------------
app.get("/admin", async (req, res, next) => {
  try {
    const municipalities = await prisma.municipality.findMany({
      include: { district: true },
      orderBy: { id: "asc" },
    });

    const requests = await prisma.renameRequest.findMany({
      where: { status: "PENDING" },
      include: { municipality: true, user: true },
      orderBy: { createdAt: "desc" },
    });

    res.render("admin", { municipalities, requests });
  } catch (error) {
    next(error);
  }
});

// Admin Route: Direct Rename From Dashboard Form
app.post("/admin/municipalities/:id/rename", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    await prisma.municipality.update({
      where: { id: Number(id) },
      data: { name: name.trim() },
    });

    res.redirect("/admin");
  } catch (error) {
    next(error);
  }
});

// Admin Route: Accept Pending Citizen Proposal
app.post("/admin/requests/:id/approve", async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.renameRequest.findUnique({
      where: { id: Number(id) },
    });

    if (request) {
      await prisma.$transaction([
        prisma.municipality.update({
          where: { id: request.palikaId },
          data: { name: request.proposedName },
        }),
        prisma.renameRequest.update({
          where: { id: Number(id) },
          data: { status: "APPROVED" },
        }),
      ]);
    }

    res.redirect("/admin");
  } catch (error) {
    next(error);
  }
});

// Admin Route: Reject Pending Citizen Proposal
app.post("/admin/requests/:id/reject", async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.renameRequest.update({
      where: { id: Number(id) },
      data: { status: "REJECTED" },
    });

    res.redirect("/admin");
  } catch (error) {
    next(error);
  }
});

// Error Middleware
app.use(errorHandler);

export default app;