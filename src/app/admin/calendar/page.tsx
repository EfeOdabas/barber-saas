import { prisma } from "../../../lib/prisma";
export const dynamic = "force-dynamic";

function formatTime(date: Date) {
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

function getStatus(startAt: Date, confirmed: boolean) {
  if (confirmed) {
    return {
      label: "Bestätigt",
      className: "bg-green-100 text-green-700",
    };
  }

  const now = new Date();
  const diffHours = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 0) {
    return {
      label: "Vergangen",
      className: "bg-neutral-200 text-neutral-700",
    };
  }

  return {
    label: "Offen",
    className: "bg-yellow-100 text-yellow-700",
  };
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    barberId?: string;
  }>;
}) {
  const params = await searchParams;

  const selectedDate = params.date ?? toLocalDateKey(new Date());
  const selectedBarberId = params.barberId ?? "all";

  const barbers = await prisma.barber.findMany({
    orderBy: { name: "asc" },
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      startAt: {
        gte: new Date(`${selectedDate}T00:00:00.000Z`),
        lt: new Date(`${selectedDate}T23:59:59.999Z`),
      },
      ...(selectedBarberId !== "all" ? { barberId: selectedBarberId } : {}),
    },
    include: {
      barber: true,
      customer: true,
      service: true,
    },
    orderBy: {
      startAt: "asc",
    },
  });

  const blocks = await prisma.breakTime.findMany({
    where: {
      startDate: {
        lte: selectedDate,
      },
      endDate: {
        gte: selectedDate,
      },
      ...(selectedBarberId !== "all" ? { barberId: selectedBarberId } : {}),
    },
    include: {
      barber: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });

  const groupedAppointments =
    selectedBarberId === "all"
      ? barbers.map((barber) => ({
          barber,
          items: appointments.filter((a) => a.barberId === barber.id),
          dayBlocks: blocks.filter((b) => b.barberId === barber.id),
        }))
      : barbers
          .filter((b) => b.id === selectedBarberId)
          .map((barber) => ({
            barber,
            items: appointments.filter((a) => a.barberId === barber.id),
            dayBlocks: blocks.filter((b) => b.barberId === barber.id),
          }));

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
                Admin Bereich
              </p>
              <h1 className="text-3xl font-bold">Kalender</h1>
              <p className="mt-2 text-sm text-neutral-300">
                Tagesübersicht aller Termine und Blockierungen.
              </p>
            </div>

            <a
              href="/admin"
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
            >
              Zurück
            </a>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 text-black shadow-xl">
          <form method="GET" className="grid gap-3 md:grid-cols-3">
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="rounded-xl border p-3"
            />

            <select
              name="barberId"
              defaultValue={selectedBarberId}
              className="rounded-xl border p-3"
            >
              <option value="all">Alle Friseure</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>

            <button className="rounded-xl bg-black p-3 text-white">
              Anzeigen
            </button>
          </form>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          {groupedAppointments.map((group) => (
            <div key={group.barber.id} className="rounded-2xl bg-white p-5 text-black shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-2xl font-semibold">{group.barber.name}</h2>
                  <p className="text-sm text-neutral-500">
                    {group.items.length} Termine · {group.dayBlocks.length} Blockierungen
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {group.dayBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="rounded-xl border border-orange-200 bg-orange-50 p-4"
                  >
                    <div className="font-semibold text-orange-700">Blockierung</div>
                    <div className="text-sm">
                      {block.isFullDay
                        ? "Ganztägig"
                        : `${block.startTime ?? "--:--"} - ${block.endTime ?? "--:--"}`}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {block.reason || "Kein Grund"}
                    </div>
                  </div>
                ))}

                {group.items.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-4 text-neutral-500">
                    Keine Termine an diesem Tag
                  </div>
                ) : (
                  group.items.map((appointment) => {
                    const status = getStatus(
                      new Date(appointment.startAt),
                      appointment.confirmed
                    );

                    return (
                      <div key={appointment.id} className="rounded-xl border p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="text-lg font-semibold">
                            {formatTime(new Date(appointment.startAt))} -{" "}
                            {formatTime(new Date(appointment.endAt))}
                          </div>

                          <div
                            className={`rounded-full px-3 py-1 text-sm font-medium ${status.className}`}
                          >
                            {status.label}
                          </div>
                        </div>

                        <div>Kunde: {appointment.customer.firstName} {appointment.customer.lastName}</div>
                        <div>Telefon: {appointment.customer.phone ?? "-"}</div>
                        <div>Service: {appointment.service.name}</div>

                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                          {!appointment.confirmed && (
                            <form action="/api/appointment-action" method="POST">
                              <input type="hidden" name="appointmentId" value={appointment.id} />
                              <input type="hidden" name="action" value="resend" />
                              <button className="w-full rounded-xl bg-black px-3 py-2 text-white">
                                WhatsApp erneut senden
                              </button>
                            </form>
                          )}

                          <form action="/api/delete-booking" method="POST">
                            <input type="hidden" name="id" value={appointment.id} />
                            <input type="hidden" name="redirectTo" value="/admin/calendar" />
                            <input type="hidden" name="redirectDate" value={selectedDate} />
                            <button className="w-full rounded-xl bg-red-500 px-3 py-2 text-white">
                              Termin löschen
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}