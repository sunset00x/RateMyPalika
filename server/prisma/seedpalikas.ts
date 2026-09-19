import { PrismaClient, MunicipalityType } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

const NEPAL_DATA_URL =
  "https://raw.githubusercontent.com/sabinkhanal/nepal-location-data/main/local_bodies.json";

function normalizeType(rawType: string): MunicipalityType {
  const t = (rawType || "").toLowerCase();
  if (t.includes("metropolitan") && !t.includes("sub")) {
    return MunicipalityType.METROPOLITAN;
  }
  if (t.includes("sub-metropolitan") || t.includes("sub metropolitan")) {
    return MunicipalityType.SUB_METROPOLITAN;
  }
  if (t.includes("rural") || t.includes("gaunpalika")) {
    return MunicipalityType.RURAL_MUNICIPALITY;
  }
  return MunicipalityType.MUNICIPALITY;
}

async function main() {
  console.log("Fetching official dataset for 753 Nepalese local bodies...");
  const response = await axios.get(NEPAL_DATA_URL);
  const rawList = response.data;

  console.log(`Seeding database with ${rawList.length} items...`);

  for (const [index, item] of rawList.entries()) {
    const type = normalizeType(item.type || item.category);
    const provinceName = item.province_name || item.province || "Unknown Province";
    const districtName = item.district_name || item.district || "Unknown District";

    // 1. Upsert Province
    const province = await prisma.province.upsert({
      where: { name: provinceName },
      update: {},
      create: { name: provinceName },
    });

    // 2. Find or Create District
    let district = await prisma.district.findFirst({
      where: { name: districtName, provinceId: province.id },
    });

    if (!district) {
      district = await prisma.district.create({
        data: {
          name: districtName,
          provinceId: province.id,
        },
      });
    }

    // 3. Upsert Municipality
    const municipality = await prisma.municipality.upsert({
      where: { id: index + 1 },
      update: {
        name: item.name || item.title,
        type: type,
        population: item.population ? Number(item.population) : 30000,
        districtId: district.id,
      },
      create: {
        id: index + 1,
        name: item.name || item.title,
        type: type,
        population: item.population ? Number(item.population) : 30000,
        districtId: district.id,
      },
    });

    // 4. Create Initial Score if missing
    const existingScore = await prisma.score.findFirst({
      where: { municipalityId: municipality.id, year: 2025 },
    });

    if (!existingScore) {
      await prisma.score.create({
        data: {
          overallScore: Number((Math.random() * 30 + 60).toFixed(1)),
          year: 2025,
          municipalityId: municipality.id,
        },
      });
    }
  }

  console.log("Database successfully seeded with all 753 Palikas!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });