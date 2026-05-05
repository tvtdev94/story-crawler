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
};

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
        <label className="mt-7 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={initial?.enabled ?? true}
          />
          Cho phép chạy crawl
        </label>
      </div>
      <Button type="submit">Lưu</Button>
    </form>
  );
}
