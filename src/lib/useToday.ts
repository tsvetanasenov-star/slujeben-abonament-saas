"use client";

import { useState, useEffect } from "react";

/**
 * Безварен хук за текуща дата в Client Component.
 * Initialize с null, след монтирането задава реалната днешна дата,
 * за да се избягне Next.js 16 "unstable value" грешка при рендерирането.
 */
export function useToday(): Date | null {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  return today;
}

/**
 * Помагателна функция: нормализира дата до начало на деня (00:00:00.000)
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Разлика в дни между две дати (цели дни)
 */
export function daysBetween(date1: Date, date2: Date): number {
  const d1 = startOfDay(date1);
  const d2 = startOfDay(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}