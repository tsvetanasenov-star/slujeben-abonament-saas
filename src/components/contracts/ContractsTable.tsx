"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Contract } from "@/types/database";
import { formatContractDisplay } from "@/lib/contracts";
import { Plus, Euro, Clock, RefreshCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { startOfDay } from "@/lib/useToday";

interface ContractsTableProps {
  contracts: Contract[];
  onRecordPayment: (contract: Contract) => void;
  onViewHistory: (contract: Contract) => void;
  onRenew: (contract: Contract) => void;
  onNewContract: () => void;
  today: Date;
}

export function ContractsTable({
  contracts,
  onRecordPayment,
  onViewHistory,
  onRenew,
  onNewContract,
  today,
}: ContractsTableProps) {
  const [openRenew, setOpenRenew] = useState<Contract | null>(null);

  const todayStart = startOfDay(today);

  const sortedContracts = [...contracts].sort((a, b) => {
    const aPaid = a.paid_until_date ? new Date(a.paid_until_date) : new Date(a.start_date || new Date().toISOString().split("T")[0]);
    aPaid.setHours(0, 0, 0, 0);
    const bPaid = b.paid_until_date ? new Date(b.paid_until_date) : new Date(b.start_date || new Date().toISOString().split("T")[0]);
    bPaid.setHours(0, 0, 0, 0);
    const aOverdue = aPaid < todayStart;
    const bOverdue = bPaid < todayStart;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    const aEnd = new Date(a.end_date);
    const bEnd = new Date(b.end_date);
    return aEnd.getTime() - bEnd.getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Договори</h2>
        <Button onClick={onNewContract} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Нов договор
        </Button>
      </div>

      <div className="rounded-xl border border-input">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[26%]">Клиент / Обект</TableHead>
              <TableHead className="w-[20%]">Срок на договора</TableHead>
              <TableHead className="w-[12%]">Месечна такса</TableHead>
              <TableHead className="w-[14%]">Платени до</TableHead>
              <TableHead className="w-[16%]">Статус на плащане</TableHead>
              <TableHead className="w-[22%] text-right">Бързи действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContracts.map((contract) => {
              const display = formatContractDisplay(contract, today);
              const isExpiring = display.contractStatus.days !== undefined && display.contractStatus.days <= 30 && display.contractStatus.days >= 0;
              return (
                <TableRow key={contract.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="font-medium">
                    <div>{contract.client_name}</div>
                    <div className="text-sm text-muted-foreground">{contract.identifier}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{display.startDateFormatted} – {display.endDateFormatted}</div>
                    {isExpiring && (
                      <Badge variant="warning" className="mt-1 h-7 px-2 text-xs">
                        Изтича за {display.contractStatus.days} дни
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {display.monthlyFeeFormatted}
                  </TableCell>
                  <TableCell className="text-right">
                    {display.paidUntilFormatted}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        display.paymentStatus.color === "red"
                          ? "error"
                          : display.paymentStatus.color === "yellow"
                            ? "warning"
                            : display.paymentStatus.color === "diamond"
                              ? "info"
                              : "success"
                      }
                    >
                      {display.paymentStatus.icon} {display.paymentStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRecordPayment(contract)}
                        className="h-8 px-2"
                      >
                        <Euro className="h-3 w-3 mr-1" />
                        Плащане
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewHistory(contract)}
                        className="h-8 px-2"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        История
                      </Button>
                      {isExpiring && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setOpenRenew(contract)}
                          className="h-8 px-2"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Подновяване
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {openRenew && (
        <Dialog open onOpenChange={() => setOpenRenew(null)}>
          <DialogContent>
            <h3 className="text-lg font-semibold mb-2">Подновяване на договор</h3>
            <p className="text-sm text-muted-foreground mb-4">
              К новият договор ще се приложат данни от изчакващия.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Клиент</label>
                <p className="text-muted-foreground">{openRenew.client_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Обект / Рег. номер</label>
                <p className="text-muted-foreground">{openRenew.identifier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Нова начална дата</label>
                <input type="date" defaultValue={todayStart.toISOString().split("T")[0]} className="w-full border rounded px-2 py-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={() => setOpenRenew(null)} variant="outline">
                Отказ
              </Button>
              <Button onClick={() => { onRenew(openRenew); setOpenRenew(null); }}>Създай подновен договор</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}


    </div>
  );
}