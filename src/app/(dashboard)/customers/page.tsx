import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerActions } from "@/components/customers/customer-actions";
import { getCustomers } from "@/lib/actions/customers";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;

  let customers: Awaited<ReturnType<typeof getCustomers>> = [];
  let error: string | null = null;

  try {
    customers = await getCustomers(search);
  } catch {
    error = "고객 목록을 불러올 수 없습니다. Supabase 설정을 확인하세요.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">고객 관리</h1>
          <p className="text-gray-500">
            {customers.length}명의 고객
          </p>
        </div>
        <Link href="/customers/new">
          <Button>+ 고객 등록</Button>
        </Link>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {error}
          </CardContent>
        </Card>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">등록된 고객이 없습니다.</p>
            <Link href="/customers/new">
              <Button className="mt-4">첫 고객 등록하기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>고객 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>주소</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {customer.address || "-"}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {customer.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <CustomerActions customerId={customer.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
