import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const salon = await prisma.salon.upsert({
    where: { id: "default-salon" },
    update: {},
    create: {
      id: "default-salon",
      name: "Barber Shop Dortmund",
      bookingIntervalMinutes: 15,
      bookingLeadHours: 0,
      confirmationHours: 24,
      reminderHours: 2,
    },
  });

  const ali = await prisma.barber.upsert({
    where: { id: "barber-ali" },
    update: {},
    create: {
      id: "barber-ali",
      name: "Ali",
      salonId: salon.id,
    },
  });

  const mehmet = await prisma.barber.upsert({
    where: { id: "barber-mehmet" },
    update: {},
    create: {
      id: "barber-mehmet",
      name: "Mehmet",
      salonId: salon.id,
    },
  });

  await prisma.service.upsert({
    where: { id: "service-haircut" },
    update: {},
    create: {
      id: "service-haircut",
      name: "Haarschnitt",
      durationMinutes: 30,
      salonId: salon.id,
    },
  });

  await prisma.service.upsert({
    where: { id: "service-beard" },
    update: {},
    create: {
      id: "service-beard",
      name: "Bart",
      durationMinutes: 20,
      salonId: salon.id,
    },
  });

  await prisma.service.upsert({
    where: { id: "service-haircut-beard" },
    update: {},
    create: {
      id: "service-haircut-beard",
      name: "Haarschnitt + Bart",
      durationMinutes: 45,
      salonId: salon.id,
    },
  });

  for (const barber of [ali, mehmet]) {
    for (const weekday of [1, 2, 3, 4, 5, 6]) {
      const existing = await prisma.workingHour.findFirst({
        where: {
          barberId: barber.id,
          weekday,
        },
      });

      if (!existing) {
        await prisma.workingHour.create({
          data: {
            barberId: barber.id,
            weekday,
            startTime: "10:00",
            endTime: "19:00",
          },
        });
      }
    }
  }

  console.log("Seed fertig");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });