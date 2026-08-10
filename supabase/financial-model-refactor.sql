-- REVIEW ONLY: do not apply automatically.
-- Replaces the legacy single-currency financial views with currency-aware views.
-- Existing tables and columns are unchanged.

begin;

drop view if exists public.dashboard_summary;
drop view if exists public.assignment_financial_summary;

create view public.assignment_financial_summary
with (security_invoker = true)
as
with client_totals as (
  select
    cp.owner_id,
    cp.assignment_id,
    sum(cp.amount_inr) as actual_inr_received,
    sum(cp.amount_original) filter (where cp.currency_original = a.currency) as original_paid_in_assignment_currency,
    count(*) filter (where cp.currency_original <> a.currency) as unmatched_client_payment_count
  from public.client_payments cp
  join public.assignments a on a.id = cp.assignment_id and a.owner_id = cp.owner_id
  group by cp.owner_id, cp.assignment_id
), worker_cost_totals as (
  select
    aw.owner_id,
    aw.assignment_id,
    count(*) filter (where aw.status <> 'cancelled') as writer_allocation_count,
    sum(aw.agreed_cost) filter (where aw.status <> 'cancelled' and aw.currency = 'INR') as writer_agreed_cost_inr,
    count(*) filter (where aw.status <> 'cancelled' and aw.currency <> 'INR') as non_inr_writer_cost_count
  from public.assignment_workers aw
  group by aw.owner_id, aw.assignment_id
), worker_payment_totals as (
  select
    wp.owner_id,
    aw.assignment_id,
    sum(wp.amount) filter (where wp.currency = 'INR') as writer_paid_inr,
    count(*) filter (where wp.currency <> 'INR') as non_inr_writer_payment_count
  from public.worker_payments wp
  join public.assignment_workers aw on aw.id = wp.assignment_worker_id and aw.owner_id = wp.owner_id
  group by wp.owner_id, aw.assignment_id
), expense_totals as (
  select
    e.owner_id,
    e.assignment_id,
    sum(e.amount) filter (where e.currency = 'INR') as assignment_expenses_inr,
    count(*) filter (where e.currency <> 'INR') as non_inr_expense_count
  from public.expenses e
  where e.assignment_id is not null
  group by e.owner_id, e.assignment_id
)
select
  a.id as assignment_id,
  a.owner_id,
  a.task_code,
  a.title,
  a.status,
  a.work_mode,
  a.client_deadline,
  a.selling_price as quoted_price,
  a.currency as quoted_currency,
  coalesce(ct.original_paid_in_assignment_currency, 0) as original_paid_in_assignment_currency,
  greatest(
    a.selling_price - coalesce(ct.original_paid_in_assignment_currency, 0),
    0
  ) as client_outstanding_in_assignment_currency,
  coalesce(ct.actual_inr_received, 0) as actual_inr_received,
  coalesce(wct.writer_agreed_cost_inr, 0) as writer_agreed_cost_inr,
  coalesce(wpt.writer_paid_inr, 0) as writer_paid_inr,
  greatest(
    coalesce(wct.writer_agreed_cost_inr, 0) - coalesce(wpt.writer_paid_inr, 0),
    0
  ) as writer_payable_inr,
  coalesce(et.assignment_expenses_inr, 0) as assignment_expenses_inr,
  case
    when coalesce(ct.actual_inr_received, 0) = 0 then 'awaiting_payment'
    when a.work_mode in ('outsourced', 'mixed')
      and coalesce(wct.writer_allocation_count, 0) = 0 then 'writer_not_assigned'
    when a.work_mode in ('outsourced', 'mixed')
      and coalesce(wct.non_inr_writer_cost_count, 0) > 0 then 'non_inr_writer_cost'
    when coalesce(et.non_inr_expense_count, 0) > 0 then 'non_inr_expense'
    else 'available'
  end as profit_status,
  case
    when coalesce(ct.actual_inr_received, 0) = 0 then null
    when a.work_mode in ('outsourced', 'mixed')
      and coalesce(wct.writer_allocation_count, 0) = 0 then null
    when a.work_mode in ('outsourced', 'mixed')
      and coalesce(wct.non_inr_writer_cost_count, 0) > 0 then null
    when coalesce(et.non_inr_expense_count, 0) > 0 then null
    else coalesce(ct.actual_inr_received, 0)
      - case when a.work_mode = 'self' then 0 else coalesce(wct.writer_agreed_cost_inr, 0) end
      - coalesce(et.assignment_expenses_inr, 0)
  end as actual_profit_inr,
  case
    when coalesce(wpt.non_inr_writer_payment_count, 0) > 0 or coalesce(et.non_inr_expense_count, 0) > 0 then null
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
with owners as (
  select id as owner_id from public.profiles
), quoted as (
  select owner_id, jsonb_object_agg(currency, total order by currency) as quoted_totals_by_currency
  from (
    select owner_id, currency, sum(selling_price) as total
    from public.assignments
    where status <> 'cancelled'
    group by owner_id, currency
  ) grouped
  group by owner_id
), assignment_rollup as (
  select
    owner_id,
    count(*) as total_assignments,
    count(*) filter (where status in ('new','assigned','in_progress','writer_delivered','under_review','ready_to_deliver','revision')) as active_assignments,
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
    count(*) filter (
      where profit_status in ('writer_not_assigned', 'non_inr_writer_cost', 'non_inr_expense')
    ) as profit_unavailable_assignment_count,
    sum(unmatched_client_payment_count) as unmatched_client_payment_count
  from public.assignment_financial_summary
  group by owner_id
), general_expenses as (
  select owner_id,
    coalesce(sum(amount) filter (where currency = 'INR'), 0) as general_expenses_inr,
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
select
  o.owner_id,
  coalesce(ar.total_assignments, 0) as total_assignments,
  coalesce(ar.active_assignments, 0) as active_assignments,
  coalesce(q.quoted_totals_by_currency, '{}'::jsonb) as quoted_totals_by_currency,
  coalesce(ar.actual_inr_received, 0) as actual_inr_received,
  coalesce(ar.writer_agreed_cost_inr, 0) as writer_agreed_cost_inr,
  coalesce(ar.writer_paid_inr, 0) as writer_paid_inr,
  coalesce(ar.writer_payable_inr, 0) as writer_payable_inr,
  coalesce(co.total_expenses_inr, 0) as total_expenses_inr,
  case
    when coalesce(ar.profit_unavailable_assignment_count, 0) > 0
      or coalesce(ge.non_inr_general_expense_count, 0) > 0 then null
    else coalesce(ar.assignment_actual_profit_inr, 0) - coalesce(ge.general_expenses_inr, 0)
  end as actual_profit_inr,
  case when coalesce(co.non_inr_cash_out_count, 0) > 0 then null
    else coalesce(ar.actual_inr_received, 0) - coalesce(co.writer_paid_inr, 0) - coalesce(co.total_expenses_inr, 0)
  end as current_cash_position_inr,
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
