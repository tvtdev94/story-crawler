import { z } from "zod";
import { LicenseMode } from "../types";

export const SourceInput = z.object({
  name: z.string().trim().min(1).max(120),
  baseUrl: z.string().url(),
  adapterKey: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "kebab-case ASCII"),
  licenseMode: z.enum([
    LicenseMode.FULL,
    LicenseMode.METADATA_ONLY,
    LicenseMode.MOCK,
  ]),
  enabled: z.boolean().default(true),
  rateLimitMs: z.coerce.number().int().min(0).max(60_000).default(1000),
  refreshIntervalHours: z.coerce
    .number()
    .int()
    .min(1)
    .max(720)
    .nullable()
    .optional(),
});
export type SourceInput = z.infer<typeof SourceInput>;
