"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

interface StaggerGridProps {
  cols?: 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}

const colClass = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

export function StaggerGrid({ cols = 4, children, className = "" }: StaggerGridProps) {
  return (
    <motion.div
      className={`grid gap-4 ${colClass[cols]} ${className}`}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={item}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={item}>{children}</motion.div>}
    </motion.div>
  );
}
