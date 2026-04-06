import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const salon = await prisma.salon.create({
    data: {
      name: "Barber Shop Dortmund",
    },
  });

  const ali = await prisma.barber.create({
    data: {
      name: "Ali",
      salonId: salon.id,
    },
  });

  const mehmet = await prisma.barber.create({
    data: {
      name: "Mehmet",
      salonId: salon.id,
    },
  });

  const yusuf = await prisma.barber.create({
    data: {
      name: "Yusuf",
      salonId: salon.id,
    },
  });

  await prisma.service.create({
    data: {
      name: "Haarschnitt",
      durationMinutes: 30,
      salonId: salon.id,
    },
  });

  await prisma.service.create({
    data: {
      name: "Haarschnitt + Bart",
      durationMinutes: 45,
      salonId: salon.id,
    },
  });

  const barbers = [ali, mehmet, yusuf];

  for (const barber of barbers) {
    for (let weekday = 1; weekday <= 6; weekday++) {
      await prisma.workingHour.create({
        data: {
          barberId: barber.id,
          weekday,
          startTime: "10:00",
          endTime: "20:00",
        },
      });
    }
  }

  console.log("SEED FERTIG");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });