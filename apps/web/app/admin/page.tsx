import { requireSession } from "@/lib/auth/require-role";

export const metadata = { title: "Tổng quan" };

export default async function AdminDashboardPlaceholder() {
  const session = await requireSession();
  return (
    <section className="space-y-4">
      <h1 className="font-serif text-3xl">Chào, {session.user.email}</h1>
      <p className="text-ink-muted">
        Dashboard tổng quan sẽ hoàn thiện ở phase 07.
      </p>
      <div className="rounded-lg border border-border p-4">
        <h2 className="font-medium">Trạng thái phase 02</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-ink-muted">
          <li>NextAuth credentials provider hoạt động.</li>
          <li>Middleware bảo vệ /admin/*.</li>
          <li>RBAC: ADMIN/EDITOR — sidebar lọc theo role.</li>
        </ul>
      </div>
    </section>
  );
}
