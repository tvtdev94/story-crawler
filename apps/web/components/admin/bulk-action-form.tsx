"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export type BulkActionRow = {
  id: string;
  cells: React.ReactNode[];
};

export type BulkAction = {
  key: string;
  label: string;
  variant?: "default" | "outline" | "destructive";
  pendingLabel?: string;
  action: (ids: string[]) => Promise<void>;
};

export function BulkActionForm({
  headers,
  rows,
  actions,
  empty = "Không có dữ liệu.",
}: {
  headers: React.ReactNode[];
  rows: BulkActionRow[];
  actions: BulkAction[];
  empty?: React.ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, start] = useTransition();

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function selectAll() {
    setSelected(new Set(rows.map((r) => r.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function run(action: BulkAction) {
    if (selected.size === 0) return;
    if (selected.size > 200) {
      alert("Tối đa 200 dòng mỗi lần");
      return;
    }
    setPendingKey(action.key);
    start(async () => {
      try {
        await action.action([...selected]);
        clearAll();
      } finally {
        setPendingKey(null);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-ink-muted">
        {empty}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <Button size="sm" variant="outline" type="button" onClick={selectAll}>
          Chọn tất cả
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={clearAll}>
          Bỏ chọn
        </Button>
        <span className="text-ink-muted">Đã chọn: {selected.size}</span>
        <span className="flex-1" />
        {actions.map((a) => (
          <Button
            key={a.key}
            size="sm"
            variant={a.variant ?? "default"}
            type="button"
            disabled={selected.size === 0 || pendingKey !== null}
            onClick={() => run(a)}
          >
            {pendingKey === a.key ? (a.pendingLabel ?? "Đang xử lý…") : a.label}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-paper-dark/5 text-left">
            <tr>
              <th className="w-10 px-3 py-2"></th>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border last:border-0 hover:bg-paper-dark/5"
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                </td>
                {r.cells.map((c, i) => (
                  <td key={i} className="px-3 py-2 align-top">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
