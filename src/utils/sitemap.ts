import type { SiteData } from '../types/clearworks.ts';

export type SitemapChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: SitemapChangeFreq;
  priority?: string;
}

export interface SitemapOptions {
  baseUrl?: string;
  lastmod?: string;
  includeMatrix?: boolean;
}

const DEFAULT_BASE_URL = 'https://www.clearworks.kr';

export function normalizeBaseUrl(rawUrl?: string): string {
  const candidate = (rawUrl ?? '').trim();
  if (!candidate) return DEFAULT_BASE_URL;
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  return withProtocol.replace(/\/+$/, '');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatPostLastmod(dateStr?: string, fallback?: string): string | undefined {
  if (!dateStr) return fallback;
  const normalized = dateStr.trim().replace(/\./g, '-');
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }
  return fallback;
}

export function buildSitemapEntries(
  siteData: SiteData,
  options: SitemapOptions = {}
): SitemapUrlEntry[] {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? siteData.siteUrl);
  const defaultLastmod = options.lastmod ?? new Date().toISOString().slice(0, 10);
  const includeMatrix = options.includeMatrix ?? true;

  const entries: SitemapUrlEntry[] = [];
  const seen = new Set<string>();

  const pushEntry = (entry: SitemapUrlEntry) => {
    if (seen.has(entry.loc)) return;
    seen.add(entry.loc);
    entries.push(entry);
  };

  // 1. Main landing page
  pushEntry({
    loc: `${baseUrl}/`,
    lastmod: defaultLastmod,
    changefreq: 'weekly',
    priority: '1.0',
  });

  // 2. Gallery list page
  pushEntry({
    loc: `${baseUrl}/#/gallery`,
    lastmod: defaultLastmod,
    changefreq: 'weekly',
    priority: '0.8',
  });

  // 3. Individual service detail pages
  for (const service of siteData.services.items) {
    pushEntry({
      loc: `${baseUrl}/#/service/${encodeURIComponent(service.id)}`,
      lastmod: defaultLastmod,
      changefreq: 'monthly',
      priority: '0.9',
    });
  }

  // 4. Individual gallery field log pages
  for (const post of siteData.gallery.posts) {
    pushEntry({
      loc: `${baseUrl}/#/gallery/${encodeURIComponent(post.id)}`,
      lastmod: formatPostLastmod(post.date, defaultLastmod),
      changefreq: 'monthly',
      priority: '0.8',
    });
  }

  // 5. Regional SEO landing pages
  for (const region of siteData.regions.list) {
    pushEntry({
      loc: `${baseUrl}/#/region/${encodeURIComponent(region)}`,
      lastmod: defaultLastmod,
      changefreq: 'monthly',
      priority: '0.7',
    });
  }

  // 6. Region x Service combination pages
  if (includeMatrix) {
    for (const region of siteData.regions.list) {
      for (const service of siteData.services.items) {
        pushEntry({
          loc: `${baseUrl}/#/region/${encodeURIComponent(region)}/service/${encodeURIComponent(service.id)}`,
          lastmod: defaultLastmod,
          changefreq: 'monthly',
          priority: '0.6',
        });
      }
    }
  }

  return entries;
}

export function generateSitemapXml(siteData: SiteData, options: SitemapOptions = {}): string {
  const entries = buildSitemapEntries(siteData, options);

  const urlNodes = entries
    .map((entry) => {
      const lines = [`  <url>`, `    <loc>${escapeXml(entry.loc)}</loc>`];
      if (entry.lastmod) {
        lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      }
      if (entry.changefreq) {
        lines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`);
      }
      if (entry.priority) {
        lines.push(`    <priority>${escapeXml(entry.priority)}</priority>`);
      }
      lines.push(`  </url>`);
      return lines.join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>\n`;
}

export function generateRobotsTxt(baseUrl?: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  return [
    'User-agent: Yeti',
    'Allow: /',
    '',
    'User-agent: Googlebot',
    'Allow: /',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${normalized}/sitemap.xml`,
    '',
  ].join('\n');
}
