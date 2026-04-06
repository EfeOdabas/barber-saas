import { prisma } from "../../../lib/prisma";

export default async function AdminSettingsPage() {
  const salon = await prisma.salon.findFirst();

  if (!salon) {
    return (
      <main className="min-h-screen bg-neutral-950 p-6 text-white">
        Kein Salon gefunden
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
                Einstellungen
              </p>
              <h1 className="text-3xl font-bold">Salon Einstellungen</h1>
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
          <form action="/api/settings" method="POST" className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Unternehmensname
              </label>
              <input
                name="name"
                defaultValue={salon.name}
                placeholder="Unternehmensname"
                className="rounded-2xl border border-neutral-300 px-4 py-3"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Termintakt in Minuten
              </label>
              <input
                type="number"
                name="bookingIntervalMinutes"
                defaultValue={salon.bookingIntervalMinutes}
                placeholder="z. B. 15 oder 30"
                className="rounded-2xl border border-neutral-300 px-4 py-3"
              />
              <p className="text-sm text-neutral-500">
                Bestimmt, in welchem Abstand freie Termine angezeigt werden.
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Buchungsvorlauf in Stunden
              </label>
              <input
                type="number"
                name="bookingLeadHours"
                defaultValue={salon.bookingLeadHours}
                placeholder="z. B. 0, 3, 6 oder 24"
                className="rounded-2xl border border-neutral-300 px-4 py-3"
              />
              <p className="text-sm text-neutral-500">
                Wie viele Stunden vorher ein Kunde mindestens buchen darf.
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Bestätigung vor Termin in Stunden
              </label>
              <input
                type="number"
                name="confirmationHours"
                defaultValue={salon.confirmationHours}
                placeholder="z. B. 24"
                className="rounded-2xl border border-neutral-300 px-4 py-3"
              />
              <p className="text-sm text-neutral-500">
                So viele Stunden vor dem Termin muss bestätigt sein.
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Erinnerung vor Termin in Stunden
              </label>
              <input
                type="number"
                name="reminderHours"
                defaultValue={salon.reminderHours}
                placeholder="z. B. 2"
                className="rounded-2xl border border-neutral-300 px-4 py-3"
              />
              <p className="text-sm text-neutral-500">
                So viele Stunden vor dem Termin wird die Erinnerung gesendet.
              </p>
            </div>

            <button className="rounded-2xl bg-black px-4 py-3 font-semibold text-white">
              Einstellungen speichern
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}