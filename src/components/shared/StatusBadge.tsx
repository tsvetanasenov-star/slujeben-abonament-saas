import { Badge } from "@/components/ui/badge";
import { Contract, PaymentStatusInfo, ContractStatusInfo } from "@/types/database";
import { format } from "date-fns";
import { startOfDay } from "@/lib/useToday";

export function getPaymentStatus(
  paidUntilDate: string | Date,
  endDate?: string | Date,
  today?: Date
): PaymentStatusInfo {
  const refToday = today ?? new Date();
  const todayStart = startOfDay(refToday);

  const paidUntil = new Date(paidUntilDate);
  paidUntil.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (paidUntil.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Платени изцяло
  if (end && paidUntil >= end) {
    return {
      label: "Платени изцяло",
      color: "diamond",
      icon: "💎",
    };
  }

  // Просрочен
  if (paidUntil < todayStart) {
    return {
      label: `Просрочен с ${Math.abs(diffDays)} дни`,
      color: "red",
      days: Math.abs(diffDays),
      icon: "🔴",
    };
  }

  // Предстои плащане (до 15 дни)
  if (diffDays <= 15) {
    return {
      label: `Изтича след ${diffDays} дни`,
      color: "yellow",
      days: diffDays,
      icon: "🟡",
    };
  }

  // Редовен
  return {
    label: "Редовен",
    color: "green",
    days: diffDays,
    icon: "🟢",
  };
}

export function getContractStatus(
  endDate: string | Date,
  today?: Date
): ContractStatusInfo {
  const refToday = today ?? new Date();
  const todayStart = startOfDay(refToday);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (end.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Изтекъл договор
  if (diffDays < 0) {
    return {
      label: "Изтекъл договор",
      color: "red",
      days: Math.abs(diffDays),
    };
  }

  // Изтича скоро (до 30 дни)
  if (diffDays <= 30) {
    return {
      label: "Изтича скоро",
      color: "orange",
      days: diffDays,
    };
  }

  // Активен
  return {
    label: "Активен",
    color: "green",
    days: diffDays,
  };
}

export function formatDateBG(date: string | Date): string {
  return format(new Date(date), "dd.MM.yyyy");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatBGDate(date: Date): string {
  return format(date, "dd.MM.yyyy");
}