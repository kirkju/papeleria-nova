"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { OPCIONES_SORT } from "@/lib/validators/catalogo";
import { Button } from "@/components/ui/button";
import { formatearLempiras, cn } from "@/lib/utils";

/**
 * FiltrosCatalogo — the catalog's filters panel. The URL is the source of
 * truth: every change does a `router.replace` without scroll and REMOVES
 * `page` (any change to the filters goes back to page 1).
 *
 * Accessible sections (fieldset/legend): Categories (radio-like links with a
 * count + "Todas"), Price (numeric min/max with a ~400ms debounce), Brand
 * (select), Availability ("Solo con stock" checkbox ⇒ disp=1). Chips for the
 * active filters with individual removal and "Limpiar filtros".
 *
 * At <lg it collapses into an accessible drawer ("Filtrar" button + counter),
 * reusing the mobile-menu pattern (role=dialog, Escape, focus, scroll
 * lock). It also exports `OrdenSelect` for the order (sort).
 *
 * URL contract (do not change): ?q= cat= marca= min= max= disp=1 sort= page=
 *
 * Usage:
 *   <FiltrosCatalogo categorias={cats} marcas={marcas} />
 *   <OrdenSelect className="w-56" />
 */
export interface CategoriaFiltroProp {
  nombre: string;
  slug: string;
  conteo: number;
}

/** Creates a new query string from the current one, applying changes. */
function construirQuery(
  actual: URLSearchParams,
  cambios: Record<string, string | null>,
): string {
  const params = new URLSearchParams(actual.toString());
  for (const [clave, valor] of Object.entries(cambios)) {
    if (valor === null || valor === "") params.delete(clave);
    else params.set(clave, valor);
  }
  // Any change to the filters resets the pagination.
  params.delete("page");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Hook: navigates to /catalogo with the changes applied (no scroll). */
function useActualizarFiltros() {
  const router = useRouter();
  const searchParams = useSearchParams();
  return React.useCallback(
    (cambios: Record<string, string | null>) => {
      const qs = construirQuery(searchParams, cambios);
      router.replace(`/catalogo${qs}`, { scroll: false });
    },
    [router, searchParams],
  );
}

/* ── OrdenSelect (sort) ────────────────────────────────────────────────────── */

export function OrdenSelect({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const actualizar = useActualizarFiltros();
  const valor = searchParams.get("sort") ?? "relevancia";
  const id = React.useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        htmlFor={id}
        className="shrink-0 text-[0.85rem] font-medium text-ink-soft"
      >
        Ordenar
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) =>
          actualizar({
            sort: e.target.value === "relevancia" ? null : e.target.value,
          })
        }
        className={cn(
          "h-11 w-full rounded-[var(--radius-md)] border border-line bg-paper-2 px-3.5 pr-9 text-step-0 text-ink",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          "appearance-none bg-[length:1.1em] bg-[right_0.75rem_center] bg-no-repeat",
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234a463e%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')]",
        )}
      >
        {OPCIONES_SORT.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Section: Categories (radio-like via button links) ──────────────────────── */

function SeccionCategorias({
  categorias,
  activa,
  onSelect,
}: {
  categorias: CategoriaFiltroProp[];
  activa: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2.5 font-display text-step-0 font-semibold text-ink">
        Categorías
      </legend>
      <ul className="flex flex-col gap-0.5" role="list">
        <li>
          <OpcionRadio
            etiqueta="Todas"
            activo={activa === null}
            onClick={() => onSelect(null)}
          />
        </li>
        {categorias.map((c) => (
          <li key={c.slug}>
            <OpcionRadio
              etiqueta={c.nombre}
              conteo={c.conteo}
              activo={activa === c.slug}
              onClick={() => onSelect(activa === c.slug ? null : c.slug)}
            />
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function OpcionRadio({
  etiqueta,
  conteo,
  activo,
  onClick,
}: {
  etiqueta: string;
  conteo?: number;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-left text-step-0",
        "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        activo ? "bg-primary-50 text-primary-600" : "text-ink hover:bg-paper-3",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4.5 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border",
          activo ? "border-primary bg-primary text-on-primary" : "border-line-strong",
        )}
      >
        {activo && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="flex-1 font-medium">{etiqueta}</span>
      {conteo !== undefined && (
        <span className="text-[0.8rem] tabular-nums text-ink-faint">
          {conteo}
        </span>
      )}
    </button>
  );
}

/* ── Section: Price (min/max with debounce) ─────────────────────────────────── */

function SeccionPrecio({
  min,
  max,
  onCommit,
}: {
  min: string;
  max: string;
  onCommit: (campo: "min" | "max", valor: string) => void;
}) {
  // The local state starts from the URL. When the URL changes from outside
  // (a chip's "remove", clearing the filters), we re-sync DURING render
  // (the pattern React recommends: "adjusting state while rendering"), avoiding a
  // sync effect and the cascading renders it entails.
  const [localMin, setLocalMin] = React.useState(min);
  const [localMax, setLocalMax] = React.useState(max);
  const [urlMin, setUrlMin] = React.useState(min);
  const [urlMax, setUrlMax] = React.useState(max);
  const tMin = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const tMax = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  if (min !== urlMin) {
    setUrlMin(min);
    setLocalMin(min);
  }
  if (max !== urlMax) {
    setUrlMax(max);
    setLocalMax(max);
  }

  React.useEffect(() => {
    return () => {
      if (tMin.current) clearTimeout(tMin.current);
      if (tMax.current) clearTimeout(tMax.current);
    };
  }, []);

  const idMin = React.useId();
  const idMax = React.useId();

  const cambiar = (campo: "min" | "max", valor: string) => {
    const limpio = valor.replace(/[^\d]/g, "");
    if (campo === "min") {
      setLocalMin(limpio);
      if (tMin.current) clearTimeout(tMin.current);
      tMin.current = setTimeout(() => onCommit("min", limpio), 400);
    } else {
      setLocalMax(limpio);
      if (tMax.current) clearTimeout(tMax.current);
      tMax.current = setTimeout(() => onCommit("max", limpio), 400);
    }
  };

  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2.5 font-display text-step-0 font-semibold text-ink">
        Precio (L)
      </legend>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={idMin} className="text-[0.78rem] text-ink-faint">
            Mínimo
          </label>
          <input
            id={idMin}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={localMin}
            onChange={(e) => cambiar("min", e.target.value)}
            className="h-10 w-full rounded-[var(--radius-md)] border border-line bg-paper-2 px-3 text-step-0 text-ink tabular-nums placeholder:text-ink-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <span aria-hidden="true" className="mt-5 text-ink-faint">
          –
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={idMax} className="text-[0.78rem] text-ink-faint">
            Máximo
          </label>
          <input
            id={idMax}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="∞"
            value={localMax}
            onChange={(e) => cambiar("max", e.target.value)}
            className="h-10 w-full rounded-[var(--radius-md)] border border-line bg-paper-2 px-3 text-step-0 text-ink tabular-nums placeholder:text-ink-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
    </fieldset>
  );
}

/* ── Section: Brand (select) ────────────────────────────────────────────────── */

function SeccionMarca({
  marcas,
  activa,
  onSelect,
}: {
  marcas: string[];
  activa: string | null;
  onSelect: (marca: string | null) => void;
}) {
  const id = React.useId();
  if (marcas.length === 0) return null;
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2.5 font-display text-step-0 font-semibold text-ink">
        Marca
      </legend>
      <label htmlFor={id} className="sr-only">
        Filtrar por marca
      </label>
      <select
        id={id}
        value={activa ?? ""}
        onChange={(e) => onSelect(e.target.value === "" ? null : e.target.value)}
        className={cn(
          "h-11 w-full rounded-[var(--radius-md)] border border-line bg-paper-2 px-3.5 pr-9 text-step-0 text-ink",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          "appearance-none bg-[length:1.1em] bg-[right_0.75rem_center] bg-no-repeat",
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234a463e%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')]",
        )}
      >
        <option value="">Todas las marcas</option>
        {marcas.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </fieldset>
  );
}

/* ── Section: Availability ──────────────────────────────────────────────────── */

function SeccionDisponibilidad({
  activo,
  onToggle,
}: {
  activo: boolean;
  onToggle: (valor: boolean) => void;
}) {
  const id = React.useId();
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2.5 font-display text-step-0 font-semibold text-ink">
        Disponibilidad
      </legend>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 text-step-0 text-ink hover:bg-paper-3"
      >
        <input
          id={id}
          type="checkbox"
          checked={activo}
          onChange={(e) => onToggle(e.target.checked)}
          className="size-4.5 shrink-0 cursor-pointer accent-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
        <span className="font-medium">Solo con stock</span>
      </label>
    </fieldset>
  );
}

/* ── Chips of the active filters ────────────────────────────────────────────── */

interface ChipActivo {
  clave: string;
  etiqueta: string;
  onQuitar: () => void;
}

function ChipsActivos({ chips }: { chips: ChipActivo[] }) {
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Filtros activos">
      {chips.map((chip) => (
        <li key={chip.clave}>
          <button
            type="button"
            onClick={chip.onQuitar}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-primary/30 bg-primary-50 px-3 py-1",
              "text-[0.82rem] font-medium text-primary-600",
              "transition-colors hover:bg-primary-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <span>{chip.etiqueta}</span>
            <X aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
            <span className="sr-only">Quitar filtro</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ── Shared panel content (desktop and drawer) ──────────────────────────────── */

function PanelContenido({
  categorias,
  marcas,
}: {
  categorias: CategoriaFiltroProp[];
  marcas: string[];
}) {
  const searchParams = useSearchParams();
  const actualizar = useActualizarFiltros();

  const cat = searchParams.get("cat");
  const marca = searchParams.get("marca");
  const min = searchParams.get("min") ?? "";
  const max = searchParams.get("max") ?? "";
  const disp = searchParams.get("disp") === "1";

  const hayActivos =
    cat !== null ||
    marca !== null ||
    min !== "" ||
    max !== "" ||
    disp ||
    searchParams.get("q") !== null;

  const limpiar = () =>
    actualizar({
      cat: null,
      marca: null,
      min: null,
      max: null,
      disp: null,
      q: null,
    });

  return (
    <div className="flex flex-col gap-6">
      <SeccionCategorias
        categorias={categorias}
        activa={cat}
        onSelect={(slug) => actualizar({ cat: slug })}
      />
      <hr className="border-line" />
      <SeccionPrecio
        min={min}
        max={max}
        onCommit={(campo, valor) => actualizar({ [campo]: valor || null })}
      />
      <hr className="border-line" />
      <SeccionMarca
        marcas={marcas}
        activa={marca}
        onSelect={(m) => actualizar({ marca: m })}
      />
      <hr className="border-line" />
      <SeccionDisponibilidad
        activo={disp}
        onToggle={(v) => actualizar({ disp: v ? "1" : null })}
      />
      {hayActivos && (
        <Button type="button" variant="ghost" size="sm" onClick={limpiar}>
          <X aria-hidden="true" className="size-4" strokeWidth={2} />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}

/* ── Building the active chips (shared) ─────────────────────────────────────── */

function useChips(
  categorias: CategoriaFiltroProp[],
): ChipActivo[] {
  const searchParams = useSearchParams();
  const actualizar = useActualizarFiltros();

  const chips: ChipActivo[] = [];
  const q = searchParams.get("q");
  const cat = searchParams.get("cat");
  const marca = searchParams.get("marca");
  const min = searchParams.get("min");
  const max = searchParams.get("max");
  const disp = searchParams.get("disp") === "1";

  if (q) {
    chips.push({
      clave: "q",
      etiqueta: `“${q}”`,
      onQuitar: () => actualizar({ q: null }),
    });
  }
  if (cat) {
    const nombre = categorias.find((c) => c.slug === cat)?.nombre ?? cat;
    chips.push({
      clave: "cat",
      etiqueta: nombre,
      onQuitar: () => actualizar({ cat: null }),
    });
  }
  if (marca) {
    chips.push({
      clave: "marca",
      etiqueta: marca,
      onQuitar: () => actualizar({ marca: null }),
    });
  }
  // min=0 without max filters nothing: do not render a confusing chip.
  if ((min && Number(min) > 0) || max) {
    const desde = min ? formatearLempiras(Number(min)) : "L 0.00";
    const hasta = max ? formatearLempiras(Number(max)) : "∞";
    chips.push({
      clave: "precio",
      etiqueta: `${desde} – ${hasta}`,
      onQuitar: () => actualizar({ min: null, max: null }),
    });
  }
  if (disp) {
    chips.push({
      clave: "disp",
      etiqueta: "Con stock",
      onQuitar: () => actualizar({ disp: null }),
    });
  }

  return chips;
}

/** Counts the active filters for the mobile button's badge (excludes q/sort). */
function contarActivos(searchParams: URLSearchParams): number {
  let n = 0;
  if (searchParams.get("cat")) n += 1;
  if (searchParams.get("marca")) n += 1;
  if (searchParams.get("min") || searchParams.get("max")) n += 1;
  if (searchParams.get("disp") === "1") n += 1;
  return n;
}

/* ── Main component ─────────────────────────────────────────────────────────── */

export function FiltrosCatalogo({
  categorias,
  marcas,
}: {
  categorias: CategoriaFiltroProp[];
  marcas: string[];
}) {
  const searchParams = useSearchParams();
  const reducir = useReducedMotion();
  const [abierto, setAbierto] = React.useState(false);
  const disparadorRef = React.useRef<HTMLButtonElement>(null);

  const chips = useChips(categorias);
  const nActivos = contarActivos(
    new URLSearchParams(searchParams.toString()),
  );

  React.useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  const cerrar = () => {
    setAbierto(false);
    disparadorRef.current?.focus();
  };

  return (
    <>
      {/* Active chips: visible at all sizes */}
      {chips.length > 0 && (
        <div className="mb-4">
          <ChipsActivos chips={chips} />
        </div>
      )}

      {/* "Filtrar" button — <lg only */}
      <div className="lg:hidden">
        <Button
          ref={disparadorRef}
          type="button"
          variant="outline"
          size="md"
          onClick={() => setAbierto(true)}
          aria-expanded={abierto}
          aria-controls="filtros-drawer"
          className="w-full"
        >
          <SlidersHorizontal
            aria-hidden="true"
            className="size-4.5"
            strokeWidth={2}
          />
          Filtrar
          {nActivos > 0 && (
            <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-[var(--radius-pill)] bg-accent px-1.5 text-[0.72rem] font-bold text-on-accent">
              {nActivos}
            </span>
          )}
        </Button>
      </div>

      {/* Fixed panel — lg+ only */}
      <div className="hidden lg:block">
        <PanelContenido categorias={categorias} marcas={marcas} />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Cerrar filtros"
              onClick={cerrar}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            />
            <motion.div
              id="filtros-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Filtros del catálogo"
              initial={reducir ? { opacity: 0 } : { x: "-100%" }}
              animate={reducir ? { opacity: 1 } : { x: 0 }}
              exit={reducir ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-paper shadow-lift"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <span className="font-display text-step-1 font-semibold">
                  Filtros
                </span>
                <button
                  type="button"
                  onClick={cerrar}
                  aria-label="Cerrar filtros"
                  className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-ink hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <PanelContenido categorias={categorias} marcas={marcas} />
              </div>
              <div className="border-t border-line p-4">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={cerrar}
                  className="w-full"
                >
                  Ver resultados
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
