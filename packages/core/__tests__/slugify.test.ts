import { describe, expect, it } from "vitest";
import { slugifyVi, chapterSlug } from "../src";

describe("slugifyVi", () => {
  it("strips Vietnamese diacritics", () => {
    expect(slugifyVi("Dế mèn phiêu lưu ký")).toBe("de-men-phieu-luu-ky");
    expect(slugifyVi("Trạm Truyện")).toBe("tram-truyen");
    expect(slugifyVi("Đường về cố hương")).toBe("duong-ve-co-huong");
  });

  it("handles edge cases", () => {
    expect(slugifyVi("")).toBe("");
    expect(slugifyVi("   ")).toBe("");
    expect(slugifyVi("!!!@@@")).toBe("");
    expect(slugifyVi("Hello-World 123")).toBe("hello-world-123");
  });

  it("collapses multiple separators", () => {
    expect(slugifyVi("a   b---c")).toBe("a-b-c");
  });
});

describe("chapterSlug", () => {
  it("formats with prefix", () => {
    expect(chapterSlug("Mở đầu", 1)).toBe("chuong-1-mo-dau");
    expect(chapterSlug("Chương trắng", 42)).toBe("chuong-42-chuong-trang");
  });

  it("falls back when title empty", () => {
    expect(chapterSlug("", 5)).toBe("chuong-5");
  });
});
