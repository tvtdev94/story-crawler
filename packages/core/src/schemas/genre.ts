import { z } from "zod";

export const GenreInput = z.object({
  name: z.string().trim().min(1, "Tên thể loại bắt buộc").max(80),
  slug: z.string().trim().min(1).max(80).optional(),
});
export type GenreInput = z.infer<typeof GenreInput>;
