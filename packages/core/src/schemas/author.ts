import { z } from "zod";

export const AuthorInput = z.object({
  name: z.string().trim().min(1, "Tên tác giả bắt buộc").max(150),
  slug: z.string().trim().min(1).max(150).optional(),
  bio: z.string().max(2000).optional().nullable(),
});
export type AuthorInput = z.infer<typeof AuthorInput>;
