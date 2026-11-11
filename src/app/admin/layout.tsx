import { requireRole, STAFF_ROLES } from "@/server/session";
import { AdminShell } from "@/components/admin/shell";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Admin", template: "%s · Admin Vira Renda" } };

export default async function Layout({ children }: { children: React.ReactNode }) {
  const u = await requireRole(STAFF_ROLES);
  return <AdminShell role={u.role} name={u.name}>{children}</AdminShell>;
}
