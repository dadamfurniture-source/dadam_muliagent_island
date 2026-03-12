"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";

interface CustomerFormProps {
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    address_detail: string | null;
    notes: string | null;
  };
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!customer;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (isEdit) {
        await updateCustomer(customer.id, formData);
      } else {
        await createCustomer(formData);
      }
      router.push("/customers");
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{isEdit ? "고객 수정" : "고객 등록"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={customer?.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">연락처</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="010-0000-0000"
              defaultValue={customer?.phone || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              name="address"
              defaultValue={customer?.address || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_detail">상세 주소</Label>
            <Input
              id="address_detail"
              name="address_detail"
              defaultValue={customer?.address_detail || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={customer?.notes || ""}
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : isEdit ? "수정" : "등록"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
