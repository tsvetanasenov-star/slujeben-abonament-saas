export type ContractStatus = "overdue" | "upcoming" | "regular" | "fully_paid" | "expired" | "expiring_soon" | "active";
export type ButtonVariants = "default" | "destructive" | "outline" | "secondary" | "ghost";

export interface Contract {
  id: string;
  client_name: string;
  identifier: string;
  contact_info?: string | null;
  contract_number?: string | null;
  start_date: string;
  end_date: string;
  monthly_fee: number;
  paid_until_date: string;
  notes?: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  contract_id: string;
  payment_date: string;
  amount: number;
  months_covered: number;
  payment_method: string;
  document_number?: string | null;
  created_at: string;
}

export interface ContractWithPayments extends Contract {
  payments?: Payment[];
}

export interface PaymentStatusInfo {
  label: string;
  color: "red" | "yellow" | "green" | "diamond";
  days?: number;
  icon: string;
}

export interface ContractStatusInfo {
  label: string;
  color: "red" | "orange" | "green";
  days?: number;
}

export interface KPICard {
  title: string;
  value: number;
  subtitle?: string;
  color: "blue" | "red" | "yellow" | "orange";
  icon: string;
}