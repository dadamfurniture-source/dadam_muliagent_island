import { notFound } from "next/navigation";
import { DrawingEditor } from "@/components/drawing/drawing-editor";
import { getDrawing } from "@/lib/actions/drawings";

export default async function DrawingEditorPage({
  params,
}: {
  params: Promise<{ id: string; drawingId: string }>;
}) {
  const { drawingId } = await params;

  let drawing;
  try {
    drawing = await getDrawing(drawingId);
  } catch {
    notFound();
  }

  const drawingData = (drawing.drawing_data || {}) as {
    elements?: readonly Record<string, unknown>[];
    appState?: Record<string, unknown>;
    files?: Record<string, unknown>;
  };

  return (
    <div className="-m-4 md:-m-6 h-[calc(100vh-4rem)]">
      <DrawingEditor
        drawingId={drawing.id}
        initialData={{
          elements: drawingData.elements || [],
          appState: drawingData.appState || {},
          files: drawingData.files || {},
        }}
        title={drawing.title || "도면"}
      />
    </div>
  );
}
