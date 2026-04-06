import { prisma } from "../../../lib/prisma";

const days = [
  { label: "Montag", value: 1 },
  { label: "Dienstag", value: 2 },
  { label: "Mittwoch", value: 3 },
  { label: "Donnerstag", value: 4 },
  { label: "Freitag", value: 5 },
  { label: "Samstag", value: 6 },
  { label: "Sonntag", value: 0 },
];

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

export default async function AdminWorkingHoursPage() {
  const barbers = await prisma.barber.findMany({
    orderBy: { name: "asc" },
    include: {
      workingHours: true,
    },
  });

  const timeOptions = generateTimeOptions();

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
                Admin Bereich
              </p>
              <h1 className="text-3xl font-bold">Arbeitszeiten</h1>
            </div>

            <a
              href="/admin"
              className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
            >
              Zurück
            </a>
          </div>
        </section>

        <div className="space-y-6">
          {barbers.map((barber) => (
            <section
              key={barber.id}
              className="rounded-2xl bg-white p-5 text-black shadow-xl"
            >
              <h2 className="mb-4 text-2xl font-semibold">{barber.name}</h2>

              <div className="space-y-4">
                {days.map((day) => {
                  const existing = barber.workingHours.find(
                    (wh) => wh.weekday === day.value
                  );

                  return (
                    <form
                      key={`${barber.id}-${day.value}`}
                      action="/api/working-hours"
                      method="POST"
                      className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[180px_1fr_1fr_160px]"
                    >
                      <input type="hidden" name="barberId" value={barber.id} />
                      <input type="hidden" name="weekday" value={day.value} />

                      <div className="flex items-center font-semibold">
                        {day.label}
                      </div>

                      <select
                        name="startTime"
                        defaultValue={existing?.startTime ?? ""}
                        className="rounded-xl border p-3"
                      >
                        <option value="">Frei</option>
                        {timeOptions.map((time) => (
                          <option key={`start-${day.value}-${time}`} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>

                      <select
                        name="endTime"
                        defaultValue={existing?.endTime ?? ""}
                        className="rounded-xl border p-3"
                      >
                        <option value="">Frei</option>
                        {timeOptions.map((time) => (
                          <option key={`end-${day.value}-${time}`} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>

                      <button className="rounded-xl bg-black p-3 text-white">
                        Speichern
                      </button>
                    </form>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}