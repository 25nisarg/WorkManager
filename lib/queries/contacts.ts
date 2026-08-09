import { createClient } from "@/lib/supabase/server";
import type { Contact, ContactRole } from "@/types/contact";

type ContactRow = Omit<Contact, "roles">;

type ContactRoleRow = {
  contact_id: string;
  role: ContactRole;
};

export type ContactFilters = {
  search?: string;
  role?: string;
  status?: string;
};

export type ContactQueryResult<T> = {
  data: T;
  error?: string;
};

const contactColumns =
  "id, owner_id, name, company_name, email, phone, whatsapp, country, preferred_currency, notes, is_active, created_at, updated_at";

function attachRoles(contacts: ContactRow[], roleRows: ContactRoleRow[]) {
  const rolesByContact = new Map<string, ContactRole[]>();

  for (const row of roleRows) {
    const roles = rolesByContact.get(row.contact_id) ?? [];
    roles.push(row.role);
    rolesByContact.set(row.contact_id, roles);
  }

  return contacts.map((contact) => ({
    ...contact,
    roles: rolesByContact.get(contact.id) ?? [],
  }));
}

export async function getContacts(
  ownerId: string,
  filters: ContactFilters = {}
): Promise<ContactQueryResult<Contact[]>> {
  const supabase = await createClient();

  const [contactsResult, rolesResult] = await Promise.all([
    supabase
      .from("contacts")
      .select(contactColumns)
      .eq("owner_id", ownerId)
      .order("name", { ascending: true }),
    supabase
      .from("contact_roles")
      .select("contact_id, role")
      .eq("owner_id", ownerId),
  ]);

  if (contactsResult.error || rolesResult.error) {
    return {
      data: [],
      error: "We could not load your contacts. Please refresh and try again.",
    };
  }

  let contacts = attachRoles(
    (contactsResult.data ?? []) as ContactRow[],
    (rolesResult.data ?? []) as ContactRoleRow[]
  );

  const search = filters.search?.trim().toLocaleLowerCase();
  if (search) {
    contacts = contacts.filter((contact) =>
      [contact.name, contact.company_name, contact.email].some((value) =>
        value?.toLocaleLowerCase().includes(search)
      )
    );
  }

  if (filters.role) {
    contacts = contacts.filter((contact) =>
      contact.roles.includes(filters.role as ContactRole)
    );
  }

  if (filters.status === "active") {
    contacts = contacts.filter((contact) => contact.is_active);
  } else if (filters.status === "inactive") {
    contacts = contacts.filter((contact) => !contact.is_active);
  }

  return { data: contacts };
}

export async function getContact(
  ownerId: string,
  contactId: string
): Promise<ContactQueryResult<Contact | null>> {
  const supabase = await createClient();

  const [contactResult, rolesResult] = await Promise.all([
    supabase
      .from("contacts")
      .select(contactColumns)
      .eq("owner_id", ownerId)
      .eq("id", contactId)
      .maybeSingle(),
    supabase
      .from("contact_roles")
      .select("contact_id, role")
      .eq("owner_id", ownerId)
      .eq("contact_id", contactId),
  ]);

  if (contactResult.error || rolesResult.error) {
    return {
      data: null,
      error: "We could not load this contact. Please try again.",
    };
  }

  if (!contactResult.data) {
    return { data: null };
  }

  const [contact] = attachRoles(
    [contactResult.data as ContactRow],
    (rolesResult.data ?? []) as ContactRoleRow[]
  );

  return { data: contact };
}
