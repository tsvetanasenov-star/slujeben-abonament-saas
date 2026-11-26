"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDateBG } from "@/components/shared/StatusBadge";

interface PaymentHistoryDrawerProps {
  contract?: { id: string; client_name: string };
  payments?: Array<{
    id: string;
    payment_date?: string;
    amount?: number;
    months_covered?: number;
    payment_method?: string;
    document_number?: string | null;
    created_at?: string;
  }>;
  onClose?: () => void;
  onDeletePayment?: (id: string) => void;
}

export function PaymentHistoryDrawer({
  contract,
  payments = [],
  onClose,
  onDeletePayment,
}: PaymentHistoryDrawerProps) {
  const safeAmount = (p: any) => Number(p.amount ?? p.amount_covered ?? 0);
  const safeMonths = (p: any) => Number(p.months_covered ?? p.months ?? 0);
  const safeDate = (p: any) => p.payment_date ?? p.date ?? "";
  const safeMethod = (p: any) => p.payment_method ?? p.method ?? "";
  const safeDocument = (p: any) => p.document_number ?? p.document ?? "—";

  const totalPaid = payments.reduce((sum, p) => sum + safeAmount(p), 0);
  const totalMonths = payments.reduce((sum, p) => sum + safeMonths(p), 0);
  const handleBack = () => onClose?.();

  return (
    <>
      <Drawer open={!!contract} onOpenChange={(open) => { if (!open) onClose?.(); }}>
        <DrawerContent>
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>История на плащанията</DrawerTitle>
            <div className="text-sm text-muted-foreground">{contract?.client_name}</div>
            <Button variant="outline" size="sm" onClick={handleBack}>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Назад
            </Button>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Общо платени</div>
                <div className="font-medium">{totalPaid.toFixed(2)} EUR</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Месеци покрити</div>
                <div className="font-medium">{totalMonths}</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Брой плащания</div>
                <div className="font-medium">{payments.length}</div>
              </div>
            </div>
            <div className="rounded-xl border border-input">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Сума</TableHead>
                    <TableHead>Месеца</TableHead>
                    <TableHead>Метод</TableHead>
                    <TableHead>Документ</TableHead>
                    <TableHead className="w-20">Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Няма записани плащания за този договор
                    </div>
                  )}
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDateBG(safeDate(p))}</TableCell>
                      <TableCell className="text-right">{safeAmount(p).toFixed(2)} EUR</TableCell>
                      <TableCell>{safeMonths(p)}</TableCell>
                      <TableCell>{safeMethod(p)}</TableCell>
                      <TableCell>{safeDocument(p)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeletePayment?.(p.id)}
                          className="h-7 p-1"
                          disabled={!onDeletePayment}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}