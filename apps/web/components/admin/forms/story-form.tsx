import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string };

export type StoryFormInitial = {
  title?: string;
  slug?: string;
  authorId?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  storyStatus?: "ONGOING" | "COMPLETED" | "HIATUS";
  licenseStatus?:
    | "OWNED"
    | "LICENSED"
    | "PUBLIC_DOMAIN"
    | "METADATA_ONLY"
    | "UNAUTHORIZED";
  sourceUrl?: string | null;
  genreIds?: string[];
};

export function StoryForm({
  action,
  authors,
  genres,
  initial,
}: {
  action: (formData: FormData) => Promise<void>;
  authors: Option[];
  genres: Option[];
  initial?: StoryFormInitial;
}) {
  const selectedGenres = new Set(initial?.genreIds ?? []);
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={initial?.title ?? ""}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (auto từ tiêu đề nếu trống)</Label>
          <Input id="slug" name="slug" defaultValue={initial?.slug ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="authorId">Tác giả</Label>
          <select
            id="authorId"
            name="authorId"
            defaultValue={initial?.authorId ?? ""}
            className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          >
            <option value="">— Chưa chọn —</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial?.description ?? ""}
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="storyStatus">Trạng thái</Label>
          <select
            id="storyStatus"
            name="storyStatus"
            defaultValue={initial?.storyStatus ?? "ONGOING"}
            className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          >
            <option value="ONGOING">Đang tiến hành</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="HIATUS">Tạm dừng</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="licenseStatus">License</Label>
          <select
            id="licenseStatus"
            name="licenseStatus"
            defaultValue={initial?.licenseStatus ?? "METADATA_ONLY"}
            className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          >
            <option value="OWNED">Sở hữu</option>
            <option value="LICENSED">Có bản quyền</option>
            <option value="PUBLIC_DOMAIN">Public domain</option>
            <option value="METADATA_ONLY">Chỉ metadata</option>
            <option value="UNAUTHORIZED">Chưa được phép</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="coverUrl">Cover URL</Label>
          <Input
            id="coverUrl"
            name="coverUrl"
            type="url"
            placeholder="https://…"
            defaultValue={initial?.coverUrl ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceUrl">Source URL</Label>
        <Input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          placeholder="https://…"
          defaultValue={initial?.sourceUrl ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label>Thể loại</Label>
        <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3 sm:grid-cols-3">
          {genres.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="genreIds"
                value={g.id}
                defaultChecked={selectedGenres.has(g.id)}
              />
              {g.name}
            </label>
          ))}
          {genres.length === 0 && (
            <p className="text-sm text-ink-muted">Chưa có thể loại nào.</p>
          )}
        </div>
      </div>

      <Button type="submit">Lưu</Button>
    </form>
  );
}
