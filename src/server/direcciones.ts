"use server";

/**
 * Server actions for the user's addresses.
 *
 * Hard rules:
 * - Requires a SESSION. Without one it returns a generic error (nothing is leaked).
 * - ONLY the addresses of the session user (`userId`) are exposed. The
 *   client NEVER decides whose addresses they are.
 * - EXPLICIT `select`: no unnecessary internal fields are returned.
 * - The recipient's name does NOT live in `Address` (it goes in the order's
 *   snapshot), which is why the DTO does not include it.
 */
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/guard";
import type { DepartamentoHonduras } from "@/lib/validators/checkout";

/**
 * The user's address as exposed to the client. `departamento` is a `string` (it is
 * not narrowed to the enum: an old saved address could hold a value that is no
 * longer in the list; the UI shows it all the same). The union type stays
 * documented via `DepartamentoHonduras` for the form.
 */
export type DireccionDTO = {
  id: string;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  /** One of Honduras's 18 (see {@link DepartamentoHonduras}). */
  departamento: string;
  telefono: string;
  esPredeterminada: boolean;
};

export type ResultadoDirecciones =
  | { ok: true; direcciones: DireccionDTO[] }
  | { ok: false; error: string };

const ERROR_SIN_SESION = "Inicia sesión para ver tus direcciones.";
const ERROR_GENERICO = "No se pudieron cargar tus direcciones.";

/**
 * Returns the session user's addresses, with the default one first (then
 * by id for a stable order). It never exposes other users' addresses.
 */
export async function obtenerDireccionesUsuario(): Promise<ResultadoDirecciones> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: ERROR_SIN_SESION };

    const filas = await prisma.address.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        linea1: true,
        linea2: true,
        ciudad: true,
        departamento: true,
        telefono: true,
        esPredeterminada: true,
      },
      orderBy: [{ esPredeterminada: "desc" }, { id: "asc" }],
    });

    const direcciones: DireccionDTO[] = filas.map((d) => ({
      id: d.id,
      linea1: d.linea1,
      linea2: d.linea2,
      ciudad: d.ciudad,
      departamento: d.departamento as DepartamentoHonduras | string,
      telefono: d.telefono,
      esPredeterminada: d.esPredeterminada,
    }));

    return { ok: true, direcciones };
  } catch (error) {
    // Next's control-flow errors (Dynamic server usage, redirect,
    // notFound) are NOT failures of ours: they must be rethrown so that Next marks
    // the route as dynamic instead of being trapped in the generic catch.
    unstable_rethrow(error);
    console.error("[direcciones] obtenerDireccionesUsuario:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}
