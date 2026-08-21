import { ApifyClient } from "apify-client";

export function hasApifyToken() {
  return Boolean(process.env.APIFY_TOKEN?.trim());
}

function getClient() {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) throw new Error("APIFY_TOKEN nao configurado.");
  return new ApifyClient({ token });
}

export function googleSearchActorId() {
  return process.env.APIFY_GOOGLE_SEARCH_ACTOR?.trim() || "apify/google-search-scraper";
}

export function websiteCrawlerActorId() {
  return process.env.APIFY_WEBSITE_CRAWLER_ACTOR?.trim() || "apify/website-content-crawler";
}

export type SearchHit = {
  title: string;
  url: string;
  description: string;
};

export type CrawlPage = {
  url: string;
  title: string;
  text: string;
};

export async function runGoogleSearch(queries: string[], maxResults = 6): Promise<SearchHit[]> {
  const client = getClient();
  const run = await client.actor(googleSearchActorId()).call(
    {
      queries: queries.join("\n"),
      maxPagesPerQuery: 1,
      resultsPerPage: Math.min(10, Math.max(3, maxResults)),
      languageCode: "pt-BR",
      countryCode: "br",
    },
    { waitSecs: 90 },
  );

  const { items } = await client.dataset(run.defaultDatasetId!).listItems({ limit: 40 });
  const hits: SearchHit[] = [];

  for (const item of items) {
    const row = item as Record<string, unknown>;
    const organic = Array.isArray(row.organicResults) ? row.organicResults : [];
    if (organic.length) {
      for (const org of organic) {
        const o = org as Record<string, unknown>;
        hits.push({
          title: String(o.title ?? ""),
          url: String(o.url ?? o.link ?? ""),
          description: String(o.description ?? o.snippet ?? ""),
        });
      }
      continue;
    }
    hits.push({
      title: String(row.title ?? row.query ?? ""),
      url: String(row.url ?? row.link ?? ""),
      description: String(row.description ?? row.snippet ?? row.text ?? ""),
    });
  }

  return hits.filter((h) => h.url || h.title || h.description).slice(0, maxResults);
}

export async function crawlWebsite(startUrl: string, maxPages = 8): Promise<CrawlPage[]> {
  const client = getClient();
  let url = startUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  const run = await client.actor(websiteCrawlerActorId()).call(
    {
      startUrls: [{ url }],
      maxCrawlPages: Math.min(10, Math.max(3, maxPages)),
      maxCrawlDepth: 2,
      crawlerType: "cheerio",
    },
    { waitSecs: 90 },
  );

  const { items } = await client.dataset(run.defaultDatasetId!).listItems({ limit: 20 });
  return items
    .map((item) => {
      const row = item as Record<string, unknown>;
      const text = String(row.text ?? row.markdown ?? row.content ?? "").slice(0, 4000);
      return {
        url: String(row.url ?? row.loadedUrl ?? ""),
        title: String(row.title ?? ""),
        text,
      };
    })
    .filter((p) => p.text || p.title)
    .slice(0, maxPages);
}
