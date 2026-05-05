"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function BulkApproveForm({
  rows,
  action,
}: {
  rows: { id: string; label: string }[];
  action: (ids: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function selectAll() {
    setSelected(new Set(rows.map((r) => r.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm">
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={selectAll}
        >
          Chọn tất cả
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={clearAll}>
          Bỏ chọn
        </Button>
        <span className="text-ink-muted">Đã chọn: {selected.size}</span>
        <Button
          size="sm"
          type="button"
          disabled={selected.size === 0 || pending}
          onClick={() =>
            start(async () => {
              await action([...selected]);
              clearAll();
            })
          }
        >
          {pending ? "Đang duyệt…" : "Duyệt đã chọn"}
        </Button>
      </div>
      <ul className="divide-y divide-border rounded-md border border-border">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-4 py-2">
            <input
              type="checkbox"
              checked={selected.has(r.id)}
              onChange={() => toggle(r.id)}
              id={`r-${r.id}`}
            />
            <label htmlFor={`r-${r.id}`} className="flex-1 text-sm">
              {r.label}
            </label>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-ink-muted">
            Không có chương chờ duyệt.
          </li>
        )}
      </ul>
    </div>
  );
}
