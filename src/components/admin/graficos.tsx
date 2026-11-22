"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatearLempiras } from "@/lib/utils";

/**
 * graficos.tsx — dashboard charts (Recharts). CLIENT ISLANDS.
 *
 * Recharts needs the DOM, so these components are "use client", but the
 * DATA arrives ALREADY computed through props from the server (Server Components /
 * server actions with Prisma). NOTHING is aggregated or queried here.
 *
 * Rules common to all three:
 *  - Colors ALWAYS through tokens: "var(--color-primary)", "var(--color-accent)", etc.
 *    Recharts accepts these strings in fill/stroke.
 *  - Wrapper with role="img" + a descriptive aria-label (the Recharts SVG is not
 *    accessible by itself; we give the summary to the screen reader).
 *  - ResponsiveContainer, height ~280px.
 *  - Tooltips in Lempiras format where applicable; nothing is conveyed by color
 *    alone (there are axes, a legend with values and tooltips with text).
 *
 * If `data` arrives empty, a message is shown instead of an empty chart.
 */

const ALTURA = 280;

/* Axis ticks in whole Lempiras ("L 1,600"): short enough to stay on one line. */
const formateadorEje = new Intl.NumberFormat("es-HN", { maximumFractionDigits: 0 });
const formatearEje = (v: number) => `L ${formateadorEje.format(v)}`;

/* Token palette for categorical series (donut). Strings that Recharts
   resolves as CSS custom properties at render time. */
const PALETA_CATEGORIAS = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-mint)",
  "var(--color-amber)",
  "var(--color-rose)",
  "var(--color-cat-tecnologia)",
  "var(--color-cat-manualidades)",
  "var(--color-primary-600)",
] as const;

function SinDatos({ mensaje }: { mensaje: string }) {
  return (
    <div
      className="grid place-items-center rounded-[var(--radius-md)] bg-paper-2 text-step--1 text-ink-faint"
      style={{ height: ALTURA }}
    >
      {mensaje}
    </div>
  );
}

/* Shared tooltip style (paper box). */
const tooltipWrapperStyle: React.CSSProperties = {
  outline: "none",
};
const tooltipContentStyle: React.CSSProperties = {
  background: "var(--color-paper)",
  border: "1px solid var(--color-line-strong)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-soft)",
  color: "var(--color-ink)",
  fontSize: "0.85rem",
  padding: "8px 12px",
};
const tickStyle = { fill: "var(--color-ink-faint)", fontSize: 12 } as const;

/* ── Sales per day (indigo area with gradient) ────────────────────────────── */

export interface PuntoVentasDia {
  fecha: string;
  monto: number;
}

export function GraficoVentasDia({ data }: { data: PuntoVentasDia[] }) {
  const totalLempiras = data.reduce((acc, d) => acc + d.monto, 0);

  if (data.length === 0) {
    return <SinDatos mensaje="Sin ventas en el periodo." />;
  }

  return (
    <div
      role="img"
      aria-label={`Gráfico de área de ventas por día. ${data.length} días, total ${formatearLempiras(
        totalLempiras,
      )}.`}
    >
      <ResponsiveContainer width="100%" height={ALTURA}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="pn-grad-ventas" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-primary)"
                stopOpacity={0.28}
              />
              <stop
                offset="100%"
                stopColor="var(--color-primary)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="fecha"
            tick={tickStyle}
            tickLine={false}
            axisLine={{ stroke: "var(--color-line)" }}
            minTickGap={24}
          />
          <YAxis
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={formatearEje}
          />
          <Tooltip
            wrapperStyle={tooltipWrapperStyle}
            contentStyle={tooltipContentStyle}
            labelStyle={{ color: "var(--color-ink-soft)", marginBottom: 2 }}
            formatter={(value) => [formatearLempiras(Number(value)), "Ventas"]}
          />
          <Area
            type="monotone"
            dataKey="monto"
            name="Ventas"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fill="url(#pn-grad-ventas)"
            activeDot={{ r: 4, fill: "var(--color-primary)" }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Top products (horizontal tangerine bars) ─────────────────────────────── */

export interface PuntoTopProducto {
  nombre: string;
  cantidadVendida: number;
}

function truncar(texto: string, max = 22): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

export function GraficoTopProductos({ data }: { data: PuntoTopProducto[] }) {
  if (data.length === 0) {
    return <SinDatos mensaje="Aún no hay productos vendidos." />;
  }

  // Accessible full name for the wrapper's aria-label.
  const resumen = data
    .map((d) => `${d.nombre}: ${d.cantidadVendida}`)
    .join("; ");

  return (
    <div
      role="img"
      aria-label={`Gráfico de barras de productos más vendidos por cantidad. ${resumen}.`}
    >
      <ResponsiveContainer width="100%" height={ALTURA}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <XAxis
            type="number"
            tick={tickStyle}
            tickLine={false}
            axisLine={{ stroke: "var(--color-line)" }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={140}
            tickFormatter={(v: string) => truncar(v)}
          />
          <Tooltip
            cursor={{ fill: "var(--color-paper-3)", opacity: 0.5 }}
            wrapperStyle={tooltipWrapperStyle}
            contentStyle={tooltipContentStyle}
            labelStyle={{ color: "var(--color-ink-soft)", marginBottom: 2 }}
            formatter={(value) => [`${Number(value)} unidades`, "Vendidas"]}
          />
          <Bar
            dataKey="cantidadVendida"
            name="Unidades vendidas"
            fill="var(--color-accent)"
            radius={[0, 6, 6, 0]}
            maxBarSize={26}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Sales by category (donut) ────────────────────────────────────────────── */

export interface PuntoVentasCategoria {
  categoria: string;
  monto: number;
}

export function GraficoVentasCategoria({
  data,
}: {
  data: PuntoVentasCategoria[];
}) {
  if (data.length === 0) {
    return <SinDatos mensaje="Sin ventas por categoría." />;
  }

  const total = data.reduce((acc, d) => acc + d.monto, 0);
  const resumen = data
    .map((d) => `${d.categoria}: ${formatearLempiras(d.monto)}`)
    .join("; ");

  return (
    <div
      role="img"
      aria-label={`Gráfico de dona de ventas por categoría. Total ${formatearLempiras(
        total,
      )}. ${resumen}.`}
    >
      <ResponsiveContainer width="100%" height={ALTURA}>
        <PieChart>
          <Pie
            data={data}
            dataKey="monto"
            nameKey="categoria"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={2}
            stroke="var(--color-paper)"
            strokeWidth={2}
          >
            {data.map((d, i) => (
              <Cell
                key={d.categoria}
                fill={PALETA_CATEGORIAS[i % PALETA_CATEGORIAS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            wrapperStyle={tooltipWrapperStyle}
            contentStyle={tooltipContentStyle}
            formatter={(value, name) => [
              formatearLempiras(Number(value)),
              String(name),
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => {
              const punto = data.find((d) => d.categoria === value);
              return (
                <span className="text-step--1 text-ink-soft">
                  {value}
                  {punto
                    ? ` · ${formatearLempiras(punto.monto)}`
                    : ""}
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
