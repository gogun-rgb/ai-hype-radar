import { fetchWithTimeout } from "@/lib/api/fetch";
import type { DataSourceStatus, RedditPost } from "@/types/analysis";

interface RedditListingResponse {
  data?: {
    children?: Array<{
      data: {
        id: string;
        title: string;
        selftext?: string;
        subreddit: string;
        created_utc: number;
        score: number;
        num_comments: number;
        url: string;
        permalink: string;
      };
    }>;
  };
}

interface RedditTokenResponse {
  access_token?: string;
}

type RedditChildData = NonNullable<NonNullable<RedditListingResponse["data"]>["children"]>[number]["data"];
const REDDIT_TIMEOUT_MS = 10_000;

export interface RedditSearchResult {
  posts: RedditPost[];
  status: DataSourceStatus;
  disabledReason?: string;
}

export function isRedditConfigured(): boolean {
  return Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USER_AGENT);
}

export async function searchReddit(queryTerms: string[]): Promise<RedditSearchResult> {
  if (!isRedditConfigured()) {
    return {
      posts: [],
      status: "not_configured",
      disabledReason: "Reddit API가 연결되지 않아 GitHub 데이터 중심으로 분석했습니다."
    };
  }

  try {
    const token = await getRedditToken();
    const unique = new Map<string, RedditPost>();

    for (const term of queryTerms.slice(0, 5)) {
      const encoded = encodeURIComponent(term);
      const response = await fetchWithTimeout(
        `https://oauth.reddit.com/search?q=${encoded}&sort=relevance&t=year&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": process.env.REDDIT_USER_AGENT ?? "ai-hype-radar/0.1"
          },
          next: { revalidate: 0 }
        },
        REDDIT_TIMEOUT_MS
      );

      if (response.status === 429) {
        return {
          posts: Array.from(unique.values()).slice(0, 25),
          status: "rate_limited",
          disabledReason: "Reddit API rate limit으로 일부 결과만 반영했습니다."
        };
      }

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as RedditListingResponse;
      for (const child of payload.data?.children ?? []) {
        const post = mapPost(child.data);
        unique.set(post.id, post);
      }
    }

    const posts = Array.from(unique.values()).slice(0, 25);
    return { posts, status: posts.length > 0 ? "available" : "insufficient" };
  } catch {
    return {
      posts: [],
      status: "failed",
      disabledReason: "Reddit API 요청에 실패해 GitHub 데이터 중심으로 분석했습니다."
    };
  }
}

async function getRedditToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID ?? "";
  const clientSecret = process.env.REDDIT_CLIENT_SECRET ?? "";
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetchWithTimeout(
    "https://www.reddit.com/api/v1/access_token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": process.env.REDDIT_USER_AGENT ?? "ai-hype-radar/0.1"
      },
      body: "grant_type=client_credentials"
    },
    REDDIT_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error("Reddit 인증에 실패했습니다.");
  }

  const payload = (await response.json()) as RedditTokenResponse;
  if (!payload.access_token) {
    throw new Error("Reddit access token이 응답에 없습니다.");
  }

  return payload.access_token;
}

function mapPost(post: RedditChildData): RedditPost {
  return {
    id: post.id,
    title: post.title,
    body: post.selftext ?? "",
    subreddit: post.subreddit,
    createdAt: new Date(post.created_utc * 1000).toISOString(),
    score: post.score,
    comments: post.num_comments,
    url: post.url,
    permalink: `https://www.reddit.com${post.permalink}`
  };
}
