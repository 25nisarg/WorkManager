-- REVIEW ONLY: do not apply automatically.
-- Normalizes client payments into one transaction with one or more assignment allocations.
-- CURRENT LIMITATION: one payment transaction may allocate only to assignments
-- whose quoted currency equals the payment's currency_original. Cross-currency
-- allocation requires an explicit conversion model and is intentionally rejected.

-- PREFLIGHT 1: payment owner and assignment owner differ.
select
  cp.id as client_payment_id,
  cp.owner_id as payment_owner_id,
  a.owner_id as assignment_owner_id,
  cp.assignment_id
from public.client_payments cp
join public.assignments a on a.id = cp.assignment_id
where cp.owner_id <> a.owner_id;

-- PREFLIGHT 2: payer differs from the assignment's source/client.
select
  cp.id as client_payment_id,
  cp.payer_id,
  a.received_from_id,
  cp.assignment_id
from public.client_payments cp
join public.assignments a on a.id = cp.assignment_id
where cp.payer_id is distinct from a.received_from_id;

-- PREFLIGHT 3: payment original currency differs from assignment currency.
select
  cp.id as client_payment_id,
  cp.currency_original,
  a.currency as assignment_currency,
  cp.assignment_id
from public.client_payments cp
join public.assignments a on a.id = cp.assignment_id
where cp.currency_original is distinct from a.currency;

-- PREFLIGHT 4: payer contact is not owned by the payment owner.
select
  cp.id as client_payment_id,
  cp.owner_id as payment_owner_id,
  cp.payer_id,
  c.owner_id as payer_owner_id
from public.client_payments cp
left join public.contacts c on c.id = cp.payer_id
where c.id is null or c.owner_id <> cp.owner_id;

-- PREFLIGHT 5: supplied payment account is not owned by the payment owner.
select
  cp.id as client_payment_id,
  cp.owner_id as payment_owner_id,
  cp.payment_account_id,
  pa.owner_id as payment_account_owner_id
from public.client_payments cp
left join public.payment_accounts pa on pa.id = cp.payment_account_id
where cp.payment_account_id is not null
  and (pa.id is null or pa.owner_id <> cp.owner_id);

begin;

-- Abort without changing inconsistent legacy rows. Review and correct any rows
-- returned by the preflight queries before applying this migration.
do $$
begin
  if exists (
    select 1
    from public.client_payments cp
    join public.assignments a on a.id = cp.assignment_id
    where cp.owner_id <> a.owner_id
      or cp.payer_id is distinct from a.received_from_id
      or cp.currency_original is distinct from a.currency
      or not exists (
        select 1 from public.contacts c
        where c.id = cp.payer_id and c.owner_id = cp.owner_id
      )
      or (
        cp.payment_account_id is not null
        and not exists (
          select 1 from public.payment_accounts pa
          where pa.id = cp.payment_account_id and pa.owner_id = cp.owner_id
        )
      )
  ) then
    raise exception 'Client payment preflight failed; review inconsistent legacy rows before migration.'
      using errcode = '23514';
  end if;
end;
$$;

create table public.client_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  client_payment_id uuid not null references public.client_payments(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id),
  amount_original numeric(12,2) not null check (amount_original > 0),
  amount_inr numeric(12,2) not null check (amount_inr > 0),
  created_at timestamptz not null default now(),
  unique (client_payment_id, assignment_id)
);

create index client_payment_allocations_owner_id_idx on public.client_payment_allocations(owner_id);
create index client_payment_allocations_assignment_id_idx on public.client_payment_allocations(assignment_id);
create index client_payment_allocations_payment_id_idx on public.client_payment_allocations(client_payment_id);

insert into public.client_payment_allocations (
  owner_id, client_payment_id, assignment_id, amount_original, amount_inr, created_at
)
select owner_id, id, assignment_id, amount_original, amount_inr, created_at
from public.client_payments;

drop view if exists public.dashboard_summary;
drop view if exists public.assignment_financial_summary;

alter table public.client_payments drop column assignment_id;

alter table public.client_payment_allocations enable row level security;

create policy "Users can view their client payment allocations"
on public.client_payment_allocations for select to authenticated
using (owner_id = auth.uid());

-- Authenticated callers may read their rows through RLS, but cannot mutate
-- either half of a normalized payment independently. All writes use the RPCs.
revoke all privileges on table public.client_payment_allocations from authenticated, anon, public;
revoke all privileges on table public.client_payments from authenticated, anon, public;
grant select on public.client_payment_allocations to authenticated;
grant select on public.client_payments to authenticated;

create function public.create_client_payment_transaction(
  p_payment jsonb,
  p_allocations jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
  v_payment_id uuid;
  v_original_total numeric(12,2);
  v_inr_total numeric(12,2);
begin
  if v_owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(p_allocations) <> 'array' or jsonb_array_length(p_allocations) = 0 then raise exception 'At least one allocation is required' using errcode = '22023'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_allocations) allocation
    group by allocation->>'assignment_id'
    having count(*) > 1
  ) then raise exception 'Each assignment may be allocated only once' using errcode = '23505'; end if;
  if not exists (
    select 1 from public.contacts c
    where c.id = (p_payment->>'payer_id')::uuid and c.owner_id = v_owner_id
  ) then raise exception 'Payer does not belong to the authenticated user' using errcode = '42501'; end if;
  if nullif(p_payment->>'payment_account_id', '') is not null and not exists (
    select 1 from public.payment_accounts pa
    where pa.id = (p_payment->>'payment_account_id')::uuid and pa.owner_id = v_owner_id
  ) then raise exception 'Payment account does not belong to the authenticated user' using errcode = '42501'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_allocations) allocation
    where not exists (
      select 1 from public.assignments a
      where a.id = (allocation->>'assignment_id')::uuid
        and a.owner_id = v_owner_id
        and a.received_from_id = (p_payment->>'payer_id')::uuid
        and a.currency = p_payment->>'currency_original'
    )
  ) then raise exception 'Every allocation must belong to the payer and payment currency' using errcode = '42501'; end if;

  select sum((value->>'amount_original')::numeric), sum((value->>'amount_inr')::numeric)
  into v_original_total, v_inr_total from jsonb_array_elements(p_allocations);
  if round(v_original_total, 2) <> round((p_payment->>'amount_original')::numeric, 2)
    or round(v_inr_total, 2) <> round((p_payment->>'amount_inr')::numeric, 2)
  then raise exception 'Allocation totals must equal payment totals' using errcode = '23514'; end if;

  insert into public.client_payments (
    owner_id, payer_id, payment_date, amount_original, currency_original,
    exchange_rate, amount_inr, payment_method, payment_account_id,
    transaction_reference, notes
  ) values (
    v_owner_id, (p_payment->>'payer_id')::uuid, (p_payment->>'payment_date')::date,
    (p_payment->>'amount_original')::numeric, p_payment->>'currency_original',
    nullif(p_payment->>'exchange_rate', '')::numeric,
    (p_payment->>'amount_inr')::numeric, p_payment->>'payment_method',
    nullif(p_payment->>'payment_account_id', '')::uuid,
    nullif(p_payment->>'transaction_reference', ''), nullif(p_payment->>'notes', '')
  ) returning id into v_payment_id;

  insert into public.client_payment_allocations (
    owner_id, client_payment_id, assignment_id, amount_original, amount_inr
  )
  select v_owner_id, v_payment_id, (value->>'assignment_id')::uuid,
    (value->>'amount_original')::numeric, (value->>'amount_inr')::numeric
  from jsonb_array_elements(p_allocations);

  return v_payment_id;
end;
$$;

create function public.update_client_payment_transaction(
  p_payment_id uuid,
  p_payment jsonb,
  p_allocations jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
  v_original_total numeric(12,2);
  v_inr_total numeric(12,2);
begin
  if v_owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not exists (select 1 from public.client_payments where id = p_payment_id and owner_id = v_owner_id) then raise exception 'Payment not found' using errcode = '42501'; end if;
  if jsonb_typeof(p_allocations) <> 'array' or jsonb_array_length(p_allocations) = 0 then raise exception 'At least one allocation is required' using errcode = '22023'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_allocations) allocation
    group by allocation->>'assignment_id'
    having count(*) > 1
  ) then raise exception 'Each assignment may be allocated only once' using errcode = '23505'; end if;
  if not exists (
    select 1 from public.contacts c
    where c.id = (p_payment->>'payer_id')::uuid and c.owner_id = v_owner_id
  ) then raise exception 'Payer does not belong to the authenticated user' using errcode = '42501'; end if;
  if nullif(p_payment->>'payment_account_id', '') is not null and not exists (
    select 1 from public.payment_accounts pa
    where pa.id = (p_payment->>'payment_account_id')::uuid and pa.owner_id = v_owner_id
  ) then raise exception 'Payment account does not belong to the authenticated user' using errcode = '42501'; end if;
  if exists (
    select 1
    from jsonb_array_elements(p_allocations) allocation
    where not exists (
      select 1 from public.assignments a
      where a.id = (allocation->>'assignment_id')::uuid
        and a.owner_id = v_owner_id
        and a.received_from_id = (p_payment->>'payer_id')::uuid
        and a.currency = p_payment->>'currency_original'
    )
  ) then raise exception 'Every allocation must belong to the payer and payment currency' using errcode = '42501'; end if;

  select sum((value->>'amount_original')::numeric), sum((value->>'amount_inr')::numeric)
  into v_original_total, v_inr_total from jsonb_array_elements(p_allocations);
  if round(v_original_total, 2) <> round((p_payment->>'amount_original')::numeric, 2)
    or round(v_inr_total, 2) <> round((p_payment->>'amount_inr')::numeric, 2)
  then raise exception 'Allocation totals must equal payment totals' using errcode = '23514'; end if;

  update public.client_payments set
    payer_id = (p_payment->>'payer_id')::uuid,
    payment_date = (p_payment->>'payment_date')::date,
    amount_original = (p_payment->>'amount_original')::numeric,
    currency_original = p_payment->>'currency_original',
    exchange_rate = nullif(p_payment->>'exchange_rate', '')::numeric,
    amount_inr = (p_payment->>'amount_inr')::numeric,
    payment_method = p_payment->>'payment_method',
    payment_account_id = nullif(p_payment->>'payment_account_id', '')::uuid,
    transaction_reference = nullif(p_payment->>'transaction_reference', ''),
    notes = nullif(p_payment->>'notes', '')
  where id = p_payment_id and owner_id = v_owner_id;

  delete from public.client_payment_allocations
  where client_payment_id = p_payment_id and owner_id = v_owner_id;

  insert into public.client_payment_allocations (
    owner_id, client_payment_id, assignment_id, amount_original, amount_inr
  )
  select v_owner_id, p_payment_id, (value->>'assignment_id')::uuid,
    (value->>'amount_original')::numeric, (value->>'amount_inr')::numeric
  from jsonb_array_elements(p_allocations);
end;
$$;

create function public.delete_client_payment_transaction(
  p_payment_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.client_payments cp
    where cp.id = p_payment_id and cp.owner_id = v_owner_id
  ) then
    raise exception 'Payment not found' using errcode = '42501';
  end if;

  delete from public.client_payments
  where id = p_payment_id and owner_id = v_owner_id;
  -- client_payment_allocations are removed atomically by ON DELETE CASCADE.
end;
$$;

revoke execute on function public.create_client_payment_transaction(jsonb, jsonb) from public;
revoke execute on function public.update_client_payment_transaction(uuid, jsonb, jsonb) from public;
revoke execute on function public.delete_client_payment_transaction(uuid) from public;
grant execute on function public.create_client_payment_transaction(jsonb, jsonb) to authenticated;
grant execute on function public.update_client_payment_transaction(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.delete_client_payment_transaction(uuid) to authenticated;

create view public.assignment_financial_summary
with (security_invoker = true)
as
with client_totals as (
  select
    cpa.owner_id,
    cpa.assignment_id,
    sum(cpa.amount_inr) as actual_inr_received,
    sum(cpa.amount_original) filter (where cp.currency_original = a.currency) as original_paid_in_assignment_currency,
    count(*) filter (where cp.currency_original <> a.currency) as unmatched_client_payment_count
  from public.client_payment_allocations cpa
  join public.client_payments cp on cp.id = cpa.client_payment_id and cp.owner_id = cpa.owner_id
  join public.assignments a on a.id = cpa.assignment_id and a.owner_id = cpa.owner_id
  group by cpa.owner_id, cpa.assignment_id
), worker_cost_totals as (
  select aw.owner_id, aw.assignment_id,
    count(*) filter (where aw.status <> 'cancelled') as writer_allocation_count,
    sum(aw.agreed_cost) filter (where aw.status <> 'cancelled' and aw.currency = 'INR') as writer_agreed_cost_inr,
    count(*) filter (where aw.status <> 'cancelled' and aw.currency <> 'INR') as non_inr_writer_cost_count
  from public.assignment_workers aw group by aw.owner_id, aw.assignment_id
), worker_payment_totals as (
  select wp.owner_id, aw.assignment_id,
    sum(wp.amount) filter (where wp.currency = 'INR') as writer_paid_inr,
    count(*) filter (where wp.currency <> 'INR') as non_inr_writer_payment_count
  from public.worker_payments wp
  join public.assignment_workers aw on aw.id = wp.assignment_worker_id and aw.owner_id = wp.owner_id
  group by wp.owner_id, aw.assignment_id
), expense_totals as (
  select e.owner_id, e.assignment_id,
    sum(e.amount) filter (where e.currency = 'INR') as assignment_expenses_inr,
    count(*) filter (where e.currency <> 'INR') as non_inr_expense_count
  from public.expenses e where e.assignment_id is not null group by e.owner_id, e.assignment_id
)
select
  a.id as assignment_id, a.owner_id, a.task_code, a.title, a.status, a.work_mode,
  a.client_deadline, a.selling_price as quoted_price, a.currency as quoted_currency,
  coalesce(ct.original_paid_in_assignment_currency, 0) as original_paid_in_assignment_currency,
  greatest(a.selling_price - coalesce(ct.original_paid_in_assignment_currency, 0), 0) as client_outstanding_in_assignment_currency,
  coalesce(ct.actual_inr_received, 0) as actual_inr_received,
  coalesce(wct.writer_agreed_cost_inr, 0) as writer_agreed_cost_inr,
  coalesce(wpt.writer_paid_inr, 0) as writer_paid_inr,
  greatest(coalesce(wct.writer_agreed_cost_inr, 0) - coalesce(wpt.writer_paid_inr, 0), 0) as writer_payable_inr,
  coalesce(et.assignment_expenses_inr, 0) as assignment_expenses_inr,
  case
    when coalesce(ct.actual_inr_received, 0) = 0 then 'awaiting_payment'
    when a.work_mode in ('outsourced', 'mixed') and coalesce(wct.writer_allocation_count, 0) = 0 then 'writer_not_assigned'
    when a.work_mode in ('outsourced', 'mixed') and coalesce(wct.non_inr_writer_cost_count, 0) > 0 then 'non_inr_writer_cost'
    when coalesce(et.non_inr_expense_count, 0) > 0 then 'non_inr_expense'
    else 'available'
  end as profit_status,
  case
    when coalesce(ct.actual_inr_received, 0) = 0 then null
    when a.work_mode in ('outsourced', 'mixed') and coalesce(wct.writer_allocation_count, 0) = 0 then null
    when a.work_mode in ('outsourced', 'mixed') and coalesce(wct.non_inr_writer_cost_count, 0) > 0 then null
    when coalesce(et.non_inr_expense_count, 0) > 0 then null
    else coalesce(ct.actual_inr_received, 0)
      - case when a.work_mode = 'self' then 0 else coalesce(wct.writer_agreed_cost_inr, 0) end
      - coalesce(et.assignment_expenses_inr, 0)
  end as actual_profit_inr,
  case when coalesce(wpt.non_inr_writer_payment_count, 0) > 0 or coalesce(et.non_inr_expense_count, 0) > 0 then null
    else coalesce(ct.actual_inr_received, 0) - coalesce(wpt.writer_paid_inr, 0) - coalesce(et.assignment_expenses_inr, 0)
  end as current_cash_position_inr,
  coalesce(ct.unmatched_client_payment_count, 0) as unmatched_client_payment_count,
  coalesce(wct.non_inr_writer_cost_count, 0) as non_inr_writer_cost_count,
  coalesce(wpt.non_inr_writer_payment_count, 0) as non_inr_writer_payment_count,
  coalesce(et.non_inr_expense_count, 0) as non_inr_expense_count
from public.assignments a
left join client_totals ct on ct.assignment_id = a.id and ct.owner_id = a.owner_id
left join worker_cost_totals wct on wct.assignment_id = a.id and wct.owner_id = a.owner_id
left join worker_payment_totals wpt on wpt.assignment_id = a.id and wpt.owner_id = a.owner_id
left join expense_totals et on et.assignment_id = a.id and et.owner_id = a.owner_id;

create view public.dashboard_summary
with (security_invoker = true)
as
with owners as (select id as owner_id from public.profiles),
quoted as (
  select owner_id, jsonb_object_agg(currency, total order by currency) as quoted_totals_by_currency
  from (select owner_id, currency, sum(selling_price) as total from public.assignments where status <> 'cancelled' group by owner_id, currency) grouped
  group by owner_id
), assignment_rollup as (
  select owner_id, count(*) as total_assignments,
    count(*) filter (where status = 'new') as active_assignments,
    sum(actual_inr_received) as actual_inr_received,
    sum(writer_agreed_cost_inr) as writer_agreed_cost_inr,
    sum(writer_paid_inr) as writer_paid_inr,
    sum(writer_payable_inr) as writer_payable_inr,
    sum(assignment_expenses_inr) as assignment_expenses_inr,
    sum(actual_profit_inr) filter (where profit_status = 'available') as assignment_actual_profit_inr,
    count(*) filter (where profit_status = 'available') as profit_available_assignment_count,
    count(*) filter (where profit_status = 'awaiting_payment') as awaiting_payment_assignment_count,
    count(*) filter (where profit_status = 'writer_not_assigned') as writer_not_assigned_assignment_count,
    count(*) filter (where profit_status = 'non_inr_writer_cost') as non_inr_writer_cost_assignment_count,
    count(*) filter (where profit_status = 'non_inr_expense') as non_inr_expense_assignment_count,
    count(*) filter (where profit_status in ('writer_not_assigned','non_inr_writer_cost','non_inr_expense')) as profit_unavailable_assignment_count,
    sum(unmatched_client_payment_count) as unmatched_client_payment_count
  from public.assignment_financial_summary group by owner_id
), general_expenses as (
  select owner_id, coalesce(sum(amount) filter (where currency = 'INR'), 0) as general_expenses_inr,
    count(*) filter (where currency <> 'INR') as non_inr_general_expense_count
  from public.expenses where assignment_id is null group by owner_id
), cash_out as (
  select o.owner_id,
    coalesce((select sum(wp.amount) from public.worker_payments wp where wp.owner_id = o.owner_id and wp.currency = 'INR'), 0) as writer_paid_inr,
    coalesce((select count(*) from public.worker_payments wp where wp.owner_id = o.owner_id and wp.currency <> 'INR'), 0)
      + coalesce((select count(*) from public.expenses e where e.owner_id = o.owner_id and e.currency <> 'INR'), 0) as non_inr_cash_out_count,
    coalesce((select sum(e.amount) from public.expenses e where e.owner_id = o.owner_id and e.currency = 'INR'), 0) as total_expenses_inr
  from owners o
)
select o.owner_id,
  coalesce(ar.total_assignments, 0) as total_assignments,
  coalesce(ar.active_assignments, 0) as active_assignments,
  coalesce(q.quoted_totals_by_currency, '{}'::jsonb) as quoted_totals_by_currency,
  coalesce(ar.actual_inr_received, 0) as actual_inr_received,
  coalesce(ar.writer_agreed_cost_inr, 0) as writer_agreed_cost_inr,
  coalesce(ar.writer_paid_inr, 0) as writer_paid_inr,
  coalesce(ar.writer_payable_inr, 0) as writer_payable_inr,
  coalesce(co.total_expenses_inr, 0) as total_expenses_inr,
  case when coalesce(ar.profit_unavailable_assignment_count, 0) > 0 or coalesce(ge.non_inr_general_expense_count, 0) > 0 then null
    else coalesce(ar.assignment_actual_profit_inr, 0) - coalesce(ge.general_expenses_inr, 0) end as actual_profit_inr,
  case when coalesce(co.non_inr_cash_out_count, 0) > 0 then null
    else coalesce(ar.actual_inr_received, 0) - coalesce(co.writer_paid_inr, 0) - coalesce(co.total_expenses_inr, 0) end as current_cash_position_inr,
  coalesce(ar.profit_unavailable_assignment_count, 0) as profit_unavailable_assignment_count,
  coalesce(ar.profit_available_assignment_count, 0) as profit_available_assignment_count,
  coalesce(ar.awaiting_payment_assignment_count, 0) as awaiting_payment_assignment_count,
  coalesce(ar.writer_not_assigned_assignment_count, 0) as writer_not_assigned_assignment_count,
  coalesce(ar.non_inr_writer_cost_assignment_count, 0) as non_inr_writer_cost_assignment_count,
  coalesce(ar.non_inr_expense_assignment_count, 0) as non_inr_expense_assignment_count,
  coalesce(ar.unmatched_client_payment_count, 0) as unmatched_client_payment_count,
  coalesce(co.non_inr_cash_out_count, 0) as non_inr_cash_out_count
from owners o
left join quoted q on q.owner_id = o.owner_id
left join assignment_rollup ar on ar.owner_id = o.owner_id
left join general_expenses ge on ge.owner_id = o.owner_id
left join cash_out co on co.owner_id = o.owner_id;

grant select on public.assignment_financial_summary to authenticated;
grant select on public.dashboard_summary to authenticated;

commit;
