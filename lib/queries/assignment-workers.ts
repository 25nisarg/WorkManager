import { createClient } from "@/lib/supabase/server";
import type {
  AssignmentWorker,
  EligibleWriter,
} from "@/types/assignment-worker";
import { normalizeAssignmentWorkerStatus } from "@/lib/utils/status";

type AssignmentWorkerRow = Omit<AssignmentWorker, "worker" | "status"> & {
  status: string;
};

type WriterRoleRow = {
  contact_id: string;
  role: "writer" | "freelancer";
};

type WriterContactRow = Omit<EligibleWriter, "roles">;

export type AssignmentWorkerQueryResult<T> = {
  data: T;
  error?: string;
};

export type AssignmentWorkerData = {
  allocations: AssignmentWorker[];
  eligibleWriters: EligibleWriter[];
};

const allocationColumns =
  "id, owner_id, assignment_id, worker_id, work_description, assigned_date, worker_deadline, agreed_cost, currency, status, delivered_at, notes, created_at, updated_at";

const writerColumns = "id, name, company_name, is_active";

function buildEligibleWriters(
  contacts: WriterContactRow[],
  roleRows: WriterRoleRow[]
) {
  const rolesByContact = new Map<
    string,
    Array<"writer" | "freelancer">
  >();

  for (const row of roleRows) {
    const roles = rolesByContact.get(row.contact_id) ?? [];
    if (!roles.includes(row.role)) roles.push(row.role);
    rolesByContact.set(row.contact_id, roles);
  }

  return contacts
    .filter((contact) => rolesByContact.has(contact.id))
    .map((contact) => ({
      ...contact,
      roles: rolesByContact.get(contact.id) ?? [],
    }));
}

export async function getEligibleWriters(
  ownerId: string
): Promise<AssignmentWorkerQueryResult<EligibleWriter[]>> {
  const supabase = await createClient();
  const [contactsResult, rolesResult] = await Promise.all([
    supabase
      .from("contacts")
      .select(writerColumns)
      .eq("owner_id", ownerId)
      .order("name", { ascending: true }),
    supabase
      .from("contact_roles")
      .select("contact_id, role")
      .eq("owner_id", ownerId)
      .in("role", ["writer", "freelancer"]),
  ]);

  if (contactsResult.error || rolesResult.error) {
    return {
      data: [],
      error: "We could not load eligible writers. Please try again.",
    };
  }

  return {
    data: buildEligibleWriters(
      (contactsResult.data ?? []) as WriterContactRow[],
      (rolesResult.data ?? []) as WriterRoleRow[]
    ),
  };
}

export async function getAssignmentWorkers(
  ownerId: string,
  assignmentId: string
): Promise<AssignmentWorkerQueryResult<AssignmentWorkerData>> {
  const supabase = await createClient();
  const [allocationsResult, writersResult] = await Promise.all([
    supabase
      .from("assignment_workers")
      .select(allocationColumns)
      .eq("owner_id", ownerId)
      .eq("assignment_id", assignmentId)
      .order("worker_deadline", { ascending: true }),
    getEligibleWriters(ownerId),
  ]);

  if (allocationsResult.error) {
    console.error("[assignment workers query failed]", {
      assignmentId,
      errorCode: allocationsResult.error.code,
      errorMessage: allocationsResult.error.message,
    });
    return {
      data: { allocations: [], eligibleWriters: [] },
      error: "We could not load writer allocations. Please try again.",
    };
  }

  if (writersResult.error) {
    return {
      data: { allocations: [], eligibleWriters: [] },
      error: writersResult.error,
    };
  }

  const writersById = new Map(
    writersResult.data.map((writer) => [writer.id, writer])
  );

  return {
    data: {
      allocations: ((allocationsResult.data ?? []) as AssignmentWorkerRow[]).map(
        (allocation) => ({
          ...allocation,
          agreed_cost: Number(allocation.agreed_cost),
          status: normalizeAssignmentWorkerStatus(allocation.status),
          worker: writersById.get(allocation.worker_id) ?? null,
        })
      ),
      eligibleWriters: writersResult.data,
    },
  };
}
