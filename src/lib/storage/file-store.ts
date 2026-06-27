import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AnalysisResult, RepositorySnapshot } from "@/types/analysis";

interface StoreShape {
  analyses: AnalysisResult[];
}

const EMPTY_STORE: StoreShape = { analyses: [] };
let writeQueue = Promise.resolve();

export async function saveAnalysisToFile(result: AnalysisResult): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const store = await readStore();
    const withoutSameId = store.analyses.filter((analysis) => analysis.id !== result.id);
    await writeStore({
      analyses: [result, ...withoutSameId].slice(0, 100)
    });
  });
  await writeQueue;
}

export async function listFileAnalyses(limit = 20): Promise<AnalysisResult[]> {
  const store = await readStore();
  return [...store.analyses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}

export async function getFileAnalysis(id: string): Promise<AnalysisResult | null> {
  const store = await readStore();
  return store.analyses.find((analysis) => analysis.id === id) ?? null;
}

export async function getLatestFileAnalysisForRepo(owner: string, repo: string, maxAgeMinutes?: number): Promise<AnalysisResult | null> {
  const store = await readStore();
  const latest =
    [...store.analyses]
      .filter((analysis) => analysis.repository.owner.toLowerCase() === owner.toLowerCase() && analysis.repository.repo.toLowerCase() === repo.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;

  if (!latest || !maxAgeMinutes) {
    return latest;
  }

  const ageMinutes = (Date.now() - new Date(latest.createdAt).getTime()) / 60_000;
  return ageMinutes <= maxAgeMinutes ? latest : null;
}

export async function getPreviousFileSnapshot(owner: string, repo: string): Promise<RepositorySnapshot | null> {
  const latest = await getLatestFileAnalysisForRepo(owner, repo);
  return latest?.snapshot ?? null;
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(getStorePath(), "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return { analyses: Array.isArray(parsed.analyses) ? parsed.analyses : [] };
  } catch {
    return EMPTY_STORE;
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  const storePath = getStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function getStorePath(): string {
  const baseDir = process.env.DEMO_DATA_DIR || path.join(process.cwd(), ".ai-hype-radar");
  return path.join(baseDir, "analyses.json");
}
