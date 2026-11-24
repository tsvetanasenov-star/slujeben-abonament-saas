"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export interface NewContractPayload {
  client_name: string;
  identifier: string;
  contact_info: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  monthly_fee: number;
  notes: string;
  payNow: boolean;
  monthsCovered: number;
}

interface NewContractDialogProps {
  onOpenChange: (open: boolean) => void;
  open?: boolean;
  onCreate?: (payload: NewContractPayload) => void | Promise<void>;
}

export function NewContractDialog({ onOpenChange, open: openProp, onCreate }: NewContractDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange(value);
  };
  const [formData, setFormData] = useState({
    client_name: "",
    identifier: "",
    contact_info: "",
    contract_number: "",
    start_date: "",
    monthly_fee: "",
    notes: "",
    payNow: false,
    monthsCovered: 1,
  });
  const [endDate, setEndDate] = useState("");

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, start_date: val });
    if (val) {
      const d = new Date(val);
      d.setMonth(d.getMonth() + 12);
      setEndDate(d.toISOString().split("T")[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate?.({
      client_name: formData.client_name,
      identifier: formData.identifier,
      contact_info: formData.contact_info,
      contract_number: formData.contract_number,
      start_date: formData.start_date,
      end_date: endDate,
      monthly_fee: Number(formData.monthly_fee),
      notes: formData.notes,
      payNow: formData.payNow,
      monthsCovered: formData.monthsCovered,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Нов договор
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Нов абонаментен договор</DialogTitle>
          <DialogDescription>
            Въведете данните за клиента и абонамента.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Име на клиента / фирма</Label>
              <Input
                placeholder="Напр. ООО 'Транс логист'"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Рег. номер / обект / идентификатор</Label>
              <Input
                placeholder="Напр. СА 1234 АВ"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Телефон / имейл</Label>
              <Input
                placeholder="+359 888 123 456"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Номер на договора</Label>
              <Input
                placeholder="Напр. Д-2025-001"
                value={formData.contract_number}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Начална дата</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={handleStartDateChange}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Месечна такса</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monthly_fee}
                  onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                  required
                />
                <span className="text-muted-foreground text-sm">EUR</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Крайна дата (автоматично +12 месеца)</Label>
            <Input
              type="date"
              value={endDate}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="payNow"
                checked={formData.payNow}
                onChange={(e) =>
                  setFormData({ ...formData, payNow: e.target.checked })
                }
              />
              <Label htmlFor="payNow" className="text-sm">
                Клиентът плаща при сключване на договора
              </Label>
            </div>
            {formData.payNow && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Месеца:</label>
                  <select
                    value={formData.monthsCovered}
                    onChange={(e) =>
                      setFormData({ ...formData, monthsCovered: parseInt(e.target.value) })
                    }
                    className="text-sm border rounded px-2 py-1 bg-background"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {m} месец{m === 1 ? "" : m <= 4 ? "а" : "ца"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Сума за първи плащане:</span>
                  <span className="font-medium">
                    {formData.monthly_fee
                      ? parseFloat(formData.monthly_fee) * formData.monthsCovered
                      : 0} EUR
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>Бележки</Label>
            <Input
              placeholder="Допълнителна информация..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отказ
            </Button>
            <Button type="submit">Запиши договор</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}