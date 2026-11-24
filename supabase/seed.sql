-- ============================================
-- Seed данни за тестване на светофарната система
-- ============================================

-- Изчистваме съществуващите данни (опционално, за чист старт)
-- truncate payments cascade;
-- truncate contracts cascade;

-- ============================================
-- 10 Реалистични примерни договора
-- ============================================

-- 1. ООО "Транс логист" — платени 12 месеца напред, completamente платени
insert into contracts (
  client_name, identifier, contact_info, contract_number,
  start_date, end_date, monthly_fee, paid_until_date, notes, is_archived
) values (
  'ООО "Транс логист"',
  'СА 1234 АВ',
  '+359 888 123 456',
  'Д-2024-001',
  '2025-01-01',
  '2025-12-31',
  150.00,
  '2025-12-31',
  'Платени 12 месеца напред',
  false
);

-- 2. ИВ "Автосервиз" — платени 3 месеца, редовен
insert into contracts (
  client_name, identifier, contact_info, contract_number,
  start_date, end_date, monthly_fee, paid_until_date, notes, is_archived
) values (
  'ИВ "Автосервиз"',
  'ВН 5678 БВ',
  '+359 889 234 567',
  'Д-2024-002',
  '2025-03-01',
  '2026-02-28',
  80.00,
  '2025-05-31',
  'Платени първите 3 месеца',
  false
);

-- 3. ООО "Спед Директ" — просрочен с 5 дни
insert into contracts (
  client_name, identifier, contact_info, contract_number,
  start_date, end_date, monthly_fee, paid_until_date, notes, is_archived
) values (
  'ООО "Спед Директ"',
  'Е 9012 СВ',
  '+359 899 345 678',
  'Д-2024-003',
  '2024-10-01',
  '2025-09-30',
  200.00,
  (current_date - interval '5 days')::date,
  'Просрочен платеж',
  false
);

-- 4. ЧП "Георги Петров" — просрочен с 12 дни
insert into contracts (
  client_name, identifier, contact_info, contract_number,
  start_date, end_date, monthly_fee, paid_until_date, notes, is_archived
) values (
  'ЧП "Георги Петров"',
  'СС 3456 ДВ',
  '+359 887 456 789',
  'Д-2024-004',
  '2024-09-01',
  '2025-08-31',
  120.00,
  (current_date - interval '12 days')::date,
  'Двуmeseчен закъснено плащане',
  false
);

-- 5. ООО "Тур veliko" — плащане предстои за 7 дни (жълт)
insert into contracts (
  client_name, identifier, contact_info, contract_number,
  start_date, end_date, monthly_fee, paid_until_date, notes, is_archived
) values (
  'ООО "Тур veliko"',
  'АА 7890 ЕВ',
  '+359 886 567 890',
  'Д-2024-005',
  '2025-06-01',
  '2026-05-31',
  90.00,
  (current_date + interval '7 days')::date,
  'Изтича за 7 дни',
  false
);

-- 6. ООО "Инженеринг ЕООД" — плащане предстои за 12 дни (жълт)
insert into contracts (
  client_name, identifier, contact_info, contract_number,
  start_date, end_date, monthly_fee, paid_until_date, notes, is_archived
) values (
  'ООО "Инженеринг ЕООД"',
  'ВВ 1111 ФВ',
  '+359 885 678 901',
  'Д-2024-006',
  '2025-04-01',
  '2026-03-31',
  300.00,
  (current_date + interval '12 days')::date,
  'Предстоящо плащане',
  false
);

-- 7. ООО "Автопарк Север" — редовен, платен за 20 дни напред
insert into contracts (
  client_name, identifier, contact_info, contract_number,
  start_date, end_date, monthly_fee, paid_until_date, notes, is_archived
) values (
  'ООО "Автопарк Север"',
  'ТТ 2222 ГВ',
  '+359 884 789 012',
  'Д-2024-007',
  '2025-05-01',
  '2026-04-30',
  60.00,
  (current_date + interval '20 days')::date,
  'Редовен платеж',
  false
);

-- 8. ООО "Логистика 2000" — платени 12 месеца, договор изтича за 25 дни
insert into contracts (
  client_name, identifier, contact_info, contract_number,
  start_date, end_date, monthly_fee, paid_until_date, notes, is_archived
) values (
  'ООО "Логистика 2000"',
  'ХХ 3333 НВ',
  '+359 883 890 123',
  'Д-2024-008',
  '2024-12-01',
  '2025-11-30',
  180.00,
  '2025-11-30',
  'Платени всички 12 месеца, договор изтича скоро',
  false
);

-- 9. ООО "Строителна механизация" — редовен, договор изтича за 15 дни
insert into contracts (
  client_name, identifier, contact_info, contract_number,
  start_date, end_date, monthly_fee, paid_until_date, notes, is_archived
) values (
  'ООО "Строителна механизация"',
  'УУ 4444 МВ',
  '+359 882 901 234',
  'Д-2024-009',
  '2025-01-01',
  '2025-12-31',
  250.00,
  '2025-11-30',
  'Редовен, изтича за 15 дни',
  false
);

-- 10. ООО "Куриерски услуги" — изтекъл договор (архивиран)
insert into contracts (
  client_name, identifier, contact_info, contract_number,
  start_date, end_date, monthly_fee, paid_until_date, notes, is_archived
) values (
  'ООО "Куриерски услуги"',
  'КК 5555 ПВ',
  '+359 881 012 345',
  'Д-2024-010',
  '2024-01-01',
  '2024-12-31',
  110.00,
  '2024-12-31',
  'Изтекъл договор, архивиран',
  true
);

-- ============================================
-- Плащания за някои договори (за демонстрация на тригъра)
-- ============================================

-- Плащания за договор 2 (ИВ "Автосервиз") — 3 месеца
insert into payments (contract_id, payment_date, amount, months_covered, payment_method, document_number)
select id, '2025-03-01', 240.00, 3, 'Банков превод', 'Ф-2025-001'
from contracts where contract_number = 'Д-2024-002';

-- Плащания за договор 3 (ООО "Спед Директ") — просрочен
insert into payments (contract_id, payment_date, amount, months_covered, payment_method, document_number)
select id, '2025-09-01', 200.00, 1, 'ПОС терминал', 'Ф-2025-002'
from contracts where contract_number = 'Д-2024-003';

-- Плащания за договор 5 (ООО "Тур veliko") — предстоящо
insert into payments (contract_id, payment_date, amount, months_covered, payment_method, document_number)
select id, '2025-06-01', 90.00, 1, 'В брой', 'Квитанция-001'
from contracts where contract_number = 'Д-2024-005';

-- ============================================
-- Край на seed данните
-- ============================================