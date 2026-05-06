"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@story-crawler/db";
import { DiscoveredStatus } from "@story-crawler/core";
import { requireSession } from "@/lib/auth/require-role";
import { enqueueFetch } from "@/lib/queues/fetch-enqueue";

const MAX_BULK = 200;

function guard(ids: string[]) {
  if (ids.length === 0) return false;
  if (ids.length > MAX_BULK) throw new Error("Tối đa 200 dòng mỗi lần");
  return true;
}

export async function bulkFetch(ids: string[]) {
  await requireSession();
  if (!guard(ids)) return;
  await enqueueFetch(ids);
  revalidatePath("/admin/discovered");
}

export async function bulkSkip(ids: string[]) {
  await requireSession();
  if (!guard(ids)) return;
  await prisma.discoveredItem.updateMany({
    where: { id: { in: ids }, status: DiscoveredStatus.DISCOVERED },
    data: { status: DiscoveredStatus.SKIPPED },
  });
  revalidatePath("/admin/discovered");
}

export async function restoreItems(ids: string[]) {
  await requireSession();
  if (!guard(ids)) return;
  await prisma.discoveredItem.updateMany({
    where: { id: { in: ids }, status: DiscoveredStatus.SKIPPED },
    data: { status: DiscoveredStatus.DISCOVERED },
  });
  revalidatePath("/admin/discovered");
}

export async function retryFailed(ids: string[]) {
  await requireSession();
  if (!guard(ids)) return;
  await prisma.discoveredItem.updateMany({
    where: { id: { in: ids }, status: DiscoveredStatus.FAILED },
    data: {
      status: DiscoveredStatus.DISCOVERED,
      attempts: 0,
      errorMessage: null,
    },
  });
  revalidatePath("/admin/discovered");
}
