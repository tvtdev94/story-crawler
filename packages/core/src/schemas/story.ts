import { z } from "zod";
import { StoryStatus, LicenseStatus } from "../types";

const StoryStatusEnum = z.enum([
  StoryStatus.ONGOING,
  StoryStatus.COMPLETED,
  StoryStatus.HIATUS,
]);

const LicenseStatusEnum = z.enum([
  LicenseStatus.OWNED,
  LicenseStatus.LICENSED,
  LicenseStatus.PUBLIC_DOMAIN,
  LicenseStatus.METADATA_ONLY,
  LicenseStatus.UNAUTHORIZED,
]);

export const StoryInput = z.object({
  title: z.string().trim().min(1, "Tiêu đề bắt buộc").max(200),
  slug: z.string().trim().min(1).max(200).optional(),
  authorId: z.string().min(1).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  coverUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  storyStatus: StoryStatusEnum.default(StoryStatus.ONGOING),
  licenseStatus: LicenseStatusEnum.default(LicenseStatus.METADATA_ONLY),
  sourceUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  genreIds: z.array(z.string().min(1)).default([]),
});
export type StoryInput = z.infer<typeof StoryInput>;

export const StoryListQuery = z.object({
  q: z.string().trim().optional(),
  status: StoryStatusEnum.optional(),
  license: LicenseStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type StoryListQuery = z.infer<typeof StoryListQuery>;
