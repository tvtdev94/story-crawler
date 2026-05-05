import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthorForm({
  action,
  initial,
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: { name?: string; slug?: string | null; bio?: string | null };
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên tác giả</Label>
        <Input id="name" name="name" required defaultValue={initial?.name ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug (để trống = auto)</Label>
        <Input id="slug" name="slug" defaultValue={initial?.slug ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Tiểu sử</Label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={initial?.bio ?? ""}
          rows={4}
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit">Lưu</Button>
    </form>
  );
}
