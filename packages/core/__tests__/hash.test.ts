import { describe, expect, it } from "vitest";
import { sha256Normalized, normalizeContent } from "../src";

describe("normalizeContent", () => {
  it("collapses whitespace and lowercases", () => {
    expect(normalizeContent("  Hello\r\n  WORLD  ")).toBe("hello world");
  });
});

describe("sha256Normalized", () => {
  it("produces same hash for equivalent content", () => {
    const a = sha256Normalized("Hello   World\n");
    const b = sha256Normalized("HELLO\nworld");
    expect(a).toBe(b);
  });

  it("produces different hash for different content", () => {
    expect(sha256Normalized("a")).not.toBe(sha256Normalized("b"));
  });
});
