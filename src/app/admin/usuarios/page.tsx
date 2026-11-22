import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  DataTable,
  EmptyStateAdmin,
  PaginacionAdmin,
  type ColumnaTabla,
} from "@/components/admin";
import { UsuariosFiltros } from "@/components/admin/usuarios-filtros";
import { UsuariosRolBadge } from "@/components/admin/usuarios-rol-badge";
import { UsuariosAcciones } from "@/components/admin/usuarios-acciones";
import {
  listarUsuariosAdmin,
  type UsuarioFilaAdmin,
} from "@/server/admin/usuarios";
import { parsearFiltrosUsuarios } from "@/lib/validators/usuarios";
import { AuthError } from "@/lib/auth/guard";
import { Acceso403 } from "./acceso-403";

/**
 * /admin/usuarios — user management (ADMIN ONLY).
 *
 * Server Component. It reads the filters from searchParams (a Promise in Next 16)
 * with the TOTAL parser `parsearFiltrosUsuarios` and queries `listarUsuariosAdmin`,
 * which requires the "usuario:listar" permission (ADMIN ONLY). The /admin layout
 * admits VENDEDOR|ADMIN, so a seller gets this far: the read throws
 * `AuthError` and an accessible 403 is rendered (hard barrier in the server action).
 *
 * Each row shows a user with their role (tinted badge), status, number of
 * orders and sign-up date. The per-row actions (change role, activate/deactivate)
 * live in `UsuariosAcciones` (client island) and are disabled on oneself; the
 * anti-lockout rules are resolved and communicated by the server.
 *
 * Dynamic: it depends on the session and on searchParams (a Promise), so it is
 * not prerendered at build time.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usuarios",
  description: "Gestiona los usuarios de Papelería Nova: roles y estado de cuenta.",
};

type SearchParams = Record<string, string | string[] | undefined>;

/** DD/MM/YYYY format with the es-HN locale (localization rule). */
const formatoFecha = new Intl.DateTimeFormat("es-HN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatoFecha.format(d);
}

export default async function UsuariosAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filtros = parsearFiltrosUsuarios(sp);

  let datos: Awaited<ReturnType<typeof listarUsuariosAdmin>>;
  try {
    datos = await listarUsuariosAdmin(filtros);
  } catch (error) {
    if (error instanceof AuthError) {
      return (
        <div className="flex flex-col gap-6">
          <PageHeader titulo="Usuarios" />
          <Acceso403 mensaje={error.mensajePublico} />
        </div>
      );
    }
    throw error;
  }

  const { usuarios, total, pagina, totalPaginas } = datos;

  const hayFiltrosActivos =
    Boolean(filtros.q) ||
    filtros.rol !== "todos" ||
    filtros.estado !== "todos";

  // Params (string) to preserve the filters in the pagination, without "page".
  const paramsActuales: Record<string, string> = {};
  if (filtros.q) paramsActuales.q = filtros.q;
  if (filtros.rol !== "todos") paramsActuales.rol = filtros.rol;
  if (filtros.estado !== "todos") paramsActuales.estado = filtros.estado;

  const contador =
    total === 1 ? "1 usuario" : `${total.toLocaleString("es-HN")} usuarios`;

  const columnas: ColumnaTabla<UsuarioFilaAdmin>[] = [
    {
      clave: "nombre",
      encabezado: "Usuario",
      render: (u) => (
        <span className="flex items-center gap-1.5 font-medium text-ink">
          <span className="truncate">{u.nombre}</span>
          {u.esActual ? (
            <span className="shrink-0 rounded-[var(--radius-sm)] bg-primary-50 px-1.5 py-0.5 text-[0.68rem] font-semibold text-primary-600">
              tú
            </span>
          ) : null}
        </span>
      ),
    },
    {
      clave: "email",
      encabezado: "Email",
      render: (u) => (
        <span className="truncate text-ink-soft">{u.email}</span>
      ),
    },
    {
      clave: "role",
      encabezado: "Rol",
      render: (u) => <UsuariosRolBadge rol={u.role} />,
    },
    {
      clave: "activo",
      encabezado: "Estado",
      alinear: "center",
      render: (u) =>
        u.activo ? (
          <Badge variant="nuevo">Activo</Badge>
        ) : (
          <Badge variant="agotado">Inactivo</Badge>
        ),
    },
    {
      clave: "totalPedidos",
      encabezado: "Pedidos",
      alinear: "right",
      render: (u) => (
        <span className="tabular-nums text-ink-soft">{u.totalPedidos}</span>
      ),
    },
    {
      clave: "creadoEn",
      encabezado: "Registrado",
      alinear: "right",
      render: (u) => (
        <time
          dateTime={u.creadoEn}
          className="whitespace-nowrap tabular-nums text-ink-soft"
        >
          {fechaCorta(u.creadoEn)}
        </time>
      ),
    },
    {
      clave: "acciones",
      encabezado: <span className="sr-only">Acciones</span>,
      alinear: "right",
      render: (u) => (
        <UsuariosAcciones
          id={u.id}
          nombre={u.nombre}
          rol={u.role}
          activo={u.activo}
          esActual={u.esActual}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Usuarios"
        descripcion="Gestiona los roles y el estado de las cuentas. Solo administradores."
      />

      <UsuariosFiltros
        filtros={filtros}
        hayFiltrosActivos={hayFiltrosActivos}
      />

      <p aria-live="polite" className="text-step--1 text-ink-soft">
        {total === 0 ? (
          <>Sin usuarios ({contador})</>
        ) : (
          <>
            <span className="font-semibold text-ink tabular-nums">
              {total.toLocaleString("es-HN")}
            </span>{" "}
            {total === 1 ? "usuario" : "usuarios"}
            {hayFiltrosActivos ? " (filtrados)" : ""}
          </>
        )}
      </p>

      <DataTable
        caption="Lista de usuarios con su rol, estado, pedidos, fecha de alta y acciones."
        claveFila={(u) => u.id}
        columnas={columnas}
        filas={usuarios}
        vacio={
          <EmptyStateAdmin
            titulo={hayFiltrosActivos ? "Sin coincidencias" : "Aún no hay usuarios"}
            descripcion={
              hayFiltrosActivos
                ? "Ningún usuario coincide con estos filtros. Prueba a ampliarlos."
                : "Cuando se registren usuarios aparecerán aquí."
            }
          >
            {hayFiltrosActivos ? (
              <Button asChildLink href="/admin/usuarios" variant="outline">
                Limpiar filtros
              </Button>
            ) : null}
          </EmptyStateAdmin>
        }
      />

      <PaginacionAdmin
        pagina={pagina}
        totalPaginas={totalPaginas}
        basePath="/admin/usuarios"
        paramsActuales={paramsActuales}
      />
    </div>
  );
}
