import express, { type Request, type Response } from "express";
import { fetchCoreSettings } from "./fetchCoreSettings";
import { getIndexHtml } from "./getIndexHtml";

const CACHE_TTL_MS = 5 * 60 * 1000; 

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const coreSettingsCache: CacheEntry<Record<string, Record<string, string>> | null> = {
  value: null,
  expiresAt: 0,
};

const htmlCache: CacheEntry<string | null> = {
  value: null,
  expiresAt: 0,
};

async function getCoreSettings(): Promise<Record<string, Record<string, string>>> {
  const now = Date.now();

  if (now < coreSettingsCache.expiresAt && coreSettingsCache.value) {
    return coreSettingsCache.value;
  }

  const settings = await fetchCoreSettings();
  coreSettingsCache.value = settings;
  coreSettingsCache.expiresAt = now + CACHE_TTL_MS;

  return settings;
}

async function getHtml(): Promise<string> {
  const now = Date.now();

  if (now < htmlCache.expiresAt && htmlCache.value) {
    return htmlCache.value;
  }

  const coreSettings = await getCoreSettings();
  const html = await getIndexHtml(coreSettings);
  htmlCache.value = html;
  htmlCache.expiresAt = now + CACHE_TTL_MS;

  return html;
}

const app = express();

app.get("*path", async (_req: Request, res: Response) => {
  try {
    const html = await getHtml();
    res.send(html);
  } catch (err) {
    console.error("Failed to generate HTML:", err);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
