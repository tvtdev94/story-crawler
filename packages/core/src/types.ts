export const Role = {
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const StoryStatus = {
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  HIATUS: "HIATUS",
} as const;
export type StoryStatus = (typeof StoryStatus)[keyof typeof StoryStatus];

export const LicenseStatus = {
  OWNED: "OWNED",
  LICENSED: "LICENSED",
  PUBLIC_DOMAIN: "PUBLIC_DOMAIN",
  METADATA_ONLY: "METADATA_ONLY",
  UNAUTHORIZED: "UNAUTHORIZED",
} as const;
export type LicenseStatus = (typeof LicenseStatus)[keyof typeof LicenseStatus];

export const PublishStatus = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
} as const;
export type PublishStatus = (typeof PublishStatus)[keyof typeof PublishStatus];

export const LicenseMode = {
  FULL: "FULL",
  METADATA_ONLY: "METADATA_ONLY",
  MOCK: "MOCK",
} as const;
export type LicenseMode = (typeof LicenseMode)[keyof typeof LicenseMode];

export const JobStatus = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const PublishLogStatus = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;
export type PublishLogStatus =
  (typeof PublishLogStatus)[keyof typeof PublishLogStatus];

export const DiscoveredStatus = {
  DISCOVERED: "DISCOVERED",
  QUEUED: "QUEUED",
  FETCHED: "FETCHED",
  SKIPPED: "SKIPPED",
  FAILED: "FAILED",
} as const;
export type DiscoveredStatus =
  (typeof DiscoveredStatus)[keyof typeof DiscoveredStatus];

export const RESERVED_SLUGS = new Set<string>([
  "admin",
  "api",
  "tim-kiem",
  "the-loai",
  "truyen",
  "sitemap",
  "robots",
]);
