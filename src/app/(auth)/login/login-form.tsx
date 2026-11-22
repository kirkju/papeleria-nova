"use client";

// Sign-in form (client component, uses useSearchParams).
// It must be mounted inside <Suspense> — page.tsx does that — so as not to break
// the build-time prerender. The fine restyle with our own UI components is a follow-up.
import { useActionState, useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { iniciarSesion } from "@/server/auth";

type EstadoForm = { error: string | null };

const ESTADO_INICIAL: EstadoForm = { error: null };

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrlCrudo = params.get("callbackUrl") ?? "/";
  // Internal routes only: a callbackUrl such as "//evil.com" or "https://evil.com"
  // would be an open redirect after authenticating.
  const callbackUrl =
    callbackUrlCrudo.startsWith("/") && !callbackUrlCrudo.startsWith("//")
      ? callbackUrlCrudo
      : "/";

  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [estado, formAction, pendiente] = useActionState<EstadoForm, FormData>(
    async (_prev, formData) => {
      const resultado = await iniciarSesion(formData);
      if (resultado.ok) {
        // Redirects to the requested destination (already sanitized to an internal route above).
        router.push(callbackUrl);
        router.refresh();
        return { error: null };
      }
      return { error: resultado.error };
    },
    ESTADO_INICIAL,
  );

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold text-ink">Iniciar sesión</h1>
      <p className="mb-8 text-sm text-ink/70">
        Entra a tu cuenta de Papelería Nova.
      </p>

      {estado.error ? (
        <p
          id={errorId}
          role="alert"
          className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {estado.error}
        </p>
      ) : null}

      <form action={formAction} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-sm font-medium text-ink">
            Correo electrónico
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={estado.error ? errorId : undefined}
            className="rounded-md border border-ink/20 bg-paper px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={passwordId} className="text-sm font-medium text-ink">
            Contraseña
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby={estado.error ? errorId : undefined}
            className="rounded-md border border-ink/20 bg-paper px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          />
        </div>

        <button
          type="submit"
          disabled={pendiente}
          className="mt-2 rounded-md bg-ink px-4 py-2.5 font-medium text-paper transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ink/40 disabled:opacity-60"
        >
          {pendiente ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink/70">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-ink underline">
          Crea una aquí
        </Link>
      </p>
    </main>
  );
}
