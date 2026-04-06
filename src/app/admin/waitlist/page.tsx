import { prisma } from "../../../lib/prisma";

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    barberId?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;

  const selectedDate = params.date ?? "";
  const selectedBarberId = params.barberId ?? "all";
  const selectedStatus = params.status ?? "all";

  const barbers = await prisma.barber.findMany({
    orderBy: { name: "asc" },
  });

  const waitlist = await prisma.waitlistEntry.findMany({
    where: {
      ...(selectedDate ? { date: selectedDate } : {}),
      ...(selectedBarberId !== "all"
        ? {
            OR: [
              { barberId: selectedBarberId },
              { anyBarber: true },
            ],
          }
        : {}),
      ...(selectedStatus !== "all" ? { status: selectedStatus } : {}),
    },
    include: {
      barber: true,
      service: true,
      customer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
                Admin Bereich
              </p>
              <h1 className="text-3xl font-bold">Warteliste</h1>
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
          <form method="GET" className="grid gap-3 md:grid-cols-4">
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

            <select
              name="status"
              defaultValue={selectedStatus}
              className="rounded-xl border p-3"
            >
              <option value="all">Alle Status</option>
              <option value="waiting">Waiting</option>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
            </select>

            <button className="rounded-xl bg-black p-3 text-white">
              Filtern
            </button>
          </form>
        </section>

        <section className="space-y-4">
          {waitlist.length === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-black shadow-xl">
              Keine Wartelisten-Einträge gefunden.
            </div>
          ) : (
            waitlist.map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-white p-5 text-black shadow-xl">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-lg font-semibold">
                    {entry.customer.firstName} {entry.customer.lastName}
                  </div>

                  <div className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                    {entry.status}
                  </div>
                </div>

                <div>Telefon: {entry.customer.phone ?? "-"}</div>
                <div>Service: {entry.service.name}</div>
                <div>Datum: {entry.date}</div>
                <div>
                  Friseur: {entry.anyBarber ? "Egal" : entry.barber?.name ?? "-"}
                </div>
                <div>
                  Zeitfenster:{" "}
                  {entry.preferredFromTime || entry.preferredToTime
                    ? `${entry.preferredFromTime ?? "--:--"} - ${entry.preferredToTime ?? "--:--"}`
                    : "Ganzer Tag"}
                </div>

                <form action="/api/delete-waitlist" method="POST" className="mt-4">
                  <input type="hidden" name="id" value={entry.id} />
                  <button className="rounded-xl bg-red-500 px-4 py-3 text-white">
                    Eintrag löschen
                  </button>
                </form>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}