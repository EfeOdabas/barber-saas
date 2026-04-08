import { prisma } from "../../lib/prisma";
export const dynamic = "force-dynamic";

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

function formatDate(date: Date) {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function AdminPage() {
  const barbers = await prisma.barber.findMany({
    orderBy: { name: "asc" },
  });

  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });

  const blocks = await prisma.breakTime.findMany({
    include: {
      barber: true,
    },
    orderBy: {
      startDate: "desc",
    },
    take: 10,
  });

  const appointments = await prisma.appointment.findMany({
    include: {
      barber: true,
      customer: true,
      service: true,
    },
    orderBy: {
      startAt: "asc",
    },
  });

  const waitlistCount = await prisma.waitlistEntry.count({
    where: {
      status: {
        in: ["waiting", "offered"],
      },
    },
  });

  const waitlistPreview = await prisma.waitlistEntry.findMany({
    include: {
      barber: true,
      service: true,
      customer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  const todayKey = toLocalDateKey(new Date());

  const appointmentsToday = appointments.filter(
    (a) => a.startAt.toISOString().split("T")[0] === todayKey
  );

  const unconfirmedAppointments = appointments.filter((a) => !a.confirmed);

  const timeOptions = generateTimeOptions();

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
                Admin Bereich
              </p>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="mt-2 text-sm text-neutral-300">
                Verwalte Termine, Bestätigungen, Warteliste, Blockierungen und Einstellungen.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/admin/calendar"
                className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
              >
                Kalender
              </a>

              <a
                href="/admin/waitlist"
                className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
              >
                Warteliste
              </a>

              <a
                href="/admin/services"
                className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
              >
                Services
              </a>

              <a
                href="/admin/working-hours"
                className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
              >
                Arbeitszeiten
              </a>

              <a
                href="/admin/settings"
                className="rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white"
              >
                Einstellungen
              </a>

              <form action="/api/admin-logout" method="POST">
                <button className="rounded-2xl border border-red-400 px-5 py-3 font-semibold text-red-300">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 text-black shadow-xl">
            <div className="text-sm text-neutral-500">Termine gesamt</div>
            <div className="mt-2 text-3xl font-bold">{appointments.length}</div>
          </div>

          <div className="rounded-2xl bg-white p-5 text-black shadow-xl">
            <div className="text-sm text-neutral-500">Termine heute</div>
            <div className="mt-2 text-3xl font-bold">{appointmentsToday.length}</div>
          </div>

          <div className="rounded-2xl bg-white p-5 text-black shadow-xl">
            <div className="text-sm text-neutral-500">Nicht bestätigt</div>
            <div className="mt-2 text-3xl font-bold">{unconfirmedAppointments.length}</div>
          </div>

          <div className="rounded-2xl bg-white p-5 text-black shadow-xl">
            <div className="text-sm text-neutral-500">Warteliste aktiv</div>
            <div className="mt-2 text-3xl font-bold">{waitlistCount}</div>
          </div>
        </section>

        <section className="rounded-2xl bg-red-50 p-5 text-black shadow-xl">
          <h2 className="mb-4 text-2xl font-semibold text-red-600">
            Offene Bestätigungen
          </h2>

          {unconfirmedAppointments.length === 0 ? (
            <div className="rounded-xl bg-white p-4">
              Alle Termine sind bestätigt ✅
            </div>
          ) : (
            <div className="space-y-4">
              {unconfirmedAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-xl bg-white p-4 shadow">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-lg font-semibold">
                      {formatDate(appointment.startAt)} · {formatTime(appointment.startAt)}
                    </div>

                    <div className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                      Nicht bestätigt
                    </div>
                  </div>

                  <div>Kunde: {appointment.customer.firstName} {appointment.customer.lastName}</div>
                  <div>Telefon: {appointment.customer.phone ?? "-"}</div>
                  <div>Friseur: {appointment.barber.name}</div>
                  <div>Service: {appointment.service.name}</div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <form action="/api/appointment-action" method="POST">
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <input type="hidden" name="action" value="resend" />
                      <button className="w-full rounded-xl bg-black px-3 py-2 text-white">
                        WhatsApp erneut senden
                      </button>
                    </form>

                    <form action="/api/appointment-action" method="POST">
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <input type="hidden" name="action" value="confirm" />
                      <button className="w-full rounded-xl bg-green-600 px-3 py-2 text-white">
                        Manuell bestätigen
                      </button>
                    </form>

                    <form action="/api/delete-booking" method="POST">
                      <input type="hidden" name="id" value={appointment.id} />
                      <input type="hidden" name="redirectTo" value="/admin" />
                      <button className="w-full rounded-xl bg-red-500 px-3 py-2 text-white">
                        Termin absagen
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 text-black shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Warteliste Vorschau</h2>

            <a
              href="/admin/waitlist"
              className="rounded-xl bg-black px-4 py-3 text-white"
            >
              Ganze Warteliste öffnen
            </a>
          </div>

          {waitlistPreview.length === 0 ? (
            <div>Keine Wartelisten-Einträge vorhanden.</div>
          ) : (
            <div className="space-y-3">
              {waitlistPreview.map((entry) => (
                <div key={entry.id} className="rounded-xl border p-4">
                  <div className="mb-1 font-semibold">
                    {entry.customer.firstName} {entry.customer.lastName}
                  </div>
                  <div>Service: {entry.service.name}</div>
                  <div>Datum: {entry.date}</div>
                  <div>Friseur: {entry.anyBarber ? "Egal" : entry.barber?.name ?? "-"}</div>
                  <div>Status: {entry.status}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 text-black shadow-xl">
          <h2 className="mb-4 text-2xl font-semibold">
            Termin manuell anlegen
          </h2>

          <form action="/api/admin-booking" method="POST" className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <select name="barberId" required className="rounded-xl border p-3">
                <option value="">Friseur wählen</option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>

              <select name="serviceId" required className="rounded-xl border p-3">
                <option value="">Service wählen</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.durationMinutes} Min)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input name="date" type="date" required className="rounded-xl border p-3" />
              <select name="startTime" required className="rounded-xl border p-3">
                <option value="">Startzeit</option>
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input
                name="firstName"
                placeholder="Vorname"
                required
                className="rounded-xl border p-3"
              />
              <input
                name="lastName"
                placeholder="Nachname"
                required
                className="rounded-xl border p-3"
              />
              <input
                name="phone"
                placeholder="Telefon / WhatsApp"
                className="rounded-xl border p-3"
              />
            </div>

            <button className="rounded-xl bg-black p-3 text-white">
              Termin speichern
            </button>
          </form>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-5 text-black shadow-xl">
            <h2 className="mb-4 text-2xl font-semibold">
              Urlaub / Pause eintragen
            </h2>

            <form action="/api/breaks" method="POST" className="grid gap-3">
              <select name="barberId" required className="rounded-xl border p-3">
                <option value="">Friseur wählen</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 sm:grid-cols-2">
                <input name="startDate" type="date" required className="rounded-xl border p-3" />
                <input name="endDate" type="date" required className="rounded-xl border p-3" />
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="isFullDay" value="true" />
                Ganztägig (Urlaub)
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <select name="startTime" className="rounded-xl border p-3">
                  <option value="">Startzeit</option>
                  {timeOptions.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

                <select name="endTime" className="rounded-xl border p-3">
                  <option value="">Endzeit</option>
                  {timeOptions.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <input
                name="reason"
                placeholder="Grund (optional)"
                className="rounded-xl border p-3"
              />

              <button className="rounded-xl bg-black p-3 text-white">
                Speichern
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-5 text-black shadow-xl">
            <h2 className="mb-4 text-2xl font-semibold">Blockierungen</h2>

            <div className="space-y-3">
              {blocks.length === 0 && <p>Keine Einträge</p>}

              {blocks.map((b) => (
                <div key={b.id} className="rounded-xl border p-4">
                  <div className="font-semibold">{b.barber.name}</div>

                  <div>
                    {b.startDate} → {b.endDate}
                  </div>

                  {b.isFullDay ? (
                    <div>Ganztägig</div>
                  ) : (
                    <div>
                      {b.startTime} - {b.endTime}
                    </div>
                  )}

                  <div>{b.reason}</div>

                  <form action="/api/delete-break" method="POST">
                    <input type="hidden" name="id" value={b.id} />
                    <button className="mt-2 rounded bg-red-500 p-2 text-white">
                      Löschen
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}