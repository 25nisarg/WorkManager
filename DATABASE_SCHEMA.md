# Freelance Manager - Existing Supabase Database Schema

IMPORTANT:

This database already exists in Supabase.

Application code MUST match this schema exactly.

Do NOT guess column names.

Do NOT rename database columns merely to match frontend naming.

Do NOT create migrations or alter tables unless explicitly instructed.

If application requirements appear incompatible with this schema, stop and report the mismatch before making database changes.

---

# Authentication

Supabase Auth:

auth.users

Business records belong to users through:

owner_id uuid references auth.users(id)

RLS is enabled.

Application code must derive owner_id from the authenticated user server-side.

Never accept owner_id from browser input.

---

# 1. profiles

Table:

public.profiles

Columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PRIMARY KEY, references auth.users(id) |
| full_name | text | nullable |
| business_name | text | nullable |
| phone | text | nullable |
| default_currency | varchar(3) | default INR |
| timezone | text | default Asia/Kolkata |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

---

# 2. contacts

Table:

public.contacts

Columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PRIMARY KEY |
| owner_id | uuid | required |
| name | text | required |
| company_name | text | nullable |
| phone | text | nullable |
| whatsapp | text | nullable |
| email | text | nullable |
| country | text | nullable |
| preferred_currency | varchar(3) | default INR |
| notes | text | nullable |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

IMPORTANT:

The contact display name column is:

name

---

# 3. contact_roles

Table:

public.contact_roles

Columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PRIMARY KEY |
| owner_id | uuid | required |
| contact_id | uuid | references contacts(id) |
| role | text | required |
| created_at | timestamptz | default now() |

Unique:

(contact_id, role)

Allowed role values:

- student
- vendor
- writer
- freelancer
- other

---

# 4. assignments

Table:

public.assignments

Columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PRIMARY KEY |
| owner_id | uuid | required |
| received_from_id | uuid | references contacts(id), nullable |
| task_code | text | generated automatically by PostgreSQL |
| title | text | required |
| subject | text | nullable |
| assessment_name | text | nullable |
| received_date | date | default current_date |
| client_deadline | timestamptz | nullable |
| number_of_copies | integer | default 1, must be > 0 |
| price_per_copy | numeric(12,2) | nullable, >= 0 |
| selling_price | numeric(12,2) | default 0, >= 0 |
| currency | varchar(3) | default INR |
| status | text | required |
| priority | text | required |
| work_mode | text | required |
| delivered_at | timestamptz | nullable |
| completed_at | timestamptz | nullable |
| description | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Unique:

(owner_id, task_code)

Task code is generated automatically.

Example:

TASK-2026-0001

Do NOT generate task_code in frontend/server application code.

Allowed assignment statuses:

- new
- assigned
- in_progress
- writer_delivered
- under_review
- ready_to_deliver
- delivered
- revision
- completed
- cancelled

Allowed priorities:

- low
- normal
- high
- urgent

Allowed work modes:

- self
- outsourced
- mixed

---

# 5. assignment_workers

Table:

public.assignment_workers

Columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PRIMARY KEY |
| owner_id | uuid | required |
| assignment_id | uuid | references assignments(id) |
| worker_id | uuid | references contacts(id) |
| work_description | text | nullable |
| assigned_date | date | default current_date |
| worker_deadline | timestamptz | nullable |
| agreed_cost | numeric(12,2) | default 0, >= 0 |
| currency | varchar(3) | default INR |
| status | text | required |
| delivered_at | timestamptz | nullable |
| notes | text | nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Allowed worker statuses:

- assigned
- in_progress
- delivered
- revision
- completed
- cancelled

---

# 6. client_payments

Table:

public.client_payments

IMPORTANT:

Use the exact names:

amount_original
currency_original

Do NOT use:

original_amount
original_currency

Columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PRIMARY KEY |
| owner_id | uuid | required |
| payer_id | uuid | references contacts(id), nullable |
| payment_date | date | default current_date |
| amount_original | numeric(12,2) | required, > 0 |
| currency_original | varchar(3) | default INR |
| exchange_rate | numeric(14,6) | nullable, > 0 |
| amount_inr | numeric(12,2) | required, > 0 |
| payment_method | text | nullable |
| transaction_reference | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | default now() |
| payment_account_id | uuid | references payment_accounts(id), nullable |

IMPORTANT:

`client_payments` stores the received-payment transaction header once.

It does NOT contain `assignment_id`.

A single client payment may cover one or many assignments through:

`public.client_payment_allocations`

Direct INSERT, UPDATE, and DELETE operations on received-payment headers or
their allocations are not permitted for authenticated application users.
Received-payment writes must use the payment transaction RPCs documented below.

---

# 6A. client_payment_allocations

Table:

public.client_payment_allocations

Columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PRIMARY KEY |
| owner_id | uuid | required, references auth.users(id) |
| client_payment_id | uuid | required, references client_payments(id), ON DELETE CASCADE |
| assignment_id | uuid | required, references assignments(id) |
| amount_original | numeric(12,2) | required, > 0 |
| amount_inr | numeric(12,2) | required, > 0 |
| created_at | timestamptz | default now() |

Unique:

(client_payment_id, assignment_id)

One `client_payments` transaction may have one or many assignment allocations.

Allocation rules:

- Every allocation must belong to the same authenticated owner as the payment.
- Every allocated assignment must belong to the authenticated owner.
- Every allocated assignment must have `received_from_id` equal to the payment's `payer_id`.
- Every allocated assignment's `currency` must equal the payment's `currency_original`.
- Cross-currency assignment allocation is not supported without an explicit conversion model.
- Allocation `amount_original` values must sum exactly to the payment header's `amount_original`.
- Allocation `amount_inr` values must sum exactly to the payment header's `amount_inr`.
- Allocation rows cannot be independently inserted, updated, or deleted by authenticated application users.

Received-payment RPCs:

`public.create_client_payment_transaction(p_payment jsonb, p_allocations jsonb)`

- Creates one payment header and all assignment allocations atomically.
- Derives `owner_id` from `auth.uid()`.

`public.update_client_payment_transaction(p_payment_id uuid, p_payment jsonb, p_allocations jsonb)`

- Updates the payment header and replaces its allocations atomically.
- Verifies the payment belongs to `auth.uid()`.

`public.delete_client_payment_transaction(p_payment_id uuid)`

- Deletes an owned payment transaction atomically.
- Allocation rows are removed through `ON DELETE CASCADE`.

All three RPCs validate payer ownership, optional payment-account ownership,
assignment ownership, payer matching, currency matching, duplicate assignments,
and allocation totals. Execution is granted only to authenticated users.

---

# 7. worker_payments

Table:

public.worker_payments

Columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PRIMARY KEY |
| owner_id | uuid | required |
| assignment_worker_id | uuid | references assignment_workers(id) |
| worker_id | uuid | references contacts(id) |
| payment_date | date | default current_date |
| amount | numeric(12,2) | required, > 0 |
| currency | varchar(3) | default INR |
| payment_method | text | nullable |
| transaction_reference | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | default now() |
| payment_account_id | uuid | references payment_accounts(id), nullable |

IMPORTANT:

worker_payments uses:

amount
currency

It does NOT use:

amount_original
currency_original
amount_inr

---

# 8. payment_accounts

Table:

public.payment_accounts

IMPORTANT:

The account name column is:

account_name

Do NOT query:

payment_accounts.name

Columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PRIMARY KEY |
| owner_id | uuid | required |
| account_name | text | required |
| account_type | text | required |
| currency | varchar(3) | default INR |
| notes | text | nullable |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Allowed account_type values:

- bank
- upi
- paypal
- wise
- cash
- wallet
- other

---

# 9. expenses

Table:

public.expenses

Columns:

| Column | Type | Notes |
|---|---|---|
| id | uuid | PRIMARY KEY |
| owner_id | uuid | required |
| assignment_id | uuid | references assignments(id), nullable |
| payment_account_id | uuid | references payment_accounts(id), nullable |
| category | text | required |
| description | text | required |
| amount | numeric(12,2) | required, > 0 |
| currency | varchar(3) | default INR |
| expense_date | date | default current_date |
| payment_method | text | nullable |
| transaction_reference | text | nullable |
| notes | text | nullable |
| created_at | timestamptz | default now() |

---

# DATABASE VIEWS

# 10. assignment_financial_summary

View:

public.assignment_financial_summary

Columns exposed:

- assignment_id
- owner_id
- task_code
- title
- status
- client_deadline
- selling_price
- client_received
- client_outstanding
- worker_cost
- worker_paid
- worker_payable
- other_expenses
- expected_gross_profit
- expected_net_profit
- current_cash_margin

Use this view for assignment-level financial summaries where appropriate.

Do not duplicate these calculations unnecessarily in TypeScript.

---

# 11. dashboard_summary

View:

public.dashboard_summary

Columns exposed:

- owner_id
- total_assignments
- active_assignments
- total_work_value
- total_received
- total_client_outstanding
- total_worker_cost
- total_worker_paid
- total_worker_payable
- total_expenses
- expected_net_profit
- current_cash_flow

Use this view for dashboard KPI values where appropriate.

---

# RELATIONSHIPS

auth.users
    |
    +-- profiles
    |
    +-- contacts
    |     |
    |     +-- contact_roles
    |
    +-- assignments
          |
          +-- received_from_id -> contacts
          |
          +-- assignment_workers
          |       |
          |       +-- worker_id -> contacts
          |       |
          |       +-- worker_payments
          |
          +-- client_payment_allocations
          |
          +-- expenses
    |
    +-- client_payments
          |
          +-- client_payment_allocations

payment_accounts
    |
    +-- client_payments
    +-- worker_payments
    +-- expenses

---

# FINANCIAL DEFINITIONS

Selling Price:

assignments.selling_price

Client Received:

SUM(client_payments.amount_inr)

Client Outstanding:

selling_price - client_received

Writer Cost:

SUM(assignment_workers.agreed_cost)

Writer Paid:

SUM(worker_payments.amount)

Writer Payable:

writer_cost - writer_paid

Expected Gross Profit:

selling_price - writer_cost

Expected Net Profit:

selling_price - writer_cost - assignment-specific expenses

Current Cash Margin:

client payments received
- worker payments paid
- assignment-specific expenses

---

# CRITICAL COLUMN NAME REFERENCE

Use this before writing Supabase queries.

Contacts:
- name

Payment Accounts:
- account_name

Client Payments:
- amount_original
- currency_original
- amount_inr

Worker Payments:
- amount
- currency

Assignments:
- selling_price
- price_per_copy
- number_of_copies

Assignment Workers:
- agreed_cost

Expenses:
- amount

---

# SECURITY

RLS is enabled on business tables.

Authenticated users have table privileges.

RLS restricts access using owner_id = auth.uid().

Do NOT:

- disable RLS
- use service_role from application code
- expose database secrets
- accept owner_id from the browser
- weaken policies to resolve coding bugs

If PostgreSQL returns an error, fix the application query first unless there is confirmed evidence that the schema itself is wrong.
