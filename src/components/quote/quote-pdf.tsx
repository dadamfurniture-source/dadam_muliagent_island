import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// 한글 폰트 등록 (Google Fonts CDN)
Font.register({
  family: "NotoSansKR",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static/Pretendard-Regular.otf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static/Pretendard-Bold.otf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansKR",
    fontSize: 10,
    padding: 40,
    color: "#333",
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 80,
    fontSize: 10,
    color: "#666",
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  colNo: { width: 30, textAlign: "center" },
  colName: { flex: 2 },
  colSpec: { flex: 2 },
  colQty: { width: 40, textAlign: "center" },
  colPrice: { width: 80, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  headerText: {
    fontSize: 9,
    fontWeight: 700,
    color: "#374151",
  },
  cellText: {
    fontSize: 9,
  },
  summarySection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    width: 250,
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#666",
  },
  summaryValue: {
    fontSize: 10,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    width: 250,
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 2,
    borderColor: "#333",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 700,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: "right",
  },
  notes: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#666",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
  stamp: {
    marginTop: 30,
    alignItems: "flex-end",
  },
  stampText: {
    fontSize: 10,
    color: "#666",
  },
});

function formatCurrency(n: number): string {
  return `₩${n.toLocaleString("ko-KR")}`;
}

interface QuoteItem {
  name: string;
  specification: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface QuotePDFProps {
  quote: {
    version: number;
    items: QuoteItem[];
    material_cost: number;
    labor_cost: number;
    delivery_cost: number;
    misc_cost: number;
    discount: number;
    tax: number;
    total: number;
    notes: string | null;
    is_final: boolean;
    created_at: string;
  };
  project?: {
    title: string;
    address: string | null;
  } | null;
  customer?: {
    name: string;
    phone: string | null;
    address: string | null;
  } | null;
  business?: {
    full_name: string;
    company_name: string | null;
    phone: string | null;
    business_number: string | null;
  } | null;
}

export function QuotePDF({ quote, project, customer, business }: QuotePDFProps) {
  const items = (quote.items || []) as QuoteItem[];
  const createdDate = new Date(quote.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>견 적 서</Text>
          <Text style={styles.subtitle}>
            {quote.is_final ? "[확정]" : "[초안]"} v{quote.version} | {createdDate}
          </Text>
        </View>

        {/* 고객 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>고객 정보</Text>
          <View style={styles.row}>
            <Text style={styles.label}>고객명</Text>
            <Text style={styles.value}>{customer?.name || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>연락처</Text>
            <Text style={styles.value}>{customer?.phone || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>프로젝트</Text>
            <Text style={styles.value}>{project?.title || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>시공 주소</Text>
            <Text style={styles.value}>{project?.address || customer?.address || "-"}</Text>
          </View>
        </View>

        {/* 품목 테이블 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>견적 내역</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colNo, styles.headerText]}>No</Text>
              <Text style={[styles.colName, styles.headerText]}>품목</Text>
              <Text style={[styles.colSpec, styles.headerText]}>규격</Text>
              <Text style={[styles.colQty, styles.headerText]}>수량</Text>
              <Text style={[styles.colPrice, styles.headerText]}>단가</Text>
              <Text style={[styles.colAmount, styles.headerText]}>금액</Text>
            </View>
            {items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.colNo, styles.cellText]}>{i + 1}</Text>
                <Text style={[styles.colName, styles.cellText]}>{item.name}</Text>
                <Text style={[styles.colSpec, styles.cellText]}>{item.specification}</Text>
                <Text style={[styles.colQty, styles.cellText]}>{item.quantity}</Text>
                <Text style={[styles.colPrice, styles.cellText]}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={[styles.colAmount, styles.cellText]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 합계 */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>자재비</Text>
            <Text style={styles.summaryValue}>{formatCurrency(quote.material_cost)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>공임</Text>
            <Text style={styles.summaryValue}>{formatCurrency(quote.labor_cost)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>배송비</Text>
            <Text style={styles.summaryValue}>{formatCurrency(quote.delivery_cost)}</Text>
          </View>
          {quote.misc_cost > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>기타</Text>
              <Text style={styles.summaryValue}>{formatCurrency(quote.misc_cost)}</Text>
            </View>
          )}
          {quote.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>할인</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(quote.discount)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>부가세 (10%)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(quote.tax)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>합계</Text>
            <Text style={styles.totalValue}>{formatCurrency(quote.total)}</Text>
          </View>
        </View>

        {/* 비고 */}
        {quote.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* 사업자 정보 */}
        <View style={styles.stamp}>
          <Text style={styles.stampText}>
            {business?.company_name || business?.full_name || ""}
          </Text>
          {business?.business_number && (
            <Text style={styles.stampText}>사업자번호: {business.business_number}</Text>
          )}
          {business?.phone && (
            <Text style={styles.stampText}>연락처: {business.phone}</Text>
          )}
        </View>

        {/* 푸터 */}
        <Text style={styles.footer}>
          본 견적서는 FurniAI에서 자동 생성되었습니다. 유효기간: 발행일로부터 30일
        </Text>
      </Page>
    </Document>
  );
}
