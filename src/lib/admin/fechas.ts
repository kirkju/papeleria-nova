/**
 * DATE helpers for the admin — PURE, deterministic and testable.
 *
 * No Prisma, no Next, no side effects. They compute time ranges (current month /
 * previous month / today) and group sales by day into a CONTINUOUS series (days
 * without sales are filled with 0) to feed the dashboard charts.
 *
 * Everything works in the server's LOCAL time zone (not UTC): "today" and the
 * month/day boundaries are computed in local time, which is what the store's
 * team expects to see in the reports. Labeled dates are shown in the short
 * `DD/MM` format (project convention).
 */

/** A half-open range `[inicio, fin)`: inclusive start, exclusive end. */
export type RangoFechas = {
  /** Inclusive lower bound. */
  inicio: Date;
  /** EXCLUSIVE upper bound (use `lt` in Prisma, not `lte`). */
  fin: Date;
};

/** A point of the sales-per-day series for the charts. */
export type PuntoVentaDia = {
  /** Short label of the day, `DD/MM` (local time zone). */
  fecha: string;
  /** Amount sold that day in Lempiras (0 if there were no sales). */
  monto: number;
};

/**
 * Start of the day (00:00:00.000 local time) of the given date.
 * Does not mutate the argument.
 */
export function inicioDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Range of the given day: `[00:00 of that day, 00:00 of the next day)`.
 * Defaults to TODAY (per the server clock).
 */
export function rangoHoy(ahora: Date = new Date()): RangoFechas {
  const inicio = inicioDelDia(ahora);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);
  return { inicio, fin };
}

/**
 * Range of the current MONTH: `[day 1 00:00, day 1 of the next month 00:00)`.
 * Defaults to the month that contains `ahora`.
 */
export function rangoMesActual(ahora: Date = new Date()): RangoFechas {
  const inicio = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );
  const fin = new Date(
    ahora.getFullYear(),
    ahora.getMonth() + 1,
    1,
    0,
    0,
    0,
    0,
  );
  return { inicio, fin };
}

/**
 * Range of the MONTH BEFORE the one that contains `ahora`.
 * `[day 1 of the previous month 00:00, day 1 of the current month 00:00)`.
 * The `Date` constructor normalizes December of the previous year automatically.
 */
export function rangoMesAnterior(ahora: Date = new Date()): RangoFechas {
  const inicio = new Date(
    ahora.getFullYear(),
    ahora.getMonth() - 1,
    1,
    0,
    0,
    0,
    0,
  );
  const fin = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );
  return { inicio, fin };
}

/** `DD/MM` label (zero-padded) in local time. */
function etiquetaDiaMes(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

/** Stable `YYYY-MM-DD` key (local time) to group by day without collisions. */
function claveDia(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Normalizes an order's date (Date or ISO string) to a `Date`. */
function aFecha(valor: Date | string): Date {
  return valor instanceof Date ? valor : new Date(valor);
}

/**
 * Groups sales by day into a CONTINUOUS series over the last `dias` days
 * (today included), filling the days without sales with `monto: 0`.
 *
 * - The series runs from `dias - 1` days ago up to TODAY (ascending chronological
 *   order), so it always has exactly `dias` points.
 * - Orders whose date falls OUTSIDE the window (older than the first day, or
 *   invalid) are silently ignored.
 * - The day is determined by the order's LOCAL date (same criterion as the
 *   other helpers in this module).
 *
 * @param pedidos Orders with their creation date and their `total` already as a
 *                number (the Decimal->number conversion happens in the data layer).
 * @param dias    Window size (30 by default). If it is <= 0, an empty series.
 * @param ahora   Reference clock (injectable for tests). Defaults to now().
 */
export function agruparVentasPorDia(
  pedidos: { creadoEn: Date | string; total: number }[],
  dias = 30,
  ahora: Date = new Date(),
): PuntoVentaDia[] {
  if (dias <= 0) return [];

  // Accumulates amounts per day key (local YYYY-MM-DD).
  const acumulado = new Map<string, number>();
  for (const p of pedidos) {
    const fecha = aFecha(p.creadoEn);
    if (Number.isNaN(fecha.getTime())) continue; // invalid date -> ignore
    const total = Number.isFinite(p.total) ? p.total : 0;
    const clave = claveDia(fecha);
    acumulado.set(clave, (acumulado.get(clave) ?? 0) + total);
  }

  // Builds the continuous series backwards from today and leaves it ascending.
  const hoy = inicioDelDia(ahora);
  const serie: PuntoVentaDia[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const dia = new Date(hoy);
    dia.setDate(dia.getDate() - i);
    serie.push({
      fecha: etiquetaDiaMes(dia),
      monto: acumulado.get(claveDia(dia)) ?? 0,
    });
  }
  return serie;
}

/**
 * Percentage change between two periods.
 *
 * @returns The percentage change from `anterior` to `actual` (e.g. 100 -> 150
 *          gives `50`), or `null` if `anterior` is 0 (there is no baseline to
 *          compare against; the UI must show "—" or "new" in that case, never
 *          "∞%"). Rounding is applied to 1 decimal place.
 */
export function variacionPorcentual(
  actual: number,
  anterior: number,
): number | null {
  if (anterior === 0) return null;
  const variacion = ((actual - anterior) / anterior) * 100;
  return Math.round(variacion * 10) / 10;
}
