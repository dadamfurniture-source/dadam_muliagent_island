import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ProjectStatusSelect } from "@/components/projects/project-status-select";
import { OrderItemForm } from "@/components/projects/order-item-form";
import { getProject, getProjectItems } from "@/lib/actions/projects";
import { FURNITURE_TYPE_LABELS } from "@/types";
import type { ProjectStatus, FurnitureType } from "@/types";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project;
  let items: Awaited<ReturnType<typeof getProjectItems>> = [];

  try {
    project = await getProject(id);
    items = await getProjectItems(id);
  } catch {
    notFound();
  }

  const customer = project.customer as {
    name: string;
    phone: string;
    address: string;
  } | null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          {customer && (
            <p className="mt-1 text-gray-500">
              고객: {customer.name}
              {customer.phone && ` (${customer.phone})`}
            </p>
          )}
        </div>
        <ProjectStatusSelect
          projectId={project.id}
          currentStatus={project.status as ProjectStatus}
        />
      </div>

      {/* 프로젝트 정보 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">시공 주소</div>
            <div className="mt-1 font-medium">
              {project.address || "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">총 금액</div>
            <div className="mt-1 font-medium">
              {project.total_amount > 0
                ? `₩${project.total_amount.toLocaleString()}`
                : "미산출"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-500">메모</div>
            <div className="mt-1 text-sm">{project.notes || "-"}</div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 주문 품목 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>주문 품목</CardTitle>
          <OrderItemForm projectId={project.id} />
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              등록된 품목이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>가구 유형</TableHead>
                  <TableHead>규격 (mm)</TableHead>
                  <TableHead>자재/색상</TableHead>
                  <TableHead>수량</TableHead>
                  <TableHead className="text-right">단가</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {FURNITURE_TYPE_LABELS[item.furniture_type as FurnitureType] ||
                        item.furniture_type_label ||
                        item.furniture_type}
                    </TableCell>
                    <TableCell>
                      {[item.width_mm, item.height_mm, item.depth_mm]
                        .filter(Boolean)
                        .join(" x ") || "-"}
                    </TableCell>
                    <TableCell>
                      {[item.material, item.color].filter(Boolean).join(" / ") ||
                        "-"}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {item.unit_price > 0
                        ? `₩${item.unit_price.toLocaleString()}`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
