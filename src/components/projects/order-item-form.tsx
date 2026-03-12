"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FURNITURE_TYPE_LABELS } from "@/types";
import { addOrderItem } from "@/lib/actions/projects";

export function OrderItemForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await addOrderItem(projectId, formData);
      setOpen(false);
    } catch {
      alert("품목 추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm" variant="outline">
          + 품목 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>주문 품목 추가</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="furniture_type">가구 유형 *</Label>
            <select
              id="furniture_type"
              name="furniture_type"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {Object.entries(FURNITURE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="width_mm">너비 (mm)</Label>
              <Input id="width_mm" name="width_mm" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height_mm">높이 (mm)</Label>
              <Input id="height_mm" name="height_mm" type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depth_mm">깊이 (mm)</Label>
              <Input id="depth_mm" name="depth_mm" type="number" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="material">자재</Label>
              <Input id="material" name="material" placeholder="하이글로시" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">색상</Label>
              <Input id="color" name="color" placeholder="화이트" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">수량</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                defaultValue={1}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">단가 (원)</Label>
              <Input id="unit_price" name="unit_price" type="number" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "추가 중..." : "품목 추가"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
