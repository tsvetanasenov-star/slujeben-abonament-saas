"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface PaymentItem {
  id: string;
  contract_id?: string;
  amount?: number | string | null;
  months_covered?: number | null;
  months?: number | null;
  payment_date?: string | null;
  date?: string | null;
  payment_method?: string | null;
  method?: string | null;
  document_number?: string | null;
  document?: string | null;
}

interface PaymentHistoryState {
  isLoading: boolean;
  payments: PaymentItem[];
  error: string | null;
}

interface PaymentHistoryDrawerProps {
  contract?: { id: string; client_name: string } | null;
  open?: boolean;
  onClose?: () => void;
  onDeletePayment?: (id: string) => void | Promise<void>;
}

export function PaymentHistoryDrawer({
  contract,
  open,
  onClose,
  onDeletePayment,
}: PaymentHistoryDrawerProps) {
  const [state, setState] = useState<PaymentHistoryState>({
    isLoading: false,
    payments: [],
    error: null,
  });

  const isOpen = open !== undefined ? open : Boolean(contract);

  const loadPayments = async (contractId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("contract_id", contractId)
        .order("payment_date", { ascending: false });

      if (error) {
        setState({ isLoading: false, payments: [], error: error.message });
        return;
      }

      setState({
        isLoading: false,
        payments: Array.isArray(data) ? data : [],
        error: null,
      });
    } catch {
      setState({
        isLoading: false,
        payments: [],
        error: "Грешка при зареждане на плащанията.",
      });
    }
  };

  useEffect(() => {
    if (isOpen && contract?.id) {
      void loadPayments(contract.id);
    } else if (!isOpen) {
      setState({ isLoading: false, payments: [], error: null });
    }
  }, [isOpen, contract?.id]);

  const payments: PaymentItem[] = Array.isArray(state.payments)
    ? state.payments
    : [];

  const safeAmount = (p: PaymentItem): number => {
    const val = Number(p.amount ?? 0);
    return Number.isFinite(val) ? val : 0;
  };

  const safeMonths = (p: PaymentItem): number => {
    const val = Number(p.months_covered ?? p.months ?? 0);
    return Number.isFinite(val) ? val : 0;
  };

  const safeDate = (p: PaymentItem): string => {
    const raw = p.payment_date ?? p.date ?? "";
    if (!raw) return "-";
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime())
      ? raw
      : parsed.toLocaleDateString("bg-BG");
  };

  const safeMethod = (p: PaymentItem): string =>
    p.payment_method ?? p.method ?? "-";

  const safeDocument = (p: PaymentItem): string =>
    p.document_number ?? p.document ?? "-";

  const totalPaid = payments.reduce((sum, p) => sum + safeAmount(p), 0);
  const totalMonths = payments.reduce((sum, p) => sum + safeMonths(p), 0);

  const handleDelete = async (paymentId: string) => {
    if (!onDeletePayment) return;
    await onDeletePayment(paymentId);
    if (contract?.id) {
      await loadPayments(contract.id);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose?.();
        }
      }}
    >
      <DialogContent className="max-w-3xl bg-sky-50 border-2 border-sky-400 text-slate-900 shadow-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900">
            История на плащанията
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-slate-700">
              Клиент:{" "}
              <strong className="font-semibold text-slate-900">
                {contract?.client_name || "-"}
              </strong>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 my-2">
          <div className="bg-white border border-sky-200 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-500">
              ОБЩО ПЛАТЕНИ
            </div>
            <div className="text-base font-semibold text-slate-900 mt-0.5">
              {totalPaid.toFixed(2)} EUR
            </div>
          </div>
          <div className="bg-white border border-sky-200 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-500">
              МЕСЕЦИ ПОКРИТИ
            </div>
            <div className="text-base font-semibold text-slate-900 mt-0.5">
              {totalMonths}
            </div>
          </div>
          <div className="bg-white border border-sky-200 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-500">
              БРОЙ ПЛАЩАНИЯ
            </div>
            <div className="text-base font-semibold text-slate-900 mt-0.5">
              {payments.length}
            </div>
          </div>
        </div>

        {state.error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {state.error}
          </div>
        )}

        <div className="bg-white border border-sky-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Сума</TableHead>
                <TableHead>Месеца</TableHead>
                <TableHead>Метод</TableHead>
                <TableHead>Документ</TableHead>
                <TableHead className="text-right">Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-4 text-sm text-slate-500"
                  >
                    Зареждане на плащанията...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-4 text-sm text-slate-500"
                  >
                    Няма записани плащания за този договор
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{safeDate(payment)}</TableCell>
                    <TableCell>{safeAmount(payment).toFixed(2)} EUR</TableCell>
                    <TableCell>{safeMonths(payment)}</TableCell>
                    <TableCell>{safeMethod(payment)}</TableCell>
                    <TableCell>{safeDocument(payment)}</TableCell>
                    <TableCell className="text-right">
                      {onDeletePayment ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDelete(payment.id)}
                          aria-label="Изтрий плащане"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose?.()}
            className="bg-white border-sky-300 text-slate-900 hover:bg-sky-100"
          >
            Затвори
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
