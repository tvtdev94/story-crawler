import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Đăng nhập admin" };

async function loginAction(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (err) {
    if ((err as { type?: string }).type === "CredentialsSignin") {
      redirect("/admin/login?error=invalid");
    }
    throw err;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/admin");
  const sp = await searchParams;

  return (
    <main className="container flex min-h-screen items-center justify-center py-16">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-paper p-6 shadow-sm dark:bg-paper-dark">
        <header>
          <h1 className="font-serif text-2xl">Trạm Truyện · Admin</h1>
          <p className="mt-1 text-sm text-ink-muted">Đăng nhập để vào CMS.</p>
        </header>
        <form action={loginAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@tramtuyen.local"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              minLength={8}
            />
          </div>
          {sp.error === "invalid" && (
            <p role="alert" className="text-sm text-red-600">
              Email hoặc mật khẩu không đúng.
            </p>
          )}
          <Button type="submit" className="w-full">
            Đăng nhập
          </Button>
        </form>
      </div>
    </main>
  );
}
