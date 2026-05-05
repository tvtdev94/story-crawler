import { cn } from "@/lib/utils";
import type {
  PublishStatus,
  StoryStatus,
  LicenseStatus,
  JobStatus,
} from "@story-crawler/core";

const PUBLISH_COLORS: Record<PublishStatus, string> = {
  DRAFT: "bg-slate-200 text-slate-800",
  PENDING_REVIEW: "bg-amber-200 text-amber-900",
  SCHEDULED: "bg-blue-200 text-blue-900",
  PUBLISHED: "bg-green-200 text-green-900",
  FAILED: "bg-red-200 text-red-900",
};

const STORY_COLORS: Record<StoryStatus, string> = {
  ONGOING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  HIATUS: "bg-amber-100 text-amber-800",
};

const LICENSE_COLORS: Record<LicenseStatus, string> = {
  OWNED: "bg-emerald-100 text-emerald-800",
  LICENSED: "bg-cyan-100 text-cyan-800",
  PUBLIC_DOMAIN: "bg-teal-100 text-teal-800",
  METADATA_ONLY: "bg-amber-100 text-amber-800",
  UNAUTHORIZED: "bg-red-100 text-red-800",
};

const JOB_COLORS: Record<JobStatus, string> = {
  QUEUED: "bg-slate-200 text-slate-800",
  RUNNING: "bg-blue-200 text-blue-900",
  SUCCESS: "bg-green-200 text-green-900",
  FAILED: "bg-red-200 text-red-900",
};

const PUBLISH_LABELS: Record<PublishStatus, string> = {
  DRAFT: "Nháp",
  PENDING_REVIEW: "Chờ duyệt",
  SCHEDULED: "Đã lên lịch",
  PUBLISHED: "Đã đăng",
  FAILED: "Lỗi",
};

const STORY_LABELS: Record<StoryStatus, string> = {
  ONGOING: "Đang tiến hành",
  COMPLETED: "Hoàn thành",
  HIATUS: "Tạm dừng",
};

const LICENSE_LABELS: Record<LicenseStatus, string> = {
  OWNED: "Sở hữu",
  LICENSED: "Có bản quyền",
  PUBLIC_DOMAIN: "Public domain",
  METADATA_ONLY: "Chỉ metadata",
  UNAUTHORIZED: "Chưa được phép",
};

type Variant =
  | { kind: "publish"; value: PublishStatus }
  | { kind: "story"; value: StoryStatus }
  | { kind: "license"; value: LicenseStatus }
  | { kind: "job"; value: JobStatus };

export function StatusBadge(props: Variant) {
  const cls = (() => {
    switch (props.kind) {
      case "publish":
        return PUBLISH_COLORS[props.value];
      case "story":
        return STORY_COLORS[props.value];
      case "license":
        return LICENSE_COLORS[props.value];
      case "job":
        return JOB_COLORS[props.value];
    }
  })();
  const label = (() => {
    switch (props.kind) {
      case "publish":
        return PUBLISH_LABELS[props.value];
      case "story":
        return STORY_LABELS[props.value];
      case "license":
        return LICENSE_LABELS[props.value];
      case "job":
        return props.value;
    }
  })();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        cls,
      )}
    >
      {label}
    </span>
  );
}
