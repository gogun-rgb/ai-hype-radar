import { apiOk } from "@/lib/api/response";
import { listAnalyses } from "@/lib/storage/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const analyses = await listAnalyses(20);
  return apiOk({ analyses });
}
