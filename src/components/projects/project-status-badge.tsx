import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/types";
import { PROJECT_STATUS_LABELS } from "@/types";

const STATUS_COLORS: Record<ProjectStatus, string> = {
  consultation: "bg-blue-100 text-blue-800",
  measuring: "bg-purple-100 text-purple-800",
  designing: "bg-indigo-100 text-indigo-800",
  quoting: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  ordering: "bg-orange-100 text-orange-800",
  manufacturing: "bg-amber-100 text-amber-800",
  installing: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
  after_service: "bg-gray-100 text-gray-800",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge className={STATUS_COLORS[status]} variant="outline">
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}
