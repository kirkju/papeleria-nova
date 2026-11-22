// 403 page — unauthorized access. Simple server component in Spanish.
import Link from "next/link";

export const metadata = {
  title: "Acceso no autorizado",
};

export default function NoAutorizadoPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      <p className="mb-2 text-sm font-semibold tracking-wide text-ink/60">
        Error 403
      </p>
      <h1 className="mb-3 text-2xl font-bold text-ink">Acceso no autorizado</h1>
      <p className="mb-8 text-sm text-ink/70">
        No tienes permiso para ver esta página. Si crees que es un error,
        contacta a un administrador.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-md bg-ink px-4 py-2.5 font-medium text-paper transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ink/40"
        >
          Volver al inicio
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-ink/20 px-4 py-2.5 font-medium text-ink transition-colors hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-ink/40"
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
