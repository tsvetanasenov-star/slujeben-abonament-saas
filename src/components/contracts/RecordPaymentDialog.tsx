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
  amount: number;
  monthsCovered: number;
  paymentDate: string;
  paymentMethod: string;
  documentNumber: string;
}

interface RecordPaymentDialogProps {
  contract?: { id?: string; client_name: string; monthly_fee: number; paid_until_date: string; end_date: string };
  onClose?: () => void;
  onSave?: (payment: PaymentPayload) => void | Promise<void>;
}

export function RecordPaymentDialog({ contract, onClose, onSave }: RecordPaymentDialogProps) {
  const [monthsCovered, setMonthsCovered] = useState(1);
  const [manualAmount, setManualAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Банков превод");
  const [documentNumber, setDocumentNumber] = useState("");

  useEffect(() => {
    if (contract) {
      const now = new Date();
      setPaymentDate(now.toISOString().split("T")[0]);
      setManualAmount("");
      setMonthsCovered(1);
    }
  }, [contract]);

  const monthlyFee = contract?.monthly_fee || 0;
  const calculatedAmount = monthlyFee * monthsCovered;
  const amount = manualAmount ? Number(manualAmount) : calculatedAmount;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualAmount(e.target.value);
  };

  const handleMonthsChange = (months: number) => {
    setMonthsCovered(months);
    setManualAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave?.({
      amount,
      monthsCovered,
      paymentDate: paymentDate || new Date().toISOString().split("T")[0],
      paymentMethod,
      documentNumber,
    });
    onClose?.();
  };

  const newPaidUntil = contract
    ? new Date(new Date(contract.paid_until_date).getTime() + monthsCovered * 30 * 24 * 60 * 60 * 1000)
    : null;

  return (
    <Dialog open={!!contract} onOpenChange={(open: boolean) => { if (!open) onClose?.(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Запиши плащане</DialogTitle>
          <DialogDescription>
            {contract ? `Клиент: <strong>{contract.client_name}</strong>` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label>Текуща валидност до</Label>
            <div className="text-sm text-muted-foreground">
              {contract ? new Date(contract.paid_until_date).toLocaleDateString("bg-BG") : "—"}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Оставащи месеци до края на договора</Label>
            <div className="text-sm text-muted-foreground">
              {contract
                ? Math.ceil(
                    (new Date(contract.end_date).getTime() -
                      new Date(contract.paid_until_date).getTime()) /
                      (30 * 24 * 60 * 60 * 1000)
                  )
                : "—"}
            </div>
          </div>
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
                value={amount || String(calculatedAmount)}
                onChange={handleAmountChange}
              />
              <span className="text-muted-foreground text-sm">EUR</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {monthsCovered} месец{monthsCovered === 1 ? "" : monthsCovered <= 4 ? "а" : "ца"} × {monthlyFee.toFixed(2)} EUR ={" "}
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose?.()}>
              Отказ
            </Button>
            <Button type="submit">Запиши плащане</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}