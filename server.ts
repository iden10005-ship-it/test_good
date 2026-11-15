import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import type { SiteData } from './src/types/clearworks.ts';
import {
  buildSitemapEntries,
  generateRobotsTxt,
  generateSitemapXml,
  normalizeBaseUrl,
} from './src/utils/sitemap.ts';

function getCliArg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const ROOT_DIR = process.cwd();
const SITE_CONTENT_PATH = path.resolve(ROOT_DIR, 'src/data/siteContent.json');
const INDEX_HTML_PATH = path.resolve(ROOT_DIR, 'index.html');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const SITEMAP_PATH = path.resolve(PUBLIC_DIR, 'sitemap.xml');
const ROBOTS_PATH = path.resolve(PUBLIC_DIR, 'robots.txt');
const UPLOAD_DIR = path.resolve(ROOT_DIR, 'public/uploads');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const cliPort = Number(getCliArg('--port'));
const envPort = Number(process.env.PORT);
const PORT =
  Number.isFinite(cliPort) && cliPort > 0
    ? cliPort
    : process.env.NODE_ENV === 'production' && Number.isFinite(envPort) && envPort > 0
      ? envPort
      : 3000;
const HOST = getCliArg('--host') || '0.0.0.0';

interface SuggestedKeywordItem {
  keyword: string;
  intent: string;
  reason: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 25000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildFallbackKeywordSuggestions(input: {
  pageLabel: string;
  title: string;
  description: string;
  companyName: string;
  region: string;
}): SuggestedKeywordItem[] {
  const regionTokens = input.region
    .split(/[·,\s/]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const primaryRegion = regionTokens[0] || '서울';
  const combined = `${input.pageLabel} ${input.title} ${input.description}`;

  const pool: SuggestedKeywordItem[] = [
    {
      keyword: `${primaryRegion} 유리창청소`,
      intent: '지역검색',
      reason: '구글·네이버 지역 핵심 검색량 최상위 키워드',
    },
    {
      keyword: '아파트 외창청소 비용',
      intent: '롱테일·문의',
      reason: '견적 문의 전환율이 높은 가격 탐색형 키워드',
    },
    {
      keyword: '상가 통유리청소',
      intent: '서비스핵심',
      reason: '매장·카페·오피스 고정 수요 검색어',
    },
    {
      keyword: '고층 외벽청소 업체',
      intent: '서비스핵심',
      reason: '빌딩·오피스텔 B2B 발주 담당자 검색어',
    },
    {
      keyword: `${primaryRegion} 외벽청소`,
      intent: '지역검색',
      reason: '지역명 결합 시 네이버 지도·웹사이트 상위 노출 유리',
    },
    {
      keyword: '창틀 찌든때 청소',
      intent: '롱테일·문의',
      reason: '미세먼지·물때 고민 고객의 세부 유입 키워드',
    },
    {
      keyword: '유리 발수코팅 시공',
      intent: '서비스핵심',
      reason: '객단가 상승 및 추가 옵션 유입 키워드',
    },
    {
      keyword: '유리창청소 무료견적',
      intent: '롱테일·문의',
      reason: '상담 신청 직전 단계 고객이 자주 검색하는 문구',
    },
    {
      keyword: input.companyName || '클리어웍스',
      intent: '브랜드·신뢰',
      reason: '브랜드명 직접 검색 유입 및 상호 신뢰도 강화',
    },
    {
      keyword: '어닝 간판 청소',
      intent: '서비스핵심',
      reason: '상가 점주의 연관 검색 유입 확보',
    },
  ];

  if (combined.includes('썬팅') || combined.includes('스티커')) {
    pool.unshift({
      keyword: '유리창 썬팅 시트지 제거',
      intent: '서비스핵심',
      reason: '상가 원상복구·이전 시즌 검색 수요 집중 키워드',
    });
  }
  if (combined.includes('입주') || combined.includes('이사')) {
    pool.unshift({
      keyword: '입주청소 외창 별도',
      intent: '롱테일·문의',
      reason: '입주·이사 고객의 추가 시공 검색어',
    });
  }

  return pool.slice(0, 10);
}

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function readSiteContent(): Promise<SiteData> {
  const raw = await fs.readFile(SITE_CONTENT_PATH, 'utf-8');
  return JSON.parse(raw) as SiteData;
}

async function writeIfChanged(filePath: string, nextContent: string): Promise<void> {
  try {
    const existing = await fs.readFile(filePath, 'utf-8');
    if (existing === nextContent) return;
  } catch {
    // File doesn't exist yet
  }
  await fs.writeFile(filePath, nextContent, 'utf-8');
}

async function syncIndexHtmlSeo(data: SiteData): Promise<void> {
  try {
    const origHtml = await fs.readFile(INDEX_HTML_PATH, 'utf-8');
    let html = origHtml;
    const { company, hero, services, faq, seo } = data;
    const regionText = company.region.replace(/·/g, ' ');
    const homeSeo = seo?.pages?.home;

    const defaultTitle = `${regionText} 유리창청소·외벽청소 전문 | ${company.name}`;
    const defaultDesc = `${company.region} 아파트·상가·빌딩 유리창청소와 건물 외벽청소 전문 ${company.name}. ${hero.subtitle}`;
    const defaultKeywords = `유리창청소, 아파트외창청소, 외벽청소, 상가유리창청소, 빌딩외벽청소, 고층유리창청소, 서울유리창청소, 경기유리창청소, 인천유리창청소, 창틀청소, 유리발수코팅, 어닝청소, ${company.name}`;

    const seoTitle = homeSeo?.title?.trim() || defaultTitle;
    const seoDesc = homeSeo?.description?.trim() || defaultDesc;
    const seoKeywords = homeSeo?.keywords?.trim() || defaultKeywords;
    const ogTitle = homeSeo?.ogTitle?.trim() || seoTitle;
    const ogDesc = homeSeo?.ogDescription?.trim() || seoDesc;
    const rawOgImage = homeSeo?.ogImage?.trim() || seo?.defaultOgImage?.trim() || '';
    const baseUrl = normalizeBaseUrl(data.siteUrl || process.env.APP_URL || '');
    const ogImage =
      rawOgImage && !/^https?:\/\//i.test(rawOgImage) && baseUrl
        ? `${baseUrl}/${rawOgImage.replace(/^\/+/, '')}`
        : rawOgImage;

    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtmlText(seoTitle)}</title>`);
    html = html.replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      `<meta\n      name="description"\n      content="${escapeHtmlAttr(seoDesc)}"\n    />`
    );
    html = html.replace(
      /<meta\s+name="keywords"[\s\S]*?\/>/,
      `<meta\n      name="keywords"\n      content="${escapeHtmlAttr(seoKeywords)}"\n    />`
    );
    html = html.replace(
      /<meta\s+name="author"\s+content="[^"]*"\s*\/>/,
      `<meta name="author" content="${escapeHtmlAttr(company.name)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:site_name" content="${escapeHtmlAttr(company.name)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${escapeHtmlAttr(ogTitle)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:description"[\s\S]*?\/>/,
      `<meta\n      property="og:description"\n      content="${escapeHtmlAttr(ogDesc)}"\n    />`
    );
    html = html.replace(/\s*<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/g, '');
    if (ogImage) {
      html = html.replace(
        /(<meta\s+property="og:description"[\s\S]*?\/>)/,
        `$1\n    <meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />`
      );
    }

    html = html.replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${escapeHtmlAttr(ogTitle)}" />`
    );
    html = html.replace(
      /<meta\s+name="twitter:description"[\s\S]*?\/>/,
      `<meta\n      name="twitter:description"\n      content="${escapeHtmlAttr(ogDesc)}"\n    />`
    );
    html = html.replace(/\s*<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/g, '');
    if (ogImage) {
      html = html.replace(
        /(<meta\s+name="twitter:description"[\s\S]*?\/>)/,
        `$1\n    <meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}" />`
      );
    }

    const businessLd = {
      '@context': 'https://schema.org',
      '@type': 'HomeAndConstructionBusiness',
      name: company.name,
      description: seoDesc,
      telephone: company.phone,
      priceRange: '₩₩',
      address: {
        '@type': 'PostalAddress',
        streetAddress: company.address,
        addressCountry: 'KR',
      },
      areaServed: [
        { '@type': 'City', name: '서울특별시' },
        { '@type': 'State', name: '경기도' },
        { '@type': 'City', name: '인천광역시' },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '3500',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${company.name} 전문 서비스`,
        itemListElement: services.items.map((srv) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: srv.title },
        })),
      },
    };

    const faqLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.items.slice(0, 8).map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    const businessJson = JSON.stringify(businessLd, null, 2)
      .split('\n')
      .map((line) => `      ${line}`)
      .join('\n');
    const faqJson = JSON.stringify(faqLd, null, 2)
      .split('\n')
      .map((line) => `      ${line}`)
      .join('\n');

    html = html.replace(
      /<script type="application\/ld\+json" id="ld-business">[\s\S]*?<\/script>/,
      `<script type="application/ld+json" id="ld-business">\n${businessJson}\n    </script>`
    );
    html = html.replace(
      /<script type="application\/ld\+json" id="ld-faq">[\s\S]*?<\/script>/,
      `<script type="application/ld+json" id="ld-faq">\n${faqJson}\n    </script>`
    );

    if (html !== origHtml) {
      await fs.writeFile(INDEX_HTML_PATH, html, 'utf-8');
    }
  } catch (err) {
    console.warn('index.html SEO sync skipped:', err);
  }
}

async function writeSitemapFiles(
  data: SiteData,
  overrideBaseUrl?: string,
  includeMatrix = true
): Promise<number> {
  const baseUrl = normalizeBaseUrl(
    overrideBaseUrl || data.siteUrl || process.env.APP_URL || 'https://www.clearworks.kr'
  );
  const entries = buildSitemapEntries(data, { baseUrl, includeMatrix });
  const xml = generateSitemapXml(data, { baseUrl, includeMatrix });
  const robots = generateRobotsTxt(baseUrl);
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await writeIfChanged(SITEMAP_PATH, xml);
  await writeIfChanged(ROBOTS_PATH, robots);
  return entries.length;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Dynamic SEO endpoints for Google & Naver crawlers
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const data = await readSiteContent();
      const requestOrigin = req.get('host')
        ? `${req.protocol}://${req.get('host')}`
        : undefined;
      const baseUrl = normalizeBaseUrl(data.siteUrl || process.env.APP_URL || requestOrigin);
      const xml = generateSitemapXml(data, { baseUrl, includeMatrix: true });
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(xml);
    } catch {
      res.status(500).send('Failed to generate sitemap');
    }
  });

  app.get('/robots.txt', async (req, res) => {
    try {
      const data = await readSiteContent();
      const requestOrigin = req.get('host')
        ? `${req.protocol}://${req.get('host')}`
        : undefined;
      const baseUrl = normalizeBaseUrl(data.siteUrl || process.env.APP_URL || requestOrigin);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(generateRobotsTxt(baseUrl));
    } catch {
      res.status(500).send('User-agent: *\nAllow: /\n');
    }
  });

  // Admin capabilities check
  app.get('/api/admin/capabilities', (_req, res) => {
    res.json({ canWriteCode: true });
  });

  // Read freshest site data from codebase JSON
  app.get('/api/admin/site-data', async (_req, res) => {
    try {
      const data = await readSiteContent();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Read failed' });
    }
  });

  // Save updated site data directly into codebase JSON, index.html SEO & sitemap.xml
  app.post('/api/admin/save-site-data', async (req, res) => {
    try {
      const providedPin = String(req.headers['x-admin-pin'] ?? '');
      const current = await readSiteContent();
      if (!providedPin || providedPin !== current.adminPin) {
        res.status(401).json({ error: '관리자 비밀번호 인증에 실패했습니다.' });
        return;
      }

      const nextData = req.body as SiteData;
      if (!nextData || !nextData.company || !nextData.hero || !nextData.services) {
        res.status(400).json({ error: '유효하지 않은 사이트 데이터입니다.' });
        return;
      }

      await fs.writeFile(SITE_CONTENT_PATH, `${JSON.stringify(nextData, null, 2)}\n`, 'utf-8');
      await syncIndexHtmlSeo(nextData);
      await writeSitemapFiles(nextData);
      res.json({ ok: true, savedAt: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Save failed' });
    }
  });

  // On-demand sitemap.xml & robots.txt regeneration from Admin Settings
  app.post('/api/admin/generate-sitemap', async (req, res) => {
    try {
      const providedPin = String(req.headers['x-admin-pin'] ?? '');
      const current = await readSiteContent();
      if (!providedPin || providedPin !== current.adminPin) {
        res.status(401).json({ error: '관리자 비밀번호 인증에 실패했습니다.' });
        return;
      }

      const { baseUrl, includeMatrix } = req.body as {
        baseUrl?: string;
        includeMatrix?: boolean;
      };
      const normalized = normalizeBaseUrl(baseUrl || current.siteUrl);
      const updated: SiteData = { ...current, siteUrl: normalized };
      await fs.writeFile(SITE_CONTENT_PATH, `${JSON.stringify(updated, null, 2)}\n`, 'utf-8');
      const count = await writeSitemapFiles(updated, normalized, includeMatrix ?? true);
      res.json({ ok: true, count, baseUrl: normalized });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Sitemap failed' });
    }
  });

  // Save uploaded image file directly into public/uploads/
  app.post('/api/admin/upload-image', async (req, res) => {
    try {
      const providedPin = String(req.headers['x-admin-pin'] ?? '');
      const current = await readSiteContent();
      if (!providedPin || providedPin !== current.adminPin) {
        res.status(401).json({ error: '관리자 비밀번호 인증에 실패했습니다.' });
        return;
      }

      const { dataUrl, nameHint } = req.body as { dataUrl?: string; nameHint?: string };
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ error: '이미지 데이터가 없습니다.' });
        return;
      }

      const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
      if (!match) {
        res.status(400).json({ error: '지원되지 않는 이미지 형식입니다.' });
        return;
      }

      const rawExt = match[1].toLowerCase();
      const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
      const base64Data = match[2];
      const safeHint = (nameHint || 'image')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 24) || 'image';

      const filename = `${safeHint}-${Date.now()}.${ext}`;
      const filePath = path.resolve(UPLOAD_DIR, filename);
      await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));

      res.json({ ok: true, url: `/uploads/${filename}` });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Upload failed' });
    }
  });

  // Suggest competitive Google & Naver SEO keywords using Gemini API
  app.post('/api/admin/suggest-seo-keywords', async (req, res) => {
    try {
      const providedPin = String(req.headers['x-admin-pin'] ?? '');
      const current = await readSiteContent();
      if (!providedPin || providedPin !== current.adminPin) {
        res.status(401).json({ error: '관리자 비밀번호 인증에 실패했습니다.' });
        return;
      }

      const {
        pageKey = 'home',
        pageLabel = '메인 페이지',
        title = '',
        description = '',
        existingKeywords = '',
        companyName = current.company.name,
        region = current.company.region,
      } = (req.body || {}) as {
        pageKey?: string;
        pageLabel?: string;
        title?: string;
        description?: string;
        existingKeywords?: string;
        companyName?: string;
        region?: string;
      };

      const ai = getGeminiClient();
      if (!ai) {
        res.json({
          ok: true,
          source: 'smart-local',
          suggestions: buildFallbackKeywordSuggestions({
            pageLabel,
            title,
            description,
            companyName,
            region,
          }),
        });
        return;
      }

      const prompt = [
        '당신은 한국 시장(구글 SEO & 네이버 검색 최적화) 전문 디지털 마케터입니다.',
        '아래 웹페이지의 제목, 설명, 업체 정보를 분석하여 검색 노출 경쟁력과 문의 전환율을 높일 수 있는 추천 키워드 10개를 제안해 주세요.',
        '',
        `- 페이지 식별자: ${pageKey}`,
        `- 페이지 구분: ${pageLabel}`,
        `- 업체명: ${companyName}`,
        `- 서비스 지역: ${region}`,
        `- 현재 페이지 제목: ${title}`,
        `- 현재 메타 설명: ${description}`,
        `- 기존 키워드: ${existingKeywords || '없음'}`,
        '',
        '규칙:',
        '1. 한국어 실제 검색어(구글·네이버 사용자 검색 의도 반영)로 작성하세요.',
        '2. 2~5단어 이내의 간결한 키워드만 제안하세요.',
        '3. intent는 반드시 "지역검색", "서비스핵심", "롱테일·문의", "브랜드·신뢰" 중 하나를 사용하세요.',
        '4. reason은 왜 이 키워드가 구글·네이버에서 경쟁력이 있는지 1문장으로 설명하세요.',
        '5. 중복되지 않는 10개를 반환하세요.',
      ].join('\n');

      const requestConfig = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING, description: '추천 SEO 키워드' },
                  intent: {
                    type: Type.STRING,
                    description: '검색 의도 (지역검색, 서비스핵심, 롱테일·문의, 브랜드·신뢰 중 택1)',
                  },
                  reason: {
                    type: Type.STRING,
                    description: '구글·네이버 검색 경쟁력 및 추천 사유',
                  },
                },
              },
            },
          },
        },
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: requestConfig,
        });
      } catch (primaryErr) {
        const primaryMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        if (
          primaryMsg.includes('503') ||
          primaryMsg.includes('504') ||
          primaryMsg.includes('UNAVAILABLE') ||
          primaryMsg.includes('DEADLINE_EXCEEDED')
        ) {
          await new Promise((r) => setTimeout(r, 500));
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: requestConfig,
          });
        } else {
          throw primaryErr;
        }
      }

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as { suggestions?: SuggestedKeywordItem[] };
      const cleaned = Array.isArray(parsed.suggestions)
        ? parsed.suggestions
            .filter((item) => item && typeof item.keyword === 'string' && item.keyword.trim())
            .slice(0, 12)
        : [];

      res.json({
        ok: true,
        source: 'gemini',
        suggestions:
          cleaned.length > 0
            ? cleaned
            : buildFallbackKeywordSuggestions({
                pageLabel,
                title,
                description,
                companyName,
                region,
              }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '키워드 추천 중 오류가 발생했습니다.';
      res.status(502).json({ error: `AI 키워드 추천 실패: ${msg}` });
    }
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const viteReady = (async () => {
      const { createServer: createViteServer } = await import('vite');
      return createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
        },
        appType: 'spa',
      });
    })();

    viteReady.catch((err) => {
      console.error('Failed to initialize Vite dev middleware:', err);
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await viteReady;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    app.use(express.static(DIST_DIR));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(DIST_DIR, 'index.html'));
    });
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`Clearworks server listening on http://${HOST}:${PORT}`);
  });
}

startServer();
