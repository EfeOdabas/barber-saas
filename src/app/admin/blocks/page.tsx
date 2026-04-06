import { prisma } from "../../../lib/prisma";

function generateTimeOptions() {
  const times: string[] = [];

  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 15, 30, 45]) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      times.push(`${h}:${m}`);
    }
  }

  return times;
}

export default async function AdminBlocksPage() {
  const barbers = await prisma.barber.findMany({
    orderBy: { name: "asc" },
  });

  const blocks = await prisma.breakTime.findMany({
    include: {
      barber: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });

  const timeOptions = generateTimeOptions();

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
                Admin Bereich
              </p>
              <h1 className="text-3xl font-bold">Blockierungen</h1>
              <p className="mt-2 text-sm text-neutral-300">
                Urlaub und Pausen für Friseure verwalten.
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
          <h2 className="mb-4 text-2xl font-semibold">
            Urlaub / Pause eintragen
          </h2>

          <form action="/api/breaks" method="POST" className="grid gap-3">
            <select name="barberId" required className="rounded-xl border p-3">
              <option value="">Friseur wählen</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Von</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="rounded-xl border p-3"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Bis</label>
                <input
                  type="date"
                  name="endDate"
                  required
                  className="rounded-xl border p-3"
                />
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" name="isFullDay" value="true" />
              Ganztägig (Urlaub)
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Startzeit</label>
                <select name="startTime" className="rounded-xl border p-3">
                  <option value="">Keine Startzeit</option>
                  {timeOptions.map((time) => (
                    <option key={`start-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Endzeit</label>
                <select name="endTime" className="rounded-xl border p-3">
                  <option value="">Keine Endzeit</option>
                  {timeOptions.map((time) => (
                    <option key={`end-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Grund</label>
              <input
                name="reason"
                placeholder="z. B. Urlaub oder Mittagspause"
                className="rounded-xl border p-3"
              />
            </div>

            <button className="rounded-xl bg-black p-3 text-white">
              Speichern
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 text-black shadow-xl">
          <h2 className="mb-4 text-2xl font-semibold">Aktive Einträge</h2>

          {blocks.length === 0 ? (
            <div>Keine Blockierungen vorhanden.</div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => (
                <div key={block.id} className="rounded-xl border p-4">
                  <div className="font-semibold">{block.barber.name}</div>
                  <div>
                    {block.startDate} → {block.endDate}
                  </div>
                  <div>
                    {block.isFullDay
                      ? "Ganztägig"
                      : `${block.startTime ?? "--:--"} - ${block.endTime ?? "--:--"}`}
                  </div>
                  <div>{block.reason || "-"}</div>

                  <form action="/api/delete-break" method="POST" className="mt-3">
                    <input type="hidden" name="id" value={block.id} />
                    <button className="rounded-xl bg-red-500 px-4 py-2 text-white">
                      Löschen
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}