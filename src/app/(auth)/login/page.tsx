import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Entra a tu cuenta de Papelería Nova.",
};

// The form uses useSearchParams (callbackUrl), so it needs a
// Suspense boundary for the page to be prerenderable.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
