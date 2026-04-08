import { prisma } from "../../lib/prisma";
import { generateSlots } from "../../lib/availability";

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildLocalDateTime(dateString: string, timeString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

type SlotResult = {
  start: string;
  end: string;
  barberId: string;
  barberName: string;
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{
    serviceId?: string;
    date?: string;
    success?: string; // ✅ NEU
  }>;
}) {
  const params = await searchParams;

  const success = params.success === "1"; // ✅ NEU

  const salon = await prisma.salon.findFirst();

  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });

  const barbers = await prisma.barber.findMany({
    orderBy: { name: "asc" },
  });

  const selectedService =
    services.find((s) => s.id === params.serviceId) ?? services[0];

  const today = new Date();
  const todayKey = toLocalDateKey(today);

  const selectedDate = params.date ?? todayKey;
  const weekday = buildLocalDateTime(selectedDate, "12:00").getDay();

  const groupedSlots: {
    barberId: string;
    barberName: string;
    slots: SlotResult[];
  }[] = [];

  const leadHours = salon?.bookingLeadHours || 0;
  const bookingInterval = salon?.bookingIntervalMinutes || 15;
  const minAllowedDateTime = new Date(today.getTime() + leadHours * 60 * 60 * 1000);

  if (selectedService) {
    for (const barber of barbers) {
      const working = await prisma.workingHour.findFirst({
        where: {
          barberId: barber.id,
          weekday,
        },
      });

      if (!working) continue;

      const allSlots = generateSlots(
        working.startTime,
        working.endTime,
        selectedService.durationMinutes,
        bookingInterval
      );

      const dayStart = new Date(`${selectedDate}T00:00:00.000Z`);
      const dayEnd = new Date(`${selectedDate}T23:59:59.999Z`);

      const appointments = await prisma.appointment.findMany({
        where: {
          barberId: barber.id,
          startAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      const breaks = await prisma.breakTime.findMany({
        where: {
          barberId: barber.id,
          startDate: {
            lte: selectedDate,
          },
          endDate: {
            gte: selectedDate,
          },
        },
      });

      const freeSlots = allSlots.filter((slot) => {
        const slotStartMinutes = toMinutes(slot.start);
        const slotEndMinutes = toMinutes(slot.end);

        const overlapsAppointment = appointments.some((a) => {
          const aStart =
            new Date(a.startAt).getUTCHours() * 60 +
            new Date(a.startAt).getUTCMinutes();

          const aEnd =
            new Date(a.endAt).getUTCHours() * 60 +
            new Date(a.endAt).getUTCMinutes();

          return slotStartMinutes < aEnd && slotEndMinutes > aStart;
        });

        const overlapsBreak = breaks.some((b) => {
          if (b.isFullDay) return true;
          if (!b.startTime || !b.endTime) return false;

          const bStart = toMinutes(b.startTime);
          const bEnd = toMinutes(b.endTime);

          return slotStartMinutes < bEnd && slotEndMinutes > bStart;
        });

        const slotStartLocal = buildLocalDateTime(selectedDate, slot.start);
        const respectsLeadTime =
          slotStartLocal.getTime() >= minAllowedDateTime.getTime();

        return !overlapsAppointment && !overlapsBreak && respectsLeadTime;
      });

      groupedSlots.push({
        barberId: barber.id,
        barberName: barber.name,
        slots: freeSlots.map((slot) => ({
          start: slot.start,
          end: slot.end,
          barberId: barber.id,
          barberName: barber.name,
        })),
      });
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md space-y-6 px-4 py-6 sm:max-w-2xl lg:max-w-5xl">

        {/* ✅ NEU: Erfolgsmeldung */}
        {success && (
          <section className="rounded-[24px] border border-green-500/30 bg-green-500/10 p-4 text-green-100 shadow-xl">
            <div className="text-lg font-semibold">
              Termin erfolgreich gebucht ✅
            </div>
            <div className="mt-1 text-sm text-green-200">
              Du hast eine WhatsApp-Nachricht mit weiteren Infos erhalten.
            </div>
          </section>

        <section className="rounded-[28px] bg-white p-5 text-black shadow-2xl">
          <h2 className="mb-4 text-xl font-semibold sm:text-2xl">
            1. Wähle deine Behandlung
          </h2>

          <form method="GET" className="grid gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Behandlung
              </label>
              <select
                name="serviceId"
                defaultValue={selectedService?.id}
                className="min-h-[52px] w-full rounded-2xl border border-neutral-300 px-4 text-base outline-none"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} Min)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Datum
              </label>
              <input
                type="date"
                name="date"
                defaultValue={selectedDate}
                className="min-h-[52px] w-full rounded-2xl border border-neutral-300 px-4 text-base outline-none"
              />
            </div>

            <button className="min-h-[54px] w-full rounded-2xl bg-black px-4 text-base font-semibold text-white">
              Freie Termine anzeigen
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">2. Wähle deine Uhrzeit</h2>
              <p className="text-sm text-neutral-400">
                Alle freien Termine für {selectedDate}
              </p>
              {leadHours > 0 && (
                <p className="mt-1 text-sm text-yellow-300">
                  Buchungen sind nur mindestens {leadHours} Stunden im Voraus möglich.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-300">
              {selectedDate}
            </div>
          </div>

          {groupedSlots.every((group) => group.slots.length === 0) && (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-6 text-center text-neutral-300">
              Für dieses Datum sind aktuell keine freien Termine verfügbar.
            </div>
          )}

          <div className="space-y-5">
            {groupedSlots.map((group) => (
              <div
                key={group.barberId}
                className="rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">{group.barberName}</h3>
                    <p className="text-sm text-neutral-400">
                      {group.slots.length} freie Termine
                    </p>
                  </div>
                </div>

                {group.slots.length === 0 ? (
                  <div className="rounded-2xl bg-black/20 p-4 text-sm text-neutral-400">
                    Bei {group.barberName} ist an diesem Tag nichts mehr frei.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.slots.map((slot) => (
                      <details
                        key={`${slot.barberId}-${slot.start}-${slot.end}`}
                        className="rounded-2xl bg-white p-4 text-black shadow"
                      >
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold">
                                {slot.start}
                              </div>
                              <div className="text-sm text-neutral-500">
                                bis {slot.end}
                              </div>
                              <div className="mt-1 text-sm font-medium text-neutral-700">
                                {slot.barberName}
                              </div>
                            </div>

                            <div className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white">
                              Weiter
                            </div>
                          </div>
                        </summary>

                        <form
                          method="POST"
                          action="/api/book"
                          className="mt-4 space-y-3 border-t border-neutral-200 pt-4"
                        >
                          <input type="hidden" name="barberId" value={slot.barberId} />
                          <input type="hidden" name="serviceId" value={selectedService.id} />
                          <input type="hidden" name="date" value={selectedDate} />
                          <input type="hidden" name="start" value={slot.start} />
                          <input type="hidden" name="end" value={slot.end} />

                          <div className="text-sm font-medium text-neutral-700">
                            3. Trage deine Daten ein
                          </div>

                          <div className="rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
                            Friseur: <span className="font-semibold">{slot.barberName}</span>
                          </div>

                          <input
                            name="firstName"
                            placeholder="Vorname"
                            required
                            className="min-h-[48px] w-full rounded-xl border border-neutral-300 px-3"
                          />

                          <input
                            name="lastName"
                            placeholder="Nachname"
                            required
                            className="min-h-[48px] w-full rounded-xl border border-neutral-300 px-3"
                          />

                          <input
                            name="phone"
                            placeholder="WhatsApp Nummer, z. B. +49123456789"
                            required
                            className="min-h-[48px] w-full rounded-xl border border-neutral-300 px-3"
                          />

                          <button className="min-h-[50px] w-full rounded-xl bg-black px-4 font-semibold text-white">
                            Termin jetzt verbindlich buchen
                          </button>
                        </form>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 text-black shadow-2xl">
          <h2 className="mb-3 text-xl font-semibold">
            Kein passender Termin frei?
          </h2>

          <p className="mb-4 text-sm text-gray-600">
            Trag dich in die Warteliste ein. Du kannst auch optional ein Zeitfenster angeben.
          </p>

          <form action="/api/waitlist" method="POST" className="grid gap-3">
            <select
              name="serviceId"
              required
              className="rounded border px-3 py-2"
              defaultValue={selectedService?.id}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes} Min)
                </option>
              ))}
            </select>

            <input type="hidden" name="date" value={selectedDate} />

            <select
              name="barberId"
              required
              className="rounded border px-3 py-2"
            >
              <option value="">Bestimmten Friseur wählen</option>
              <option value="any">Friseur egal</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="preferredFromTime"
                type="time"
                className="rounded border px-3 py-2"
              />
              <input
                name="preferredToTime"
                type="time"
                className="rounded border px-3 py-2"
              />
            </div>

            <input
              name="firstName"
              placeholder="Vorname"
              required
              className="rounded border px-3 py-2"
            />

            <input
              name="lastName"
              placeholder="Nachname"
              required
              className="rounded border px-3 py-2"
            />

            <input
              name="phone"
              placeholder="WhatsApp Nummer (+49...)"
              required
              className="rounded border px-3 py-2"
            />

            <button className="rounded bg-black p-3 text-white">
              Zur Warteliste hinzufügen
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}