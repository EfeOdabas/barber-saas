import { prisma } from "../../../lib/prisma";

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
                Admin Bereich
              </p>
              <h1 className="text-3xl font-bold">Dienstleistungen</h1>
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
          <h2 className="mb-4 text-2xl font-semibold">Neue Dienstleistung</h2>

          <form action="/api/services/create" method="POST" className="grid gap-3 md:grid-cols-3">
            <input
              name="name"
              placeholder="Name"
              required
              className="rounded-xl border p-3"
            />

            <input
              name="durationMinutes"
              type="number"
              placeholder="Dauer in Minuten"
              required
              className="rounded-xl border p-3"
            />

            <button className="rounded-xl bg-black p-3 text-white">
              Hinzufügen
            </button>
          </form>
        </section>

        <section className="space-y-4">
          {services.length === 0 && (
            <div className="rounded-2xl bg-white p-5 text-black shadow-xl">
              Keine Dienstleistungen vorhanden.
            </div>
          )}

          {services.map((service) => (
            <div key={service.id} className="rounded-2xl bg-white p-5 text-black shadow-xl">
              <form action="/api/services/update" method="POST" className="grid gap-3 lg:grid-cols-[1fr_180px_160px_160px]">
                <input type="hidden" name="id" value={service.id} />

                <input
                  name="name"
                  defaultValue={service.name}
                  required
                  className="rounded-xl border p-3"
                />

                <input
                  name="durationMinutes"
                  type="number"
                  defaultValue={service.durationMinutes}
                  required
                  className="rounded-xl border p-3"
                />

                <button className="rounded-xl bg-black p-3 text-white">
                  Speichern
                </button>
              </form>

              <form action="/api/services/delete" method="POST" className="mt-3">
                <input type="hidden" name="id" value={service.id} />
                <button className="rounded-xl bg-red-500 px-4 py-3 text-white">
                  Löschen
                </button>
              </form>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}