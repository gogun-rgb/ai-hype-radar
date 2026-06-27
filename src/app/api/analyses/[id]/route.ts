import { apiError, apiOk } from "@/lib/api/response";
import { getAnalysis } from "@/lib/storage/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = await getAnalysis(id);

  if (!analysis) {
    return apiError("ANALYSIS_NOT_FOUND", "분석 결과를 찾을 수 없습니다.", 404);
  }

  return apiOk({ analysis });
}
