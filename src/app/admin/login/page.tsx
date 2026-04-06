export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <section className="w-full rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl">
          <p className="mb-2 text-xs uppercase tracking-[0.28em] text-neutral-400">
            Admin Bereich
          </p>
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="mt-2 text-sm text-neutral-300">
            Melde dich an, um das Dashboard zu öffnen.
          </p>

          <form action="/api/admin-login" method="POST" className="mt-6 grid gap-3">
            <input
              type="password"
              name="password"
              placeholder="Passwort"
              required
              className="rounded-2xl border border-neutral-700 bg-black/20 px-4 py-3 text-white"
            />

            <button className="rounded-2xl bg-white px-4 py-3 font-semibold text-black">
              Einloggen
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}