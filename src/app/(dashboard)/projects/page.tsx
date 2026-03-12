import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { getProjects } from "@/lib/actions/projects";
import type { ProjectStatus } from "@/types";
import { format } from "date-fns";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: ProjectStatus; search?: string }>;
}) {
  const filters = await searchParams;

  let projects: Awaited<ReturnType<typeof getProjects>> = [];
  let error: string | null = null;

  try {
    projects = await getProjects(filters);
  } catch {
    error = "프로젝트를 불러올 수 없습니다. Supabase 설정을 확인하세요.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <p className="text-gray-500">{projects.length}개의 프로젝트</p>
        </div>
        <Link href="/projects/new">
          <Button>+ 새 프로젝트</Button>
        </Link>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {error}
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">프로젝트가 없습니다.</p>
            <Link href="/projects/new">
              <Button className="mt-4">첫 프로젝트 만들기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{project.title}</h3>
                    <ProjectStatusBadge status={project.status as ProjectStatus} />
                  </div>
                  {project.customer && (
                    <p className="mt-2 text-sm text-gray-600">
                      고객: {(project.customer as { name: string }).name}
                    </p>
                  )}
                  {project.address && (
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {project.address}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {project.total_amount > 0
                        ? `₩${project.total_amount.toLocaleString()}`
                        : "견적 미산출"}
                    </span>
                    <span>{format(new Date(project.updated_at), "yyyy.MM.dd")}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
