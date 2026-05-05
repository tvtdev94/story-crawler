import { LicenseMode, LicenseStatus } from "./types";

export type LicensedChapterPayload = {
  content: string | null;
  licenseStatus: LicenseStatus;
  sourceUrl?: string | null;
};

export type LicensedChapterInput = {
  content: string | null;
  sourceUrl?: string | null;
  preferredLicenseStatus?: LicenseStatus;
};

/**
 * License chokepoint. Adapter output passes through this before DB write.
 *  - FULL  → keep content; status from preferred or PUBLIC_DOMAIN default.
 *  - MOCK  → keep content; status PUBLIC_DOMAIN (mock fixture).
 *  - METADATA_ONLY → strip content, force METADATA_ONLY status.
 */
export function applyLicensePolicy(
  mode: LicenseMode,
  input: LicensedChapterInput,
): LicensedChapterPayload {
  if (mode === LicenseMode.METADATA_ONLY) {
    return {
      content: null,
      licenseStatus: LicenseStatus.METADATA_ONLY,
      sourceUrl: input.sourceUrl ?? null,
    };
  }
  const fallback =
    mode === LicenseMode.MOCK
      ? LicenseStatus.PUBLIC_DOMAIN
      : LicenseStatus.PUBLIC_DOMAIN;
  return {
    content: input.content,
    licenseStatus: input.preferredLicenseStatus ?? fallback,
    sourceUrl: input.sourceUrl ?? null,
  };
}
