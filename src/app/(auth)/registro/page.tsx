"use client";

// Registration page. Functional form with useActionState.
// After registering, it tries to sign in automatically and redirects to the home page.
// The fine restyle is a follow-up.
import { useActionState, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registrarUsuario, iniciarSesion } from "@/server/auth";

type EstadoForm = { error: string | null };

const ESTADO_INICIAL: EstadoForm = { error: null };

export default function RegistroPage() {
  const router = useRouter();

  const nombreId = useId();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const ayudaPasswordId = useId();

  const [estado, formAction, pendiente] = useActionState<EstadoForm, FormData>(
    async (_prev, formData) => {
      const resultado = await registrarUsuario(formData);
      if (!resultado.ok) {
        return { error: resultado.error };
      }
      // Auto-login after a successful registration (reuses the same FormData: email + password).
      const login = await iniciarSesion(formData);
      if (login.ok) {
        router.push("/");
        router.refresh();
        return { error: null };
      }
      // Account created but the auto-login failed: go to /login to sign in manually.
      router.push("/login");
      return { error: null };
    },
    ESTADO_INICIAL,
  );

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold text-ink">Crear cuenta</h1>
      <p className="mb-8 text-sm text-ink/70">
        Únete a Papelería Nova y empieza a comprar.
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
          <label htmlFor={nombreId} className="text-sm font-medium text-ink">
            Nombre completo
          </label>
          <input
            id={nombreId}
            name="nombre"
            type="text"
            autoComplete="name"
            required
            aria-describedby={estado.error ? errorId : undefined}
            className="rounded-md border border-ink/20 bg-paper px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          />
        </div>

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
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby={`${ayudaPasswordId}${estado.error ? ` ${errorId}` : ""}`}
            className="rounded-md border border-ink/20 bg-paper px-3 py-2 text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
          />
          <p id={ayudaPasswordId} className="text-xs text-ink/60">
            Mínimo 8 caracteres, con al menos una letra y un número.
          </p>
        </div>

        <button
          type="submit"
          disabled={pendiente}
          className="mt-2 rounded-md bg-ink px-4 py-2.5 font-medium text-paper transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ink/40 disabled:opacity-60"
        >
          {pendiente ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink/70">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-ink underline">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
