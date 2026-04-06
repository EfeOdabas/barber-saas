export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.28em] text-neutral-400">
              Barber Booking System
            </p>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Mehr Termine.
              <br />
              Weniger Ausfälle.
              <br />
              Alles automatisch.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-neutral-300">
              Das Buchungssystem für Friseure mit WhatsApp Bestätigung,
              Erinnerungen, Warteliste und Admin Dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="/book"
                className="rounded-2xl bg-white px-6 py-3 text-center font-semibold text-black"
              >
                Termin buchen
              </a>

              <a
                href="/admin"
                className="rounded-2xl border border-white/20 px-6 py-3 text-center font-semibold text-white"
              >
                Admin Demo ansehen
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold">24/7</div>
                <div className="mt-1 text-sm text-neutral-400">
                  online buchbar
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold">WhatsApp</div>
                <div className="mt-1 text-sm text-neutral-400">
                  Bestätigung & Erinnerung
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl font-bold">Warteliste</div>
                <div className="mt-1 text-sm text-neutral-400">
                  freie Slots wieder füllen
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-5 text-black">
                <div className="text-sm text-neutral-500">Neuer Termin</div>
                <div className="mt-2 text-2xl font-semibold">14:30 – 15:00</div>
                <div className="mt-1 text-sm text-neutral-500">
                  Haarschnitt bei Ali
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm text-neutral-400">WhatsApp Nachricht</div>
                <div className="mt-2 text-neutral-100">
                  Dein Termin ist gebucht. Bitte bestätige mit JA oder sage mit
                  NEIN ab.
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="text-sm text-neutral-400">Automatische Aktion</div>
                <div className="mt-2 text-neutral-100">
                  Nicht bestätigte Termine werden frei und automatisch an die
                  Warteliste weitergegeben.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Weniger No-Shows</h2>
            <p className="mt-2 text-neutral-400">
              Kunden bestätigen Termine direkt per WhatsApp.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Weniger Telefonstress</h2>
            <p className="mt-2 text-neutral-400">
              Kunden buchen selbstständig online, ohne anzurufen.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Mehr Auslastung</h2>
            <p className="mt-2 text-neutral-400">
              Freie Termine können automatisch an Wartelisten-Kunden gehen.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Klare Übersicht</h2>
            <p className="mt-2 text-neutral-400">
              Admin Dashboard mit Terminen, Pausen, Status und Filtern.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}