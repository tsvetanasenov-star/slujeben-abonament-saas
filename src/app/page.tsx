"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractsTable } from "@/components/contracts/ContractsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToday, startOfDay } from "@/lib/useToday";
import { createClient } from "@/lib/supabase";
import type { Contract } from "@/types/database";
import { Search, Plus, AlertTriangle, Clock, CalendarCheck, FileCheck2 } from "lucide-react";
import { NewContractDialog } from "@/components/contracts/NewContractDialog";
import { RecordPaymentDialog } from "@/components/contracts/RecordPaymentDialog";
import { PaymentHistoryDrawer } from "@/components/contracts/PaymentHistoryDrawer";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type FilterTab = "all" | "overdue" | "upcoming" | "expiring" | "archived";

export default function HomePage() {
  const today = useToday();
  const supabase = useMemo(() => createClient(), []);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [newContractOpen, setNewContractOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentContract, setPaymentContract] = useState<Contract | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyContract, setHistoryContract] = useState<{ id: string; client_name: string } | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data, error } = await supabase
          .from("contracts")
          .select("*")
          .order("created_at", { ascending: false });

        if (!active) return;
        if (error) {
          setErrorMsg(error.message || "Грешка при зареждане от Supabase.");
          setContracts([]);
        } else {
          setContracts((data as Contract[]) || []);
        }
      } catch (err) {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : "Неочаквана грешка при зареждане.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [supabase]);

  const baseDate = useMemo(() => {
    return today ? startOfDay(today) : null;
  }, [today]);

  const filteredContracts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contracts.filter((c) => {
      const matchesQuery =
        !q ||
        (c.client_name && c.client_name.toLowerCase().includes(q)) ||
        (c.identifier && c.identifier.toLowerCase().includes(q)) ||
        (c.contract_number && c.contract_number.toLowerCase().includes(q));

      if (!matchesQuery) return false;
      if (activeTab === "all") return true;
      if (!baseDate) return true;

      const paidUntil = c.paid_until_date ? startOfDay(new Date(c.paid_until_date)) : null;
      const endDate = c.end_date ? startOfDay(new Date(c.end_date)) : null;
      const diffDaysToEnd = endDate
        ? Math.ceil((endDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const diffDaysToPaid = paidUntil
        ? Math.ceil((paidUntil.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      if (activeTab === "overdue") {
        return paidUntil !== null && paidUntil < baseDate;
      }
      if (activeTab === "upcoming") {
        return diffDaysToPaid !== null && diffDaysToPaid >= 0 && diffDaysToPaid <= 15;
      }
      if (activeTab === "expiring") {
        return diffDaysToEnd !== null && diffDaysToEnd >= 0 && diffDaysToEnd <= 30;
      }
      if (activeTab === "archived") {
        return diffDaysToEnd !== null && diffDaysToEnd < 0;
      }
      return true;
    });
  }, [contracts, searchQuery, activeTab, baseDate]);

  const kpis = useMemo(() => {
    const activeCount = contracts.length;
    const monthlyTotal = contracts.reduce((sum, c) => sum + Number(c.monthly_fee || 0), 0);

    if (!baseDate) {
      return {
        activeCount,
        monthlyTotal,
        overdueCount: 0,
        overdueAmount: 0,
        upcomingCount: 0,
        expiringCount: 0,
      };
    }

    let overdueCount = 0;
    let overdueAmount = 0;
    let upcomingCount = 0;
    let expiringCount = 0;

    for (const c of contracts) {
      const fee = Number(c.monthly_fee || 0);
      if (c.paid_until_date) {
        const paidUntil = startOfDay(new Date(c.paid_until_date));
        const diffPaid = Math.ceil((paidUntil.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        if (paidUntil < baseDate) {
          overdueCount += 1;
          overdueAmount += fee;
        } else if (diffPaid <= 15) {
          upcomingCount += 1;
        }
      }
      if (c.end_date) {
        const endDate = startOfDay(new Date(c.end_date));
        const diffEnd = Math.ceil((endDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffEnd >= 0 && diffEnd <= 30) {
          expiringCount += 1;
        }
      }
    }

    return {
      activeCount,
      monthlyTotal,
      overdueCount,
      overdueAmount,
      upcomingCount,
      expiringCount,
    };
  }, [contracts, baseDate]);

  const handleNewContract = async () => {
    setNewContractOpen(true);
  };

  const handleRecordPayment = async (contract: Contract) => {
    setPaymentContract(contract);
    setPaymentOpen(true);
  };

  const handleViewHistory = (contract: Contract) => {
    setHistoryContract({ id: contract.id, client_name: contract.client_name });
    setHistoryOpen(true);
  };

  const handleCreateContract = async (payload: any) => {
    try {
      const monthlyFee = Number(payload.monthly_fee);
      if (!monthlyFee || monthlyFee <= 0) {
        setErrorMsg("Месечната такса трябва да е по-голяма от 0.");
        return;
      }

      const { data, error } = await supabase.from("contracts").insert({
        client_name: payload.client_name,
        identifier: payload.identifier,
        contact_info: payload.contact_info || null,
        contract_number: payload.contract_number || null,
        start_date: payload.start_date,
        end_date: payload.end_date,
        monthly_fee: monthlyFee,
        notes: payload.notes || null,
        is_archived: false,
        paid_until_date: payload.start_date,
      });

      if (error) {
        setErrorMsg(error.message || "Грешка при създаване на договора");
      } else {
        setNewContractOpen(false);
        // Ако е отбележит "Клиентът плаща при сключване на договора", създай начално плащане
        const inserted = (data as unknown as any[])?.[0];
        if (payload.payNow && payload.monthsCovered && inserted?.id) {
          const initialPaidUntil = new Date(payload.start_date);
          initialPaidUntil.setMonth(initialPaidUntil.getMonth() + payload.monthsCovered);
          const initialAmount = monthlyFee * payload.monthsCovered;

          const { error: payError } = await supabase.from("payments").insert({
            contract_id: inserted.id,
            payment_date: payload.start_date,
            amount: initialAmount,
            months_covered: payload.monthsCovered,
            payment_method: "Банков превод",
            document_number: "Инициално",
          });

          if (payError) {
            setErrorMsg(payError.message || "Грешка при записване наначалното плащане");
            return;
          }

          const { error: updateError } = await supabase
            .from("contracts")
            .update({ paid_until_date: initialPaidUntil.toISOString().split("T")[0] })
            .eq("id", inserted.id);

          if (updateError) {
            setErrorMsg(updateError.message || "Грешка при обновяване на валидността");
            return;
          }
        }

        const { data: refreshed, error: reloadError } = await supabase
          .from("contracts")
          .select("*")
          .order("created_at", { ascending: false });
        if (!reloadError && refreshed) {
          setContracts(refreshed);
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Неочаквана грешка");
    }
  };

  const handleSavePayment = async (payment: any) => {
    try {
      if (!payment.contract_id) {
        setErrorMsg("Грешка: не е избран договор за записване на плащане.");
        return;
      }

      const feeToUpdate = payment.expectedMonthlyFee || 0;

      const { error: payError } = await supabase.from("payments").insert({
        contract_id: payment.contract_id,
        payment_date: payment.paymentDate,
        amount: payment.amount,
        months_covered: payment.monthsCovered,
        payment_method: payment.paymentMethod,
        document_number: payment.documentNumber || null,
      });

      if (payError) {
        setErrorMsg(payError.message || "Грешка при записване на плащането");
        return;
      }

      // Ако е подадена очаквана месечна такса, актуализираме договора
      if (feeToUpdate > 0 && payment.contract_id) {
        const { error: feeError } = await supabase
          .from("contracts")
          .update({ monthly_fee: feeToUpdate })
          .eq("id", payment.contract_id);
        if (feeError) {
          setErrorMsg(feeError.message || "Грешка при обновяване на месечната такса");
          return;
        }
      }

      let contractData = payment.contract;
      if (!contractData) {
        const found = contracts.find((c) => c.id === payment.contract_id);
        if (!found) {
          setErrorMsg("Грешка: договорът не е намерен при записване на плащане.");
          return;
        }
        contractData = found as any;
      }
      const newPaidUntil = new Date(contractData.paid_until_date || contractData.start_date || new Date().toISOString().split("T")[0]);
      newPaidUntil.setMonth(newPaidUntil.getMonth() + payment.monthsCovered);

      const { error: updateError } = await supabase
        .from("contracts")
        .update({ paid_until_date: newPaidUntil.toISOString().split("T")[0] })
        .eq("id", payment.contract_id);

      if (updateError) {
        setErrorMsg(updateError.message || "Грешка при обновяване на договора");
      } else {
        setPaymentOpen(false);
        setPaymentContract(null);
        const { data: refreshed, error: reloadError } = await supabase
          .from("contracts")
          .select("*")
          .order("created_at", { ascending: false });
        if (!reloadError && refreshed) {
          setContracts(refreshed);
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Неочаквана грешка");
    }
  };

  const handleHistoryClose = () => {
    setHistoryOpen(false);
    setHistoryContract(null);
  };
const handleDeleteContract = async (contractId: string, clientName: string) => {
    const confirmed = window.confirm(
      `Сигурни ли сте, че искате да изтриете договора за ${clientName}?

Действието ще:
1. Изтрие всички плащания, свързани с този договор
2. Изтрие самия договор

Това действие е необратимо.`
    );

    if (!confirmed) return;

    try {
      // първо изтриваме плащанията за този договор
      const { error: payError } = await supabase
        .from("payments")
        .delete()
        .eq("contract_id", contractId);

      if (payError) {
        setErrorMsg("Грешка при изтриване на плащанията: " + payError.message);
        return;
      }

      // затем изтриваме самия договор
      const { error: contractError } = await supabase
        .from("contracts")
        .delete()
        .eq("id", contractId);

      if (contractError) {
        setErrorMsg("Грешка при изтриване на договора: " + contractError.message);
        return;
      }

      // обновяваме локалния state и презареждаме данните
      const { data: refreshed, error: reloadError } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!reloadError && refreshed) {
        setContracts(refreshed);
      }

      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Неочаквана грешка при изтриване");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Управление на абонаменти
            </h1>
            <p className="text-sm text-slate-600">
              12-месечни служебни договори и проследяване на плащания
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Търсене: клиент, рег. номер или договор"
                className="pl-9 bg-white"
              />
            </div>
            <Button type="button" onClick={() => setNewContractOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Нов договор
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Неуспешно зареждане на данните: {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-100 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">
                Общо активни договори
              </CardTitle>
              <FileCheck2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-950">{kpis.activeCount}</div>
              <p className="text-xs text-blue-700 mt-1">
                {kpis.monthlyTotal.toFixed(2)} € месечен приход
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-100 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-900">
                Просрочени плащания
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-950">{kpis.overdueCount}</div>
              <p className="text-xs text-red-700 mt-1">
                {kpis.overdueAmount.toFixed(2)} € просрочени
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-amber-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">
                Предстоящи до 15 дни
              </CardTitle>
              <CalendarCheck className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-950">{kpis.upcomingCount}</div>
              <p className="text-xs text-amber-700 mt-1">Плащане до 15 дни</p>
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">
                Изтичащи договори до 30 дни
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-950">{kpis.expiringCount}</div>
              <p className="text-xs text-orange-700 mt-1">12-месечни договори</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
          <TabsList className="grid w-full grid-cols-5 bg-white border">
            <TabsTrigger value="all">Всички активни</TabsTrigger>
            <TabsTrigger value="overdue">Просрочени</TabsTrigger>
            <TabsTrigger value="upcoming">Предстоящи</TabsTrigger>
            <TabsTrigger value="expiring">Изтичащи договори</TabsTrigger>
            <TabsTrigger value="archived">Архив</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            Зареждане на договорите...
          </div>
        ) : (
          <ContractsTable
            contracts={filteredContracts}
            onRecordPayment={(contract) => handleRecordPayment(contract)}
            onViewHistory={(contract) => handleViewHistory(contract)}
            onRenew={() => {}}
            onNewContract={() => handleNewContract()}
onDelete={handleDeleteContract}
            today={today ?? baseDate ?? new Date(2026, 0, 1)}
          />
        )}
      </div>

      {/* New Contract Dialog */}
      <NewContractDialog
        onOpenChange={setNewContractOpen}
        open={newContractOpen}
        onCreate={handleCreateContract}
      />

      {/* Payment Dialog */}
      <RecordPaymentDialog
        contract={paymentContract ?? undefined}
        onClose={() => {
          setPaymentOpen(false);
          setPaymentContract(null);
        }}
        onSave={(payment) => handleSavePayment(payment)}
      />

      {/* History Drawer */}
      <PaymentHistoryDrawer
        contract={historyContract ?? undefined}
        onClose={handleHistoryClose}
      />
    </main>
  );
} 