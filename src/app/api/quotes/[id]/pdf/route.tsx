import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { QuotePDF } from "@/components/quote/quote-pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 견적 + 프로젝트 + 고객 정보 조회
    const { data: quote, error } = await supabase
      .from("quotes")
      .select("*, project:projects(id, title, address, customer:customers(id, name, phone, address))")
      .eq("id", id)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: "견적을 찾을 수 없습니다." }, { status: 404 });
    }

    // 사업자 프로필 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, phone, business_number")
      .eq("id", user.id)
      .single();

    const pdfBuffer = await renderToBuffer(
      <QuotePDF
        quote={quote}
        project={quote.project}
        customer={quote.project?.customer}
        business={profile}
      />,
    );

    const uint8 = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="quote-v${quote.version}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Quote PDF error:", error);
    return NextResponse.json({ error: "PDF 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
