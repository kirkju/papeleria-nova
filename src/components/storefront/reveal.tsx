"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Reveal — subtle entrance on scroll (fade + slight rise). Respects
 * prefers-reduced-motion (no displacement). Meant for sections of the
 * home page. For grids with stagger, see RevealGroup / RevealItem.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
}) {
  const reducir = useReducedMotion();
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial={reducir ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}

const grupoVariants: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  oculto: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const itemVariantsReducido: Variants = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

/** Container that applies a slight stagger to its RevealItem children. */
export function RevealGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.ul
      className={className}
      variants={grupoVariants}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.ul>
  );
}

/** Animated item inside RevealGroup. Renders an <li>. */
export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reducir = useReducedMotion();
  return (
    <motion.li
      className={className}
      variants={reducir ? itemVariantsReducido : itemVariants}
    >
      {children}
    </motion.li>
  );
}
