"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote } from "lucide-react";

interface PaymentQuickSelect {
  label: string;
  months: number;
}

const QUICK_SELECT_OPTIONS: PaymentQuickSelect[] = [
  { label: "1 месец", months: 1 },
  { label: "2 месеца", months: 2 },
  { label: "3 месеца", months: 3 },
  { label: "6 месеца", months: 6 },
  { label: "До края на договора", months: 12 },
];

export interface PaymentPayload {
  contract_id: string;
  contract?: { id?: string; client_name: string; monthly_fee?: number; monthlyFee?: number; paid_until_date?: string; start_date?: string; end_date?: string };
  amount: number;
  monthsCovered: number;
  paymentDate: string;
  paymentMethod: string;
  documentNumber: string;
  expectedMonthlyFee?: number;
}

interface RecordPaymentDialogProps {
  contract?: { id?: string; client_name: string; monthly_fee?: number; monthlyFee?: number; paid_until_date: string; start_date: string; end_date: string };
  onClose?: () => void;
  onSave?: (payment: PaymentPayload) => void | Promise<void>;
}

export function RecordPaymentDialog({ contract, onClose, onSave }: RecordPaymentDialogProps) {
  const [monthsCovered, setMonthsCovered] = useState(1);
  const [manualAmount, setManualAmount] = useState("");
  const [expectedMonthlyFee, setExpectedMonthlyFee] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Банков превод");
  const [documentNumber, setDocumentNumber] = useState("");

  useEffect(() => {
    if (contract) {
      const now = new Date();
      setPaymentDate(now.toISOString().split("T")[0]);
      setManualAmount("");
      setMonthsCovered(1);
      setExpectedMonthlyFee("");
    }
  }, [contract]);

  const contractMonthlyFee = Number(contract?.monthly_fee ?? contract?.monthlyFee ?? 0);
  const effectiveMonthlyFee = contractMonthlyFee > 0 ? contractMonthlyFee : (Number(expectedMonthlyFee) || 0);
  const hasExpectedFee = contractMonthlyFee <= 0 && expectedMonthlyFee.trim() !== "";
  const calculatedAmount = effectiveMonthlyFee * monthsCovered;
  const amountFromMonths = manualAmount ? Number(manualAmount) : calculatedAmount;
  const autoMonthsFromAmount = effectiveMonthlyFee > 0 && manualAmount ? Math.max(1, Math.round(Number(manualAmount) / effectiveMonthlyFee * 100) / 100) : monthsCovered;
  const isExactMultiple = effectiveMonthlyFee > 0 && manualAmount ? Number(manualAmount) % effectiveMonthlyFee === 0 : true;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualAmount(e.target.value);
    if (effectiveMonthlyFee > 0 && e.target.value.trim() !== "") {
      const calculatedMonths = Math.max(1, Math.round(Number(e.target.value) / effectiveMonthlyFee * 100) / 100);
      setMonthsCovered(calculatedMonths);
    }
  };

  const handleMonthsChange = (months: number) => {
    setMonthsCovered(months);
    setManualAmount("");
  };

  const handleExpectedFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpectedMonthlyFee(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) {
      alert("Неможе да се запише плащане: не е избран договор.");
      return;
    }
    const feeToUse = contractMonthlyFee > 0 ? contractMonthlyFee : Number(expectedMonthlyFee);
    if (!feeToUse || feeToUse <= 0) {
      alert("Моля, задайте очаквана месечна такса.");
      return;
    }
    try {
      await onSave?.({
        contract_id: contract.id!,
        contract,
        amount: Number(amountFromMonths),
        monthsCovered: autoMonthsFromAmount,
        paymentDate: paymentDate || new Date().toISOString().split("T")[0],
        paymentMethod,
        documentNumber,
        expectedMonthlyFee: contractMonthlyFee <= 0 ? feeToUse : undefined,
      });
      onClose?.();
    } catch (err: any) {
      alert("Грешка при записване на плащане: " + (err?.message || String(err)));
    }
  };

  const newPaidUntil = contract
    ? new Date(new Date(contract.paid_until_date).getTime() + autoMonthsFromAmount * 30 * 24 * 60 * 60 * 1000)
    : null;

  const remainingMonths = contract
    ? Math.max(
        0,
        Math.min(
          12,
          Math.ceil(
            (new Date(contract.end_date).getTime() -
              new Date(contract.paid_until_date || contract.start_date || contract.end_date).getTime()) /
              (30 * 24 * 60 * 60 * 1000)
          )
        )
      )
    : null;

  return (
    <Dialog open={!!contract} onOpenChange={(open: boolean) => { if (!open) onClose?.(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Запиши плащане</DialogTitle>
          <DialogDescription>
            {contract ? (
              <p className="text-sm text-muted-foreground">
                Клиент:{" "}
                <strong className="font-semibold text-foreground">
                  {contract?.client_name || "—"}
                </strong>
              </p>
            ) : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Текуща валидност до</Label>
              <div className="text-sm text-muted-foreground">
                {contract ? new Date(contract.paid_until_date).toLocaleDateString("bg-BG") : "—"}
              </div>
            </div>
            <div>
              <Label>Оставащи месеци до края на договора</Label>
              <div className="text-sm text-muted-foreground">
                {remainingMonths !== null ? String(remainingMonths) : "—"}
              </div>
            </div>
          </div>

          {contractMonthlyFee <= 0 && (
            <div className="space-y-1">
              <Label>Очаквана месечна такса (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expectedMonthlyFee}
                onChange={handleExpectedFeeChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Задайте очакваната месечна такса, с която да се изчислят покритите месеци.
              </p>
            </div>
          )}
          <div className="space-y-1">
            <Label>Изберете период</Label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_SELECT_OPTIONS.map((opt) => (
                <Button
                  key={opt.label}
                  variant={monthsCovered === opt.months ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMonthsChange(opt.months)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Сума (EUR)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                value={amountFromMonths || String(calculatedAmount)}
                onChange={handleAmountChange}
              />
              <span className="text-muted-foreground text-sm">EUR</span>
            </div>
            {effectiveMonthlyFee > 0 && manualAmount && !isExactMultiple && (
              <p className="text-xs text-yellow-600">
                Сумата не е точната кратна на месечната такса. Месеците са изчислени заокръжено.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {monthsCovered} месец{monthsCovered === 1 ? "" : monthsCovered <= 4 ? "а" : "ца"} × {effectiveMonthlyFee.toFixed(2)} EUR ={" "}
              <span className="font-medium">{calculatedAmount.toFixed(2)} EUR</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Дата на плащане</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Метод на плащане</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border rounded px-2 py-1 bg-background"
              >
                <option>Банков превод</option>
                <option>ПОС терминал</option>
                <option>В брой</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Номер на документ / фактура</Label>
            <Input
              placeholder="Напр. Ф-2025-001"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
          </div>
          {newPaidUntil && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">
                  Нова дата на валидност:{newPaidUntil.toLocaleDateString("bg-BG")}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onClose?.()}>
              Отказ
            </Button>
            <Button type="submit">Запиши плащане</Button>
          </div>
      </form>
    </DialogContent>
  </Dialog>
);
}