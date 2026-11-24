import { Contract, Payment } from "@/types/database";
import { getPaymentStatus, getContractStatus } from "@/components/shared/StatusBadge";
import { formatDateBG, formatCurrency } from "@/components/shared/StatusBadge";
import { startOfDay } from "@/lib/useToday";

export function calculateMonthlyRevenue(contracts: Contract[]): number {
  return contracts.reduce((sum, c) => sum + c.monthly_fee, 0);
}

export function getOverdueContracts(contracts: Contract[], today?: Date): Contract[] {
  const refToday = today ?? new Date();
  const todayStart = startOfDay(refToday);
  return contracts.filter((c) => {
    const paidUntil = new Date(c.paid_until_date);
    paidUntil.setHours(0, 0, 0, 0);
    return paidUntil < todayStart && !c.is_archived;
  });
}

export function getUpcomingPaymentContracts(contracts: Contract[], today?: Date): Contract[] {
  const refToday = today ?? new Date();
  const todayStart = startOfDay(refToday);
  const fifteenDaysLater = new Date(todayStart);
  fifteenDaysLater.setDate(fifteenDaysLater.getDate() + 15);
  
  return contracts.filter((c) => {
    const paidUntil = new Date(c.paid_until_date);
    paidUntil.setHours(0, 0, 0, 0);
    return paidUntil >= todayStart && paidUntil <= fifteenDaysLater && !c.is_archived;
  });
}

export function getExpiringContracts(contracts: Contract[], today?: Date): Contract[] {
  const refToday = today ?? new Date();
  const todayStart = startOfDay(refToday);
  const thirtyDaysLater = new Date(todayStart);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  
  return contracts.filter((c) => {
    const end = new Date(c.end_date);
    end.setHours(0, 0, 0, 0);
    return end >= todayStart && end <= thirtyDaysLater && !c.is_archived;
  });
}

export function calculateOverdueAmount(contracts: Contract[], today?: Date): number {
  return getOverdueContracts(contracts, today).reduce((sum, c) => sum + c.monthly_fee, 0);
}

export function sortByUrgency(contracts: Contract[], today?: Date): Contract[] {
  const refToday = today ?? new Date();
  const todayStart = startOfDay(refToday);
  
  return [...contracts].sort((a, b) => {
    const aPaidUntil = new Date(a.paid_until_date);
    aPaidUntil.setHours(0, 0, 0, 0);
    const bPaidUntil = new Date(b.paid_until_date);
    bPaidUntil.setHours(0, 0, 0, 0);
    
    const aOverdue = aPaidUntil < todayStart;
    const bOverdue = bPaidUntil < todayStart;
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    // По-скоро изтичащи първо
    const aEnd = new Date(a.end_date);
    aEnd.setHours(0, 0, 0, 0);
    const bEnd = new Date(b.end_date);
    bEnd.setHours(0, 0, 0, 0);
    
    return aEnd.getTime() - bEnd.getTime();
  });
}

export function formatContractDisplay(
  c: Contract,
  today?: Date
): {
  paymentStatus: ReturnType<typeof getPaymentStatus>;
  contractStatus: ReturnType<typeof getContractStatus>;
  monthlyFeeFormatted: string;
  startDateFormatted: string;
  endDateFormatted: string;
  paidUntilFormatted: string;
} {
  return {
    paymentStatus: getPaymentStatus(c.paid_until_date, c.end_date, today),
    contractStatus: getContractStatus(c.end_date, today),
    monthlyFeeFormatted: formatCurrency(c.monthly_fee),
    startDateFormatted: formatDateBG(c.start_date),
    endDateFormatted: formatDateBG(c.end_date),
    paidUntilFormatted: formatDateBG(c.paid_until_date),
  };
}