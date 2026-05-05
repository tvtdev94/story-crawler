import { createHash } from "node:crypto";

export function normalizeContent(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function sha256Normalized(input: string): string {
  const normalized = normalizeContent(input);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}
