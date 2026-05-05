import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StoryOption = {
  id: string;
  title: string;
  licenseStatus: string;
};

export type ChapterFormInitial = {
  storyId?: string;
  number?: number;
  title?: string;
  slug?: string;
  content?: string | null;
  sourceUrl?: string | null;
  publishStatus?:
    | "DRAFT"
    | "PENDING_REVIEW"
    | "SCHEDULED"
    | "PUBLISHED"
    | "FAILED";
  scheduledAt?: string | null;
};

function toLocalIso(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const off = dt.getTimezoneOffset();
  return new Date(dt.getTime() - off * 60_000).toISOString().slice(0, 16);
}

export function ChapterForm({
  action,
  stories,
  initial,
  lockedStory,
}: {
  action: (formData: FormData) => Promise<void>;
  stories: StoryOption[];
  initial?: ChapterFormInitial;
  lockedStory?: StoryOption;
}) {
  const story =
    lockedStory ??
    stories.find((s) => s.id === initial?.storyId) ??
    stories[0];
  const metaOnly = story?.licenseStatus === "METADATA_ONLY";

  return (
    <form action={action} className="max-w-3xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="storyId">Truyện</Label>
        {lockedStory ? (
          <>
            <input type="hidden" name="storyId" value={lockedStory.id} />
            <Input value={lockedStory.title} disabled />
          </>
        ) : (
          <select
            id="storyId"
            name="storyId"
            required
            defaultValue={initial?.storyId ?? story?.id ?? ""}
            className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          >
            {stories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="number">Số chương</Label>
          <Input
            id="number"
            name="number"
            type="number"
            min={1}
            required
            defaultValue={initial?.number ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={initial?.title ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (auto nếu trống)</Label>
        <Input id="slug" name="slug" defaultValue={initial?.slug ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Nội dung</Label>
        {metaOnly && (
          <p className="text-sm text-amber-700">
            Truyện này có license METADATA_ONLY — nội dung sẽ không được lưu.
          </p>
        )}
        <textarea
          id="content"
          name="content"
          rows={16}
          disabled={metaOnly}
          defaultValue={initial?.content ?? ""}
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm disabled:opacity-50"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="publishStatus">Trạng thái</Label>
          <select
            id="publishStatus"
            name="publishStatus"
            defaultValue={initial?.publishStatus ?? "DRAFT"}
            className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          >
            <option value="DRAFT">Nháp</option>
            <option value="PENDING_REVIEW">Chờ duyệt</option>
            <option value="SCHEDULED">Đã lên lịch</option>
            <option value="PUBLISHED">Đã đăng</option>
            <option value="FAILED">Lỗi</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Lên lịch (local)</Label>
          <Input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            defaultValue={toLocalIso(initial?.scheduledAt)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sourceUrl">Source URL</Label>
          <Input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            defaultValue={initial?.sourceUrl ?? ""}
          />
        </div>
      </div>

      <Button type="submit">Lưu</Button>
    </form>
  );
}
