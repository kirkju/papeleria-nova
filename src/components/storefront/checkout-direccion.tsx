"use client";

import * as React from "react";
import { MapPin, Check, Plus } from "lucide-react";
import { DEPARTAMENTOS_HONDURAS } from "@/lib/validators/checkout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * SeccionDireccion — "Dirección de envío" block of the checkout form.
 *
 * It does NOT handle submit or action: it is a section INSIDE the <form> that the
 * assembling page builds. It only emits the `name`s of the FORMDATA CONTRACT with
 * local interactivity (controlled radios, showing/hiding the new-address form).
 *
 * `direccionModo` mechanism (key): there is a single <input type="hidden"
 * name="direccionModo"> whose value is kept in sync with the selected radio.
 * - Selecting a saved address -> "guardada" + direccionId is sent.
 * - Selecting "Usar una dirección nueva" -> "nueva" + the fields
 *   linea1/linea2/ciudad/departamento/telefono + the guardarDireccion checkbox are shown.
 * When there are NO saved addresses, the mode is always "nueva" and the block
 * of fields is shown directly (no radio cards).
 *
 * The `nombre` field (the recipient) is ALWAYS visible (always required).
 *
 * Names emitted: nombre, direccionModo (hidden), direccionId (radio, guardada mode
 * only), linea1, linea2 (optional), ciudad, departamento, telefono,
 * guardarDireccion (checkbox value="1", nueva mode only).
 *
 * Usage:
 *   <SeccionDireccion direcciones={direcciones} nombreInicial={usuario.nombre} />
 */
export interface DireccionGuardada {
  id: string;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  departamento: string;
  telefono: string;
  esPredeterminada: boolean;
}

const VALOR_NUEVA = "nueva";

export function SeccionDireccion({
  direcciones,
  nombreInicial,
}: {
  direcciones: DireccionGuardada[];
  nombreInicial?: string;
}) {
  const hayGuardadas = direcciones.length > 0;

  // Preselection: the default one, or the first one, or "nueva" if there is none.
  const idInicial = React.useMemo(() => {
    if (!hayGuardadas) return VALOR_NUEVA;
    const pred = direcciones.find((d) => d.esPredeterminada);
    return pred?.id ?? direcciones[0].id;
  }, [direcciones, hayGuardadas]);

  // `seleccion` is the id of a saved address or the "nueva" sentinel.
  const [seleccion, setSeleccion] = React.useState<string>(idInicial);

  const modoNueva = seleccion === VALOR_NUEVA;
  const direccionModo = modoNueva ? "nueva" : "guardada";

  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-1 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary"
        >
          <MapPin className="size-5" strokeWidth={2} />
        </span>
        <span className="font-display text-step-1 font-semibold text-ink">
          Dirección de envío
        </span>
      </legend>

      {/* direccionModo mechanism: a single hidden input that mirrors the selection.
          The server ALWAYS reads this field (and direccionId only if it is guardada). */}
      <input type="hidden" name="direccionModo" value={direccionModo} />

      {/* Recipient's name — ALWAYS visible and required. */}
      <Input
        label="¿Quién recibe el pedido?"
        name="nombre"
        autoComplete="name"
        defaultValue={nombreInicial}
        required
        placeholder="Ej. María Fernanda López"
        hint="Nombre completo de la persona que recibirá los útiles."
      />

      {hayGuardadas && (
        <div
          role="radiogroup"
          aria-label="Elige una dirección de envío"
          className="flex flex-col gap-3"
        >
          {direcciones.map((dir) => (
            <DireccionCard
              key={dir.id}
              direccion={dir}
              seleccionado={seleccion === dir.id}
              onSeleccionar={() => setSeleccion(dir.id)}
            />
          ))}

          {/* "Usar una dirección nueva" option as one more card of the group. */}
          <NuevaDireccionCard
            seleccionado={modoNueva}
            onSeleccionar={() => setSeleccion(VALOR_NUEVA)}
          />
        </div>
      )}

      {/* New-address form: visible in "nueva" mode (or with no saved ones).
          The fields only contribute data to the FormData when direccionModo="nueva";
          the server ignores them in "guardada" mode. */}
      {modoNueva && <CamposDireccionNueva />}
    </fieldset>
  );
}

/**
 * DireccionCard — accessible radio card for a saved address.
 * The real radio input (name="direccionId") is visually hidden but
 * accessible; the whole card is the clickable/focusable target via the <label>.
 */
function DireccionCard({
  direccion,
  seleccionado,
  onSeleccionar,
}: {
  direccion: DireccionGuardada;
  seleccionado: boolean;
  onSeleccionar: () => void;
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border bg-paper-2 p-4",
        "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-paper",
        seleccionado
          ? "border-primary shadow-card ring-1 ring-primary/30"
          : "border-line hover:border-line-strong hover:bg-paper-3/40",
      )}
    >
      <input
        type="radio"
        name="direccionId"
        value={direccion.id}
        checked={seleccionado}
        onChange={onSeleccionar}
        className="sr-only"
      />

      {/* Drawn radio indicator (the real input is hidden). */}
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          seleccionado
            ? "border-primary bg-primary text-on-primary"
            : "border-line-strong bg-paper",
        )}
      >
        {seleccionado && <Check className="size-3" strokeWidth={4} />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-ink">{direccion.linea1}</span>
          {direccion.esPredeterminada && (
            <Badge variant="nuevo">Predeterminada</Badge>
          )}
        </span>
        {direccion.linea2 && (
          <span className="mt-0.5 block text-[0.9rem] text-ink-soft">
            {direccion.linea2}
          </span>
        )}
        <span className="mt-0.5 block text-[0.9rem] text-ink-soft">
          {direccion.ciudad}, {direccion.departamento}
        </span>
        <span className="mt-0.5 block text-[0.85rem] text-ink-faint">
          Tel. {direccion.telefono}
        </span>
      </span>
    </label>
  );
}

/** "Usar una dirección nueva" card: activates the form with the new fields. */
function NuevaDireccionCard({
  seleccionado,
  onSeleccionar,
}: {
  seleccionado: boolean;
  onSeleccionar: () => void;
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border border-dashed bg-paper-2 p-4",
        "transition-[border-color,background-color] duration-200 ease-out",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-paper",
        seleccionado
          ? "border-primary bg-primary-50/40"
          : "border-line-strong hover:border-primary/50 hover:bg-paper-3/40",
      )}
    >
      <input
        type="radio"
        name="direccionId"
        value={VALOR_NUEVA}
        checked={seleccionado}
        onChange={onSeleccionar}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors",
          seleccionado
            ? "bg-primary text-on-primary"
            : "bg-paper-3 text-ink-soft",
        )}
      >
        <Plus className="size-5" strokeWidth={2.25} />
      </span>
      <span className="font-medium text-ink">Usar una dirección nueva</span>
    </label>
  );
}

/**
 * CamposDireccionNueva — CONTRACT fields for a new address.
 * telefono uses a lenient pattern (8 Honduran digits, 9999-9999) and
 * departamento is a select fed by DEPARTAMENTOS_HONDURAS (without duplicating the list).
 */
function CamposDireccionNueva() {
  const departamentoId = React.useId();

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-line bg-paper p-4 sm:p-5">
      <Input
        label="Dirección (calle, número, colonia)"
        name="linea1"
        autoComplete="address-line1"
        required
        placeholder="Ej. Col. Las Mercedes, Calle 3, casa #12"
      />

      <Input
        label="Referencia o apartamento (opcional)"
        name="linea2"
        autoComplete="address-line2"
        placeholder="Ej. Edificio Azul, apto. 4-B"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Ciudad"
          name="ciudad"
          autoComplete="address-level2"
          required
          placeholder="Ej. Tegucigalpa"
        />

        {/* Department select: style consistent with Input. */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={departamentoId}
            className="text-[0.875rem] font-medium text-ink-soft"
          >
            Departamento
          </label>
          <select
            id={departamentoId}
            name="departamento"
            required
            defaultValue=""
            autoComplete="address-level1"
            className={cn(
              "h-11 w-full rounded-[var(--radius-md)] border border-line bg-paper-2 px-3.5 text-step-0 text-ink",
              "transition-[border-color,box-shadow] duration-200 ease-out",
              "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            )}
          >
            <option value="" disabled>
              Selecciona un departamento
            </option>
            {DEPARTAMENTOS_HONDURAS.map((depto) => (
              <option key={depto} value={depto}>
                {depto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label="Teléfono"
        name="telefono"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        required
        // Lenient pattern: 8 digits, with or without a hyphen (9999-9999). The server
        // validates strictly with Zod; here we only guide the user.
        pattern="[0-9]{4}-?[0-9]{4}"
        placeholder="9999-9999"
        hint="Formato hondureño: 8 dígitos (ej. 9988-7766)."
      />

      <label className="flex cursor-pointer items-start gap-2.5 text-step-0 text-ink-soft">
        <input
          type="checkbox"
          name="guardarDireccion"
          value="1"
          defaultChecked
          className="mt-0.5 size-4.5 shrink-0 rounded-[var(--radius-sm)] border-line-strong accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        />
        <span>Guardar esta dirección para próximas compras.</span>
      </label>
    </div>
  );
}
