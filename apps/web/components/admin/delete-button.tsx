"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  confirmText,
  expected,
  label = "Xoá",
}: {
  action: () => Promise<void>;
  confirmText?: string;
  expected?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();
  const ok = expected ? typed === expected : true;

  if (!open) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded border border-red-300 bg-red-50 p-3 text-sm">
      <p className="font-medium text-red-900">{confirmText ?? "Xoá vĩnh viễn?"}</p>
      {expected && (
        <input
          className="w-full rounded border border-red-300 bg-white px-2 py-1 text-sm"
          placeholder={`Gõ "${expected}" để xác nhận`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
      )}
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={!ok || pending}
          onClick={() => start(() => action())}
        >
          {pending ? "Đang xoá…" : "Xác nhận"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Huỷ
        </Button>
      </div>
    </div>
  );
}
