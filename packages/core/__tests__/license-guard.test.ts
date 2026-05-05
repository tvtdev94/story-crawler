import { describe, expect, it } from "vitest";
import {
  applyLicensePolicy,
  LicenseMode,
  LicenseStatus,
} from "../src";

describe("applyLicensePolicy (license chokepoint)", () => {
  it("FULL mode keeps content and respects preferred status", () => {
    const out = applyLicensePolicy(LicenseMode.FULL, {
      content: "Hello world",
      preferredLicenseStatus: LicenseStatus.OWNED,
      sourceUrl: "https://x.test",
    });
    expect(out.content).toBe("Hello world");
    expect(out.licenseStatus).toBe(LicenseStatus.OWNED);
    expect(out.sourceUrl).toBe("https://x.test");
  });

  it("FULL mode without preferred status defaults to PUBLIC_DOMAIN", () => {
    const out = applyLicensePolicy(LicenseMode.FULL, {
      content: "abc",
      sourceUrl: null,
    });
    expect(out.licenseStatus).toBe(LicenseStatus.PUBLIC_DOMAIN);
    expect(out.content).toBe("abc");
  });

  it("MOCK mode keeps content and forces PUBLIC_DOMAIN status", () => {
    const out = applyLicensePolicy(LicenseMode.MOCK, {
      content: "fixture text",
      sourceUrl: null,
    });
    expect(out.content).toBe("fixture text");
    expect(out.licenseStatus).toBe(LicenseStatus.PUBLIC_DOMAIN);
  });

  it("METADATA_ONLY mode strips content and forces METADATA_ONLY status", () => {
    const out = applyLicensePolicy(LicenseMode.METADATA_ONLY, {
      content: "secret content from licensed source",
      preferredLicenseStatus: LicenseStatus.LICENSED,
      sourceUrl: "https://src.test",
    });
    expect(out.content).toBeNull();
    expect(out.licenseStatus).toBe(LicenseStatus.METADATA_ONLY);
    expect(out.sourceUrl).toBe("https://src.test");
  });

  it("METADATA_ONLY mode handles null content idempotently", () => {
    const out = applyLicensePolicy(LicenseMode.METADATA_ONLY, {
      content: null,
      sourceUrl: null,
    });
    expect(out.content).toBeNull();
    expect(out.licenseStatus).toBe(LicenseStatus.METADATA_ONLY);
  });
});
