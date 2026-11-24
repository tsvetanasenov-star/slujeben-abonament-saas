-- ============================================
-- Схема за управление на 12-месечни служебни абонаменти
-- ============================================

-- Включаване на UUID разширението (ако не е включено)
create extension if not exists "uuid-ossp";

-- ============================================
-- Таблица: contracts (Договори / Абонати)
-- ============================================
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  identifier text not null,
  contact_info text,
  contract_number text,
  start_date date not null,
  end_date date not null,
  monthly_fee numeric(10,2) not null,
  paid_until_date date not null,
  notes text,
  is_archived boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- Таблица: payments (Дневник на плащанията)
-- ============================================
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references contracts(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(10,2) not null,
  months_covered integer not null,
  payment_method text default 'Банков превод',
  document_number text,
  created_at timestamptz default now()
);

-- ============================================
-- Индекси за бързо търсене и филтриране
-- ============================================
create index if not exists idx_contracts_client_name on contracts(client_name);
create index if not exists idx_contracts_identifier on contracts(identifier);
create index if not exists idx_contracts_contract_number on contracts(contract_number);
create index if not exists idx_contracts_paid_until on contracts(paid_until_date);
create index if not exists idx_contracts_end_date on contracts(end_date);
create index if not exists idx_contracts_is_archived on contracts(is_archived);
create index if not exists idx_payments_contract_id on payments(contract_id);
create index if not exists idx_payments_payment_date on payments(payment_date);

-- ============================================
-- Тригърна функция: update_paid_until_on_payment()
-- ============================================
-- При INSERT: добавя months_covered към paid_until_date, но не надвишава end_date
-- При DELETE: преизчислява paid_until_date като start_date + сума от всички remaining months_covered
create or replace function update_paid_until_on_payment()
returns trigger as $$
declare
  v_contract_id uuid;
  v_start_date date;
  v_end_date date;
  v_paid_until date;
  v_total_months integer;
  v_new_paid_until date;
begin
  -- Определяме ID на договора
  if tg_op = 'INSERT' then
    v_contract_id := new.contract_id;
  elsif tg_op = 'DELETE' then
    v_contract_id := old.contract_id;
  end if;

  -- Вземаме данни за договора
  select start_date, end_date, paid_until_date
  into v_start_date, v_end_date, v_paid_until
  from contracts
  where id = v_contract_id;

  if tg_op = 'INSERT' then
    -- Изчисляваме новата paid_until_date
    v_new_paid_until := v_paid_until + (new.months_covered || ' months')::interval;

    -- Не позволяваме paid_until_date да надвишава end_date
    if v_new_paid_until > v_end_date then
      v_new_paid_until := v_end_date;
    end if;

    -- Актуализираме договора
    update contracts
    set paid_until_date = v_new_paid_until
    where id = v_contract_id;

    return new;
  elsif tg_op = 'DELETE' then
    -- Преизчисляваме paid_until_date назад: start_date + сума от всички remaining months_covered
    select coalesce(sum(months_covered), 0)
    into v_total_months
    from payments
    where contract_id = v_contract_id;

    v_new_paid_until := v_start_date + (v_total_months || ' months')::interval;

    -- Не позволяваме да надвишава end_date
    if v_new_paid_until > v_end_date then
      v_new_paid_until := v_end_date;
    end if;

    update contracts
    set paid_until_date = v_new_paid_until
    where id = v_contract_id;

    return old;
  end if;

  return null;
end;
$$ language plpgsql;

-- ============================================
-- Тригери
-- ============================================
drop trigger if exists trg_payment_insert on payments;
create trigger trg_payment_insert
  after insert on payments
  for each row
  execute function update_paid_until_on_payment();

drop trigger if exists trg_payment_delete on payments;
create trigger trg_payment_delete
  after delete on payments
  for each row
  execute function update_paid_until_on_payment();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
alter table contracts enable row level security;
alter table payments enable row level security;

-- Полиси за публичен достъп (за демо режим - може да се ограничат по-късно)
create policy "Allow all access to contracts" on contracts
  for all using (true) with check (true);

create policy "Allow all access to payments" on payments
  for all using (true) with check (true);