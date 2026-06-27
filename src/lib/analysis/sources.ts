import { classifyCategory, classifySentiment, isPromotional } from "@/lib/preprocessing/classify";
import { dedupeByContent } from "@/lib/preprocessing/dedupe";
import { compactText } from "@/lib/preprocessing/sanitize";
import type { AnalysisSource, GitHubData, ProblemCategory, RedditPost } from "@/types/analysis";

export function buildAnalysisSources(github: GitHubData, redditPosts: RedditPost[]): AnalysisSource[] {
  const issueSources = dedupeByContent(
    github.issues
      .filter((issue) => !issue.isBot)
      .map((issue) => ({
        id: `github-issue-${issue.number}`,
        title: issue.title,
        body: issue.body,
        issue
      }))
  ).map(({ id, title, body, issue }) => {
    const text = `${title}\n${body}`;
    const category = classifyCategory(text);
    return {
      id,
      sourceType: "github_issue" as const,
      title,
      summary: summarizeEvidence(text, category),
      url: issue.htmlUrl,
      sentiment: classifySentiment(text),
      category,
      publishedAt: issue.createdAt,
      reactions: issue.reactions + issue.comments,
      metadata: {
        issueNumber: issue.number,
        state: issue.state,
        comments: issue.comments
      }
    };
  });

  const redditSources = dedupeByContent(
    redditPosts.map((post) => ({
      id: `reddit-post-${post.id}`,
      title: post.title,
      body: post.body,
      post
    }))
  )
    .filter(({ title, body }) => !isPromotional(`${title}\n${body}`))
    .map(({ id, title, body, post }) => {
      const text = `${title}\n${body}`;
      const category = classifyCategory(text);
      return {
        id,
        sourceType: "reddit_post" as const,
        title,
        summary: summarizeEvidence(text, category),
        url: post.permalink,
        sentiment: classifySentiment(text),
        category,
        publishedAt: post.createdAt,
        score: post.score,
        reactions: post.comments,
        metadata: {
          subreddit: post.subreddit,
          comments: post.comments
        }
      };
    });

  const readmeSource: AnalysisSource = {
    id: "readme-1",
    sourceType: "github_readme",
    title: "README 공식 설명",
    summary: compactText(github.readme, 700) || "README를 찾을 수 없거나 내용이 비어 있습니다.",
    url: `${github.repository.htmlUrl}#readme`,
    sentiment: "neutral",
    category: "documentation",
    publishedAt: github.repository.updatedAt,
    metadata: {
      source: "README"
    }
  };

  return [readmeSource, ...issueSources, ...redditSources].slice(0, 60);
}

function summarizeEvidence(text: string, category: ProblemCategory): string {
  const compacted = compactText(text, 480);
  const firstSentence = compacted.split(/(?<=[.!?。！？])\s+/)[0] ?? compacted;
  const suffix = category !== "none" ? ` 관련 범주: ${category}.` : "";

  return `${firstSentence.slice(0, 360)}${firstSentence.length > 360 ? "..." : ""}${suffix}`;
}
