import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GenreForm({
  action,
  initial,
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: { name?: string; slug?: string };
}) {
  return (
    <form action={action} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên thể loại</Label>
        <Input id="name" name="name" required defaultValue={initial?.name ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug (để trống = auto)</Label>
        <Input id="slug" name="slug" defaultValue={initial?.slug ?? ""} />
      </div>
      <Button type="submit">Lưu</Button>
    </form>
  );
}
