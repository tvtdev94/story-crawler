import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SourceFormInitial = {
  name?: string;
  baseUrl?: string;
  adapterKey?: string;
  licenseMode?: "FULL" | "METADATA_ONLY" | "MOCK";
  enabled?: boolean;
  rateLimitMs?: number;
  refreshIntervalHours?: number | null;
};

const REFRESH_OPTIONS: { value: string; label: string }[] = [
  { value: "0", label: "Tắt (chạy thủ công)" },
  { value: "1", label: "Mỗi 1 giờ" },
  { value: "3", label: "Mỗi 3 giờ" },
  { value: "6", label: "Mỗi 6 giờ" },
  { value: "12", label: "Mỗi 12 giờ" },
  { value: "24", label: "Mỗi ngày" },
  { value: "168", label: "Mỗi tuần" },
];

export function SourceForm({
  action,
  adapterKeys,
  initial,
}: {
  action: (formData: FormData) => Promise<void>;
  adapterKeys: string[];
  initial?: SourceFormInitial;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên nguồn</Label>
        <Input id="name" name="name" required defaultValue={initial?.name ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="baseUrl">Base URL</Label>
        <Input
          id="baseUrl"
          name="baseUrl"
          type="url"
          required
          defaultValue={initial?.baseUrl ?? ""}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="adapterKey">Adapter key</Label>
          <select
            id="adapterKey"
            name="adapterKey"
            required
            defaultValue={initial?.adapterKey ?? ""}
            className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          >
            <option value="" disabled>
              — Chọn adapter —
            </option>
            {adapterKeys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="licenseMode">License mode</Label>
          <select
            id="licenseMode"
            name="licenseMode"
            required
            defaultValue={initial?.licenseMode ?? "METADATA_ONLY"}
            className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          >
            <option value="FULL">FULL</option>
            <option value="METADATA_ONLY">METADATA_ONLY</option>
            <option value="MOCK">MOCK</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rateLimitMs">Rate limit (ms)</Label>
          <Input
            id="rateLimitMs"
            name="rateLimitMs"
            type="number"
            min={0}
            defaultValue={initial?.rateLimitMs ?? 1000}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refreshIntervalHours">Tự động làm mới</Label>
          <select
            id="refreshIntervalHours"
            name="refreshIntervalHours"
            defaultValue={String(initial?.refreshIntervalHours ?? 0)}
            className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          >
            {REFRESH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={initial?.enabled ?? true}
        />
        Cho phép chạy crawl
      </label>
      <Button type="submit">Lưu</Button>
    </form>
  );
}
