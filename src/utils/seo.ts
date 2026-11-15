import { INITIAL_SITE_DATA } from '@/src/data/clearworksData';
import type { PageRoute, PageSeoMeta, SiteData } from '@/src/types/clearworks';

export const DEFAULT_HOME_KEYWORDS =
  '유리창청소, 아파트외창청소, 외벽청소, 상가유리창청소, 빌딩외벽청소, 고층유리창청소, 서울유리창청소, 경기유리창청소, 인천유리창청소, 창틀청소, 유리발수코팅, 어닝청소, 클리어웍스';

export function getSeoPageKey(route: PageRoute): string {
  switch (route.type) {
    case 'home':
      return 'home';
    case 'service':
      return `service:${route.serviceId}`;
    case 'region':
      return `region:${route.regionName}`;
    case 'matrix':
      return `matrix:${route.regionName}:${route.serviceId}`;
    case 'gallery_list':
      return 'gallery_list';
    case 'gallery_detail':
      return `gallery_detail:${route.postId}`;
  }
}

export interface ResolvedSeoMeta {
  pageKey: string;
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  routeHash: string;
  jsonLd: Record<string, unknown> | null;
}

export function getDefaultSeoForRoute(
  route: PageRoute,
  siteData: SiteData = INITIAL_SITE_DATA
): ResolvedSeoMeta {
  const { company, hero, services, regions, gallery } = siteData;
  const regionText = company.region.replace(/·/g, ' ');
  const pageKey = getSeoPageKey(route);

  let title = `${regionText} 유리창청소·외벽청소 전문 | ${company.name}`;
  let description = `${company.region} 아파트·상가·빌딩 유리창청소와 건물 외벽청소 전문 ${company.name}. 고층 유리창·외벽 고압세척, 안전한 맞춤 시공과 무료 출장견적을 제공합니다.`;
  let keywords = `${company.name}, ${regionText} 유리창청소, 아파트외창청소, 외벽청소, 상가유리창청소, 빌딩외벽청소`;
  let ogImage = siteData.seo?.defaultOgImage?.trim() || hero.afterImage || '';
  let routeHash = '';
  let jsonLd: Record<string, unknown> | null = null;

  if (route.type === 'service') {
    const service =
      services.items.find((s) => s.id === route.serviceId) ?? services.items[0];
    if (service) {
      title = `${service.title} 전문 | ${company.name}`;
      description = `${service.detail.tagline} ${service.description} ${company.region} 무료 출장 견적.`;
      keywords = `${service.title}, ${company.name}, ${company.region}, 유리창청소, 외벽청소`;
      ogImage =
        siteData.seo?.defaultOgImage?.trim() || service.detail.afterImage || hero.afterImage || '';
      routeHash = `#/service/${service.id}`;
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: service.title,
        description,
        provider: {
          '@type': 'LocalBusiness',
          name: company.name,
          telephone: company.phone,
        },
        areaServed: ['서울특별시', '경기도', '인천광역시'],
      };
    }
  } else if (route.type === 'region') {
    const detail = regions.details[route.regionName];
    title = `${route.regionName} 유리창청소·외창청소 전문 | ${company.name}`;
    description = detail
      ? `${route.regionName}(${detail.subDistricts.slice(0, 5).join(', ')}) ${detail.description}. ${detail.leadTime}.`
      : `${route.regionName} 전지역 아파트 외창·상가 통유리·빌딩 외벽청소 전문 ${company.name}. 당일·익일 무료 출장 견적.`;
    keywords = `${route.regionName} 유리창청소, ${route.regionName} 외창청소, ${route.regionName} 외벽청소, ${company.name}`;
    routeHash = `#/region/${encodeURIComponent(route.regionName)}`;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `${route.regionName} 유리창청소 전문`,
      description,
      areaServed: {
        '@type': 'AdministrativeArea',
        name: route.regionName,
      },
      provider: {
        '@type': 'LocalBusiness',
        name: company.name,
        telephone: company.phone,
      },
    };
  } else if (route.type === 'matrix') {
    const service =
      services.items.find((s) => s.id === route.serviceId) ?? services.items[0];
    if (service) {
      title = `${route.regionName} ${service.title} | ${company.name}`;
      description = `${route.regionName} 전지역 ${service.title} 전문 시공. ${service.detail.tagline}`;
      keywords = `${route.regionName} ${service.title}, ${route.regionName} 유리창청소, ${service.title}, ${company.name}`;
      ogImage =
        siteData.seo?.defaultOgImage?.trim() || service.detail.afterImage || hero.afterImage || '';
      routeHash = `#/region/${encodeURIComponent(route.regionName)}/service/${service.id}`;
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${route.regionName} ${service.title}`,
        description,
        areaServed: route.regionName,
      };
    }
  } else if (route.type === 'gallery_list') {
    title = `현장 작업 갤러리 & 시공사례 | ${company.name}`;
    description =
      '아파트 외창, 상가 통유리, 빌딩 외벽 고소작업, 간판·어닝청소, 썬팅 시트지 제거 실제 시공 일지.';
    keywords = `${company.name} 시공사례, 유리창청소 전후, 외벽청소 후기, 아파트 외창청소 사례`;
    routeHash = '#/gallery';
  } else if (route.type === 'gallery_detail') {
    const post =
      gallery.posts.find((p) => p.id === route.postId) ?? gallery.posts[0];
    if (post) {
      title = `${post.title} | ${company.name}`;
      description = post.excerpt;
      keywords = [...post.tags, post.region, post.category, company.name].join(', ');
      ogImage =
        post.coverImage ||
        post.afterImage ||
        siteData.seo?.defaultOgImage?.trim() ||
        hero.afterImage ||
        '';
      routeHash = `#/gallery/${post.id}`;
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date.replace(/\./g, '-'),
        author: {
          '@type': 'Organization',
          name: company.name,
        },
      };
    }
  } else {
    keywords = DEFAULT_HOME_KEYWORDS.replace(/클리어웍스/g, company.name);
  }

  return {
    pageKey,
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    routeHash,
    jsonLd,
  };
}

export function resolveSeoForRoute(
  route: PageRoute,
  siteData: SiteData = INITIAL_SITE_DATA
): ResolvedSeoMeta {
  const defaults = getDefaultSeoForRoute(route, siteData);
  const override: PageSeoMeta | undefined = siteData.seo?.pages?.[defaults.pageKey];

  const title = override?.title?.trim() || defaults.title;
  const description = override?.description?.trim() || defaults.description;
  const keywords = override?.keywords?.trim() || defaults.keywords;
  const ogTitle = override?.ogTitle?.trim() || title;
  const ogDescription = override?.ogDescription?.trim() || description;
  const ogImage =
    override?.ogImage?.trim() || siteData.seo?.defaultOgImage?.trim() || defaults.ogImage;

  return {
    ...defaults,
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
  };
}

function setMetaTag(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMetaTag(selector: string) {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) el.remove();
}

function setCanonical(url: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setDynamicJsonLd(data: Record<string, unknown> | null) {
  const existing = document.getElementById('ld-dynamic');
  if (existing) existing.remove();
  if (!data) return;

  const script = document.createElement('script');
  script.id = 'ld-dynamic';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function toAbsoluteUrl(urlOrPath: string, origin: string): string {
  const trimmed = urlOrPath.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
  if (!origin) return trimmed;
  return `${origin.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`;
}

export function applySeoForRoute(route: PageRoute, siteData: SiteData = INITIAL_SITE_DATA) {
  const origin =
    siteData.siteUrl?.trim().replace(/\/+$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const resolved = resolveSeoForRoute(route, siteData);

  document.title = resolved.title;
  setMetaTag('meta[name="description"]', 'name', 'description', resolved.description);
  setMetaTag('meta[name="keywords"]', 'name', 'keywords', resolved.keywords);
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', siteData.company.name);
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', resolved.ogTitle);
  setMetaTag(
    'meta[property="og:description"]',
    'property',
    'og:description',
    resolved.ogDescription
  );
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', resolved.ogTitle);
  setMetaTag(
    'meta[name="twitter:description"]',
    'name',
    'twitter:description',
    resolved.ogDescription
  );

  const ogImageUrl = toAbsoluteUrl(resolved.ogImage, origin);
  if (ogImageUrl) {
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImageUrl);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImageUrl);
  } else {
    removeMetaTag('meta[property="og:image"]');
    removeMetaTag('meta[name="twitter:image"]');
  }

  const canonicalUrl = `${origin}${pathname}${resolved.routeHash}`;
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
  setCanonical(canonicalUrl);
  setDynamicJsonLd(resolved.jsonLd);
}

