"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@story-crawler/db";
import { requireSession } from "@/lib/auth/require-role";

export async function approveChapter(id: string) {
  await requireSession();
  await prisma.chapter.update({
    where: { id },
    data: { publishStatus: "DRAFT" },
  });
  revalidatePath("/admin/review");
  revalidatePath("/admin/chapters");
}

export async function bulkApprove(ids: string[]) {
  await requireSession();
  if (ids.length === 0) return;
  await prisma.chapter.updateMany({
    where: { id: { in: ids }, publishStatus: "PENDING_REVIEW" },
    data: { publishStatus: "DRAFT" },
  });
  revalidatePath("/admin/review");
  revalidatePath("/admin/chapters");
}

export async function scheduleChapter(id: string, scheduledAt: Date) {
  await requireSession();
  if (scheduledAt.getTime() <= Date.now() + 30_000) {
    throw new Error("Thời gian phải sau hiện tại ≥ 30 giây");
  }
  if (scheduledAt.getTime() - Date.now() > 365 * 24 * 3600 * 1000) {
    throw new Error("Không lên lịch quá 1 năm");
  }
  await prisma.chapter.update({
    where: { id },
    data: {
      publishStatus: "SCHEDULED",
      scheduledAt,
    },
  });
  revalidatePath("/admin/chapters");
}

export async function publishNow(id: string) {
  await requireSession();
  await prisma.chapter.update({
    where: { id },
    data: {
      publishStatus: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
  await prisma.publishLog.create({
    data: {
      chapterId: id,
      status: "SUCCESS",
      message: "Manual publish",
    },
  });
  revalidatePath("/admin/chapters");
}
