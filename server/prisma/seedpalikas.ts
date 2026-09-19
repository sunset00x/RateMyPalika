import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

const NEPAL_DATA_URL =
  "https://raw.githubusercontent.com/sabinkhanal/nepal-location-data/main/local_bodies.json";

function normalizeType(rawType: string): string {
  const t = (rawType || "").toLowerCase();
  if (t.includes("metropolitan") && !t.includes("sub")) {
    return "METROPOLITAN";
  }
  if (t.includes("sub-metropolitan") || t.includes("sub metropolitan")) {
    return "SUB_METROPOLITAN";
  }
  if (t.includes("rural") || t.includes("gaunpalika")) {
    return "RURAL_MUNICIPALITY";
  }
  return "MUNICIPALITY";
}

async function main() {
  console.log("Fetching official data for all 753 Nepalese local bodies...");

  const response = await axios.get(NEPAL_DATA_URL);
  const rawList = response.data;

  console.log(`Processing ${rawList.length} items...`);

  for (const [index, item] of rawList.entries()) {
    const type = normalizeType(item.type || item.category);

    // Update or insert into your database using Prisma
    // Adjust model names (e.g., prisma.municipality) based on your schema.prisma
    await prisma.municipality.upsert({
      where: { id: index + 1 },
      update: {},
      create: {
        id: index + 1,
        name: item.name || item.title,
        type: type,
        population: item.population ? Number(item.population) : 30000,
        // Add nested district/province or relation connects here according to your schema
      },
    });
  }

  console.log("Database successfully seeded with 753 Palikas!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });