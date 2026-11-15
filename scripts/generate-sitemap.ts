import fs from 'node:fs/promises';
import path from 'node:path';
import type { SiteData } from '../src/types/clearworks.ts';
import {
  buildSitemapEntries,
  generateRobotsTxt,
  generateSitemapXml,
  normalizeBaseUrl,
} from '../src/utils/sitemap.ts';

const ROOT_DIR = process.cwd();
const SITE_CONTENT_PATH = path.resolve(ROOT_DIR, 'src/data/siteContent.json');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const SITEMAP_OUT_PATH = path.resolve(PUBLIC_DIR, 'sitemap.xml');
const ROBOTS_OUT_PATH = path.resolve(PUBLIC_DIR, 'robots.txt');

async function main() {
  const raw = await fs.readFile(SITE_CONTENT_PATH, 'utf-8');
  const siteData = JSON.parse(raw) as SiteData;

  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '';
  const vercelPreviewUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';

  const resolvedBaseUrl = normalizeBaseUrl(
    process.env.SITE_URL ||
      siteData.siteUrl ||
      vercelProdUrl ||
      process.env.APP_URL ||
      vercelPreviewUrl ||
      'https://www.clearworks.kr'
  );

  const includeMatrix = process.env.SITEMAP_INCLUDE_MATRIX !== 'false';
  const entries = buildSitemapEntries(siteData, {
    baseUrl: resolvedBaseUrl,
    includeMatrix,
  });
  const xml = generateSitemapXml(siteData, {
    baseUrl: resolvedBaseUrl,
    includeMatrix,
  });
  const robots = generateRobotsTxt(resolvedBaseUrl);

  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.writeFile(SITEMAP_OUT_PATH, xml, 'utf-8');
  await fs.writeFile(ROBOTS_OUT_PATH, robots, 'utf-8');

  console.log(
    `Generated public/sitemap.xml (${entries.length} URLs) and public/robots.txt for ${resolvedBaseUrl}`
  );
}

main().catch((err) => {
  console.error('Failed to generate sitemap.xml:', err);
  process.exit(1);
});
