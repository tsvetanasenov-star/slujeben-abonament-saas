"use client";

import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Clock } from "lucide-react";
import { formatDateBG } from "@/components/shared/StatusBadge";

interface PaymentHistoryDrawerProps {
  contract?: { id: string; client_name: string };
  payments?: Array<{
    id: string;
    payment_date: string;
    amount: number;
    months_covered: number;
    payment_method: string;
    document_number?: string | null;
    created_at: string;
  }>;
  onClose?: () => void;
  onDeletePayment?: (id: string) => void;
}

export function PaymentHistoryDrawer({ contract, payments = [], onClose, onDeletePayment }: PaymentHistoryDrawerProps) {
  const [open, setOpen] = useState(false);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalMonths = payments.reduce((sum, p) => sum + p.months_covered, 0);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Clock className="mr-2 h-4 w-4" /> История
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>История на плащанията</DrawerTitle>
            <div className="text-sm text-muted-foreground">{contract?.client_name}</div>
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
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDateBG(p.payment_date)}</TableCell>
                      <TableCell className="text-right">{p.amount.toFixed(2)} EUR</TableCell>
                      <TableCell>{p.months_covered}</TableCell>
                      <TableCell>{p.payment_method}</TableCell>
                      <TableCell>{p.document_number || "—"}</TableCell>
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