import { z } from "zod";
import { PublishStatus } from "../types";

const PublishStatusEnum = z.enum([
  PublishStatus.DRAFT,
  PublishStatus.PENDING_REVIEW,
  PublishStatus.SCHEDULED,
  PublishStatus.PUBLISHED,
  PublishStatus.FAILED,
]);

const MAX_CONTENT = 500_000;

export const ChapterInput = z.object({
  storyId: z.string().min(1, "Truyện bắt buộc"),
  number: z.coerce.number().int().min(1, "Số chương ≥ 1"),
  title: z.string().trim().min(1, "Tiêu đề bắt buộc").max(200),
  slug: z.string().trim().min(1).max(200).optional(),
  content: z
    .string()
    .max(MAX_CONTENT)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  sourceUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  publishStatus: PublishStatusEnum.default(PublishStatus.DRAFT),
  scheduledAt: z
    .union([z.string().datetime(), z.date(), z.null()])
    .optional(),
});
export type ChapterInput = z.infer<typeof ChapterInput>;

export const ChapterListQuery = z.object({
  storyId: z.string().optional(),
  status: PublishStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ChapterListQuery = z.infer<typeof ChapterListQuery>;
