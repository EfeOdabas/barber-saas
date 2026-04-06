import { prisma } from "../../../lib/prisma";

export default async function AdminBlocksPage() {
  const barbers = await prisma.barber.findMany({
    orderBy: { name: "asc" },
  });

  const blocks = await prisma.breakTime.findMany({
    include: {
      barber: true,
    },
    orderBy: [
      { startDate: "asc" },
      { startTime: "asc" },
    ],
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
                Blockierungen
              </p>
              <h1 className="text-3xl font-bold">Urlaub & Pausen</h1>
            </div>

            <a
              href="/admin"
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
            >
              Zurück
            </a>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 text-black shadow-2xl">
          <h2 className="mb-4 text-2xl font-semibold">Neue Blockierung</h2>

          <form action="/api/blocks" method="POST" className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Friseur
              </label>
              <select
                name="barberId"
                required
                className="rounded-2xl border border-neutral-300 px-4 py-3"
              >
                <option value="">Friseur wählen</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700">
                  Startdatum
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="rounded-2xl border border-neutral-300 px-4 py-3"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700">
                  Enddatum
                </label>
                <input
                  type="date"
                  name="endDate"
                  required
                  className="rounded-2xl border border-neutral-300 px-4 py-3"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" name="isFullDay" value="yes" />
              Ganztägig blockieren (Urlaub / freier Tag)
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700">
                  Startzeit (optional)
                </label>
                <input
                  type="time"
                  name="startTime"
                  className="rounded-2xl border border-neutral-300 px-4 py-3"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-neutral-700">
                  Endzeit (optional)
                </label>
                <input
                  type="time"