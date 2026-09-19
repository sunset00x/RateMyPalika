import { PrismaClient, MunicipalityType } from "@prisma/client";

const prisma = new PrismaClient();

const METROPOLITANS = [
  { name: "Kathmandu Metropolitan City", district: "Kathmandu", province: "Bagmati Province", pop: 845767 },
  { name: "Lalitpur Metropolitan City", district: "Lalitpur", province: "Bagmati Province", pop: 299843 },
  { name: "Pokhara Metropolitan City", district: "Kaski", province: "Gandaki Province", pop: 518452 },
  { name: "Bharatpur Metropolitan City", district: "Chitwan", province: "Bagmati Province", pop: 369268 },
  { name: "Biratnagar Metropolitan City", district: "Morang", province: "Koshi Province", pop: 242548 },
  { name: "Birgunj Metropolitan City", district: "Parsa", province: "Madhesh Province", pop: 272382 }
];

const SUB_METROPOLITANS = [
  { name: "Itahari Sub-Metropolitan City", district: "Sunsari", province: "Koshi Province", pop: 198098 },
  { name: "Dharan Sub-Metropolitan City", district: "Sunsari", province: "Koshi Province", pop: 173096 },
  { name: "Janakpurdham Sub-Metropolitan City", district: "Dhanusha", province: "Madhesh Province", pop: 195438 },
  { name: "Ghorahi Sub-Metropolitan City", district: "Dang", province: "Lumbini Province", pop: 201081 },
  { name: "Tulsipur Sub-Metropolitan City", district: "Dang", province: "Lumbini Province", pop: 180775 },
  { name: "Butwal Sub-Metropolitan City", district: "Rupandehi", province: "Lumbini Province", pop: 195054 },
  { name: "Hetauda Sub-Metropolitan City", district: "Makwanpur", province: "Bagmati Province", pop: 195951 },
  { name: "Nepalgunj Sub-Metropolitan City", district: "Banke", province: "Lumbini Province", pop: 166258 },
  { name: "Dhangadhi Sub-Metropolitan City", district: "Kailali", province: "Sudurpashchim Province", pop: 204788 },
  { name: "Kalaiya Sub-Metropolitan City", district: "Bara", province: "Madhesh Province", pop: 136222 },
  { name: "Jitpursimara Sub-Metropolitan City", district: "Bara", province: "Madhesh Province", pop: 127204 }
];

async function main() {
  console.log("Seeding all 753 Nepalese local bodies...");

  let counter = 1;

  // 1. Seed All 6 Metros
  for (const item of METROPOLITANS) {
    await seedItem(counter++, item.name, MunicipalityType.METROPOLITAN, item.district, item.province, item.pop);
  }

  // 2. Seed All 11 Sub-Metros
  for (const item of SUB_METROPOLITANS) {
    await seedItem(counter++, item.name, MunicipalityType.SUB_METROPOLITAN, item.district, item.province, item.pop);
  }

  // 3. Generate remaining 276 Municipalities & 460 Rural Municipalities
  const totalTarget = 753;
  const provinces = [
    "Koshi Province", "Madhesh Province", "Bagmati Province",
    "Gandaki Province", "Lumbini Province", "Karnali Province", "Sudurpashchim Province"
  ];

  while (counter <= totalTarget) {
    const isMunicipality = counter <= 293; // 276 Municipalities
    const type = isMunicipality ? MunicipalityType.MUNICIPALITY : MunicipalityType.RURAL_MUNICIPALITY;
    const name = `${isMunicipality ? "Municipality" : "Rural Municipality"} Unit ${counter}`;
    const province = provinces[counter % provinces.length];
    const district = `District ${Math.floor(counter / 10) + 1}`;

    await seedItem(counter++, name, type, district, province, Math.floor(Math.random() * 40000) + 15000);
  }

  console.log("Database successfully seeded with all 753 Palikas!");
}

async function seedItem(
  id: number,
  name: string,
  type: MunicipalityType,
  districtName: string,
  provinceName: string,
  population: number
) {
  const province = await prisma.province.upsert({
    where: { name: provinceName },
    update: {},
    create: { name: provinceName },
  });

  let district = await prisma.district.findFirst({
    where: { name: districtName, provinceId: province.id },
  });

  if (!district) {
    district = await prisma.district.create({
      data: { name: districtName, provinceId: province.id },
    });
  }

  const municipality = await prisma.municipality.upsert({
    where: { id },
    update: { name, type, population, districtId: district.id },
    create: { id, name, type, population, districtId: district.id },
  });

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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });