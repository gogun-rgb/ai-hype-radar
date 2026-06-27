import {
  getFileAnalysis,
  getLatestFileAnalysisForRepo,
  getPreviousFileSnapshot,
  listFileAnalyses,
  saveAnalysisToFile
} from "@/lib/storage/file-store";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { AnalysisResult, RepositorySnapshot } from "@/types/analysis";

export async function saveAnalysis(result: AnalysisResult): Promise<void> {
  await saveAnalysisToFile(result);

  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  try {
    const { data: repository } = await supabase
      .from("repositories")
      .upsert(
        {
          id: result.repositoryId,
          github_owner: result.repository.owner,
          github_repo: result.repository.repo,
          github_url: result.repository.htmlUrl,
          name: result.repository.name,
          description: result.repository.description
        },
        { onConflict: "github_owner,github_repo" }
      )
      .select("id")
      .single();

    const repositoryId = repository?.id ?? result.repositoryId;

    await supabase.from("repository_snapshots").insert({
      id: result.snapshot.id,
      repository_id: repositoryId,
      stars: result.snapshot.stars,
      forks: result.snapshot.forks,
      open_issues: result.snapshot.openIssues,
      contributors: result.snapshot.contributors,
      recent_commits: result.snapshot.recentCommits,
      recent_releases: result.snapshot.recentReleases,
      captured_at: result.snapshot.capturedAt
    });

    await supabase.from("analyses").insert({
      id: result.id,
      repository_id: repositoryId,
      hype_score: result.scores.hype.value,
      reality_score: result.scores.reality.value,
      risk_score: result.scores.risk.value,
      confidence_level: result.scores.confidence,
      quantitative_details: {
        scores: result.scores,
        readmeSignals: result.readmeSignals,
        collectedCounts: result.collectedCounts,
        notices: result.notices
      },
      qualitative_summary: result.qualitative,
      canva_prompt: result.canvaPrompt,
      analysis_status: result.analysisStatus,
      created_at: result.createdAt
    });

    if (result.sources.length > 0) {
      await supabase.from("sources").insert(
        result.sources.map((source) => ({
          analysis_id: result.id,
          external_source_id: source.id,
          source_type: source.sourceType,
          title: source.title,
          summary: source.summary,
          url: source.url,
          sentiment: source.sentiment,
          category: source.category,
          metadata: source.metadata ?? {},
          published_at: source.publishedAt
        }))
      );
    }
  } catch {
    // File storage already succeeded; do not fail analysis because optional Supabase persistence failed.
  }
}

export async function listAnalyses(limit = 20): Promise<AnalysisResult[]> {
  return listFileAnalyses(limit);
}

export async function getAnalysis(id: string): Promise<AnalysisResult | null> {
  return getFileAnalysis(id);
}

export async function getLatestAnalysisForRepo(owner: string, repo: string, maxAgeMinutes?: number): Promise<AnalysisResult | null> {
  return getLatestFileAnalysisForRepo(owner, repo, maxAgeMinutes);
}

export async function getPreviousSnapshot(owner: string, repo: string): Promise<RepositorySnapshot | null> {
  return getPreviousFileSnapshot(owner, repo);
}
