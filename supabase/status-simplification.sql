-- REVIEW ONLY: do not apply automatically.
-- Collapses legacy assignment and writer-allocation workflow statuses.

-- Preflight: review any unexpected assignment statuses before applying.
select status, count(*) as row_count
from public.assignments
where status not in (
  'new', 'assigned', 'in_progress', 'writer_delivered', 'under_review',
  'ready_to_deliver', 'delivered', 'revision', 'completed', 'cancelled'
)
group by status
order by status;

-- Preflight: review any unexpected writer-allocation statuses before applying.
select status, count(*) as row_count
from public.assignment_workers
where status not in (
  'assigned', 'in_progress', 'delivered', 'revision', 'completed', 'cancelled'
)
group by status
order by status;

begin;

update public.assignments
set status = case
  when status = 'completed' then 'delivered'
  when status in (
    'assigned', 'in_progress', 'writer_delivered', 'under_review',
    'ready_to_deliver', 'revision'
  ) then 'new'
  else status
end
where status in (
  'assigned', 'in_progress', 'writer_delivered', 'under_review',
  'ready_to_deliver', 'revision', 'completed'
);

update public.assignment_workers
set status = case
  when status = 'completed' then 'delivered'
  when status in ('in_progress', 'revision') then 'assigned'
  else status
end
where status in ('in_progress', 'revision', 'completed');

-- Drop only CHECK constraints that directly depend on each status column.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select constraint_record.conname
    from pg_constraint constraint_record
    join pg_attribute attribute_record
      on attribute_record.attrelid = constraint_record.conrelid
      and attribute_record.attname = 'status'
    where constraint_record.conrelid = 'public.assignments'::regclass
      and constraint_record.contype = 'c'
      and attribute_record.attnum = any (constraint_record.conkey)
  loop
    execute format(
      'alter table public.assignments drop constraint %I',
      constraint_row.conname
    );
  end loop;

  for constraint_row in
    select constraint_record.conname
    from pg_constraint constraint_record
    join pg_attribute attribute_record
      on attribute_record.attrelid = constraint_record.conrelid
      and attribute_record.attname = 'status'
    where constraint_record.conrelid = 'public.assignment_workers'::regclass
      and constraint_record.contype = 'c'
      and attribute_record.attnum = any (constraint_record.conkey)
  loop
    execute format(
      'alter table public.assignment_workers drop constraint %I',
      constraint_row.conname
    );
  end loop;
end;
$$;

alter table public.assignments
  add constraint assignments_status_check
  check (status in ('new', 'delivered', 'cancelled'));

alter table public.assignment_workers
  add constraint assignment_workers_status_check
  check (status in ('assigned', 'delivered', 'cancelled'));

commit;
