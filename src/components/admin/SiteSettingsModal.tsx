import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  Globe,
  Image as ImageIcon,
  LayoutList,
  Loader2,
  Lock,
  Monitor,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings,
  Share2,
  Smartphone,
  Sparkles,
  Tag,
  Upload,
  X,
} from 'lucide-react';
import type { PageRoute, PageSeoMeta, SeoSettings, SiteData } from '@/src/types/clearworks';
import { resolveAssetUrl } from '@/src/utils/assetUrl';
import { getDefaultSeoForRoute, getSeoPageKey } from '@/src/utils/seo';
import {
  buildSitemapEntries,
  generateRobotsTxt,
  generateSitemapXml,
  normalizeBaseUrl,
} from '@/src/utils/sitemap';

interface SaveResult {
  ok: boolean;
  error?: string;
}

export interface SeoKeywordSuggestion {
  keyword: string;
  intent: string;
  reason: string;
}

export interface SuggestKeywordsResult {
  ok: boolean;
  source?: string;
  suggestions?: SeoKeywordSuggestion[];
  error?: string;
}

type ModalTab = 'general' | 'content' | 'seo' | 'preview';
type ContentCategory = 'hero' | 'services' | 'sections' | 'trust';
type SeoCategory = 'core' | 'service' | 'region' | 'matrix' | 'gallery';

interface SiteSettingsModalProps {
  isOpen: boolean;
  siteData: SiteData;
  currentRoute?: PageRoute;
  canWriteCode?: boolean;
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onSuggestSeoKeywords?: (payload: {
    pageKey: string;
    pageLabel: string;
    title: string;
    description: string;
    existingKeywords: string;
    companyName: string;
    region: string;
  }) => Promise<SuggestKeywordsResult>;
  onSaveSettings: (nextData: SiteData) => Promise<SaveResult>;
  onGenerateSitemap?: (
    baseUrl: string,
    includeMatrix: boolean
  ) => Promise<{ ok: boolean; count?: number; error?: string }>;
  onClose: () => void;
  onUpdateSiteData: React.Dispatch<React.SetStateAction<SiteData>>;
  onResetDefaults: () => void;
}

function cleanSeoSettings(seo: SeoSettings): SeoSettings | undefined {
  const cleanedPages: Record<string, PageSeoMeta> = {};
  for (const [key, val] of Object.entries(seo.pages)) {
    if (!val) continue;
    const next: PageSeoMeta = {};
    if (val.title?.trim()) next.title = val.title.trim();
    if (val.description?.trim()) next.description = val.description.trim();
    if (val.keywords?.trim()) next.keywords = val.keywords.trim();
    if (val.ogTitle?.trim()) next.ogTitle = val.ogTitle.trim();
    if (val.ogDescription?.trim()) next.ogDescription = val.ogDescription.trim();
    if (val.ogImage?.trim()) next.ogImage = val.ogImage.trim();
    if (Object.keys(next).length > 0) {
      cleanedPages[key] = next;
    }
  }
  const defaultOgImage = seo.defaultOgImage?.trim() || '';
  if (!defaultOgImage && Object.keys(cleanedPages).length === 0) {
    return undefined;
  }
  return {
    ...(defaultOgImage ? { defaultOgImage } : {}),
    pages: cleanedPages,
  };
}

function getCategoryFromRoute(route?: PageRoute): SeoCategory {
  if (!route) return 'core';
  if (route.type === 'service') return 'service';
  if (route.type === 'region') return 'region';
  if (route.type === 'matrix') return 'matrix';
  if (route.type === 'gallery_detail') return 'gallery';
  return 'core';
}

function hasCustomMeta(meta?: PageSeoMeta): boolean {
  if (!meta) return false;
  return Boolean(
    meta.title?.trim() ||
      meta.description?.trim() ||
      meta.keywords?.trim() ||
      meta.ogTitle?.trim() ||
      meta.ogDescription?.trim() ||
      meta.ogImage?.trim()
  );
}

export const SiteSettingsModal: React.FC<SiteSettingsModalProps> = ({
  isOpen,
  siteData,
  currentRoute,
  canWriteCode = false,
  onUploadImage,
  onSuggestSeoKeywords,
  onSaveSettings,
  onGenerateSitemap,
  onClose,
  onUpdateSiteData,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('general');
  const [contentCategory, setContentCategory] = useState<ContentCategory>('hero');

  const [draftCompany, setDraftCompany] = useState<SiteData['company']>(siteData.company);
  const [draftHero, setDraftHero] = useState<SiteData['hero']>(siteData.hero);
  const [draftServices, setDraftServices] = useState<SiteData['services']>(siteData.services);
  const [draftProcess, setDraftProcess] = useState<SiteData['process']>(siteData.process);
  const [draftPricing, setDraftPricing] = useState<SiteData['pricing']>(siteData.pricing);
  const [draftRegionsMeta, setDraftRegionsMeta] = useState<{
    sectionTitle: string;
    sectionSubtitle: string;
  }>({
    sectionTitle: siteData.regions.sectionTitle,
    sectionSubtitle: siteData.regions.sectionSubtitle,
  });
  const [draftGalleryMeta, setDraftGalleryMeta] = useState<{
    sectionTitle: string;
    sectionSubtitle: string;
  }>({
    sectionTitle: siteData.gallery.sectionTitle,
    sectionSubtitle: siteData.gallery.sectionSubtitle,
  });
  const [draftReviewsMeta, setDraftReviewsMeta] = useState<{
    sectionTitle: string;
    sectionSubtitle: string;
  }>({
    sectionTitle: siteData.reviews.sectionTitle,
    sectionSubtitle: siteData.reviews.sectionSubtitle,
  });
  const [draftFaq, setDraftFaq] = useState<SiteData['faq']>(siteData.faq);
  const [draftContactForm, setDraftContactForm] = useState<SiteData['contactForm']>(
    siteData.contactForm
  );
  const [draftPin, setDraftPin] = useState<string>(siteData.adminPin);
  const [draftSiteUrl, setDraftSiteUrl] = useState<string>(siteData.siteUrl ?? '');
  const [draftSeo, setDraftSeo] = useState<SeoSettings>(
    siteData.seo ?? { defaultOgImage: '', pages: {} }
  );

  // SEO Tab selection states
  const [seoCategory, setSeoCategory] = useState<SeoCategory>(() =>
    getCategoryFromRoute(currentRoute)
  );
  const [selectedCoreKey, setSelectedCoreKey] = useState<'home' | 'gallery_list'>('home');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    siteData.services.items[0]?.id ?? 'apt'
  );
  const [selectedRegionName, setSelectedRegionName] = useState<string>(
    siteData.regions.list[0] ?? ''
  );
  const [selectedMatrixRegion, setSelectedMatrixRegion] = useState<string>(
    siteData.regions.list[0] ?? ''
  );
  const [selectedMatrixServiceId, setSelectedMatrixServiceId] = useState<string>(
    siteData.services.items[0]?.id ?? 'apt'
  );
  const [selectedGalleryPostId, setSelectedGalleryPostId] = useState<string>(
    siteData.gallery.posts[0]?.id ?? ''
  );
  const [uploadingOgImage, setUploadingOgImage] = useState<'global' | 'page' | null>(null);

  // Keyword suggestions & preview states
  const [suggestingKeywords, setSuggestingKeywords] = useState(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState<SeoKeywordSuggestion[]>([]);
  const [keywordSuggestionSource, setKeywordSuggestionSource] = useState<string>('');
  const [keywordSuggestionError, setKeywordSuggestionError] = useState<string>('');
  const [googlePreviewDevice, setGooglePreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [copiedCodeJson, setCopiedCodeJson] = useState(false);

  const [importError, setImportError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [includeMatrix, setIncludeMatrix] = useState(true);
  const [sitemapMessage, setSitemapMessage] = useState('');
  const [generatingSitemap, setGeneratingSitemap] = useState(false);

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setDraftCompany(siteData.company);
      setDraftHero({
        ...siteData.hero,
        stats: siteData.hero.stats.map((s) => ({ ...s })),
      });
      setDraftServices({
        ...siteData.services,
        items: siteData.services.items.map((item) => ({
          ...item,
          detail: { ...item.detail },
        })),
      });
      setDraftProcess({
        ...siteData.process,
        steps: siteData.process.steps.map((st) => ({ ...st })),
      });
      setDraftPricing({
        ...siteData.pricing,
        rows: siteData.pricing.rows.map((r) => ({ ...r })),
      });
      setDraftRegionsMeta({
        sectionTitle: siteData.regions.sectionTitle,
        sectionSubtitle: siteData.regions.sectionSubtitle,
      });
      setDraftGalleryMeta({
        sectionTitle: siteData.gallery.sectionTitle,
        sectionSubtitle: siteData.gallery.sectionSubtitle,
      });
      setDraftReviewsMeta({
        sectionTitle: siteData.reviews.sectionTitle,
        sectionSubtitle: siteData.reviews.sectionSubtitle,
      });
      setDraftFaq({
        ...siteData.faq,
        items: siteData.faq.items.map((f) => ({ ...f })),
      });
      setDraftContactForm({ ...siteData.contactForm });
      setDraftPin(siteData.adminPin);
      setDraftSiteUrl(siteData.siteUrl ?? '');
      setDraftSeo({
        defaultOgImage: siteData.seo?.defaultOgImage ?? '',
        pages: { ...(siteData.seo?.pages ?? {}) },
      });
      setIsDirty(false);
      setSaveMessage('');
      setSaveError('');
      setCopiedCodeJson(false);
      setImportError('');
      setConfirmReset(false);
      setKeywordSuggestions([]);
      setKeywordSuggestionError('');
      setKeywordSuggestionSource('');

      // Sync active SEO selector to current route when opening
      if (currentRoute) {
        setSeoCategory(getCategoryFromRoute(currentRoute));
        if (currentRoute.type === 'gallery_list') {
          setSelectedCoreKey('gallery_list');
        } else if (currentRoute.type === 'home') {
          setSelectedCoreKey('home');
        } else if (currentRoute.type === 'service') {
          setSelectedServiceId(currentRoute.serviceId);
        } else if (currentRoute.type === 'region') {
          setSelectedRegionName(currentRoute.regionName);
        } else if (currentRoute.type === 'matrix') {
          setSelectedMatrixRegion(currentRoute.regionName);
          setSelectedMatrixServiceId(currentRoute.serviceId);
        } else if (currentRoute.type === 'gallery_detail') {
          setSelectedGalleryPostId(currentRoute.postId);
        }
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, siteData, currentRoute]);

  const effectiveSiteUrl =
    draftSiteUrl.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://www.clearworks.kr');

  const draftPreviewData = useMemo<SiteData>(
    () => ({
      ...siteData,
      company: draftCompany,
      hero: draftHero,
      services: draftServices,
      process: draftProcess,
      pricing: draftPricing,
      regions: {
        ...siteData.regions,
        sectionTitle: draftRegionsMeta.sectionTitle,
        sectionSubtitle: draftRegionsMeta.sectionSubtitle,
      },
      gallery: {
        ...siteData.gallery,
        sectionTitle: draftGalleryMeta.sectionTitle,
        sectionSubtitle: draftGalleryMeta.sectionSubtitle,
      },
      reviews: {
        ...siteData.reviews,
        sectionTitle: draftReviewsMeta.sectionTitle,
        sectionSubtitle: draftReviewsMeta.sectionSubtitle,
      },
      faq: draftFaq,
      contactForm: draftContactForm,
      adminPin: draftPin.trim() || siteData.adminPin,
      siteUrl: draftSiteUrl.trim() || undefined,
      seo: cleanSeoSettings(draftSeo),
    }),
    [
      siteData,
      draftCompany,
      draftHero,
      draftServices,
      draftProcess,
      draftPricing,
      draftRegionsMeta,
      draftGalleryMeta,
      draftReviewsMeta,
      draftFaq,
      draftContactForm,
      draftPin,
      draftSiteUrl,
      draftSeo,
    ]
  );

  const sitemapUrlCount = useMemo(
    () =>
      buildSitemapEntries(draftPreviewData, {
        baseUrl: effectiveSiteUrl,
        includeMatrix,
      }).length,
    [draftPreviewData, effectiveSiteUrl, includeMatrix]
  );

  const selectedRoute = useMemo<PageRoute>(() => {
    switch (seoCategory) {
      case 'core':
        return selectedCoreKey === 'gallery_list' ? { type: 'gallery_list' } : { type: 'home' };
      case 'service':
        return {
          type: 'service',
          serviceId: selectedServiceId || siteData.services.items[0]?.id || 'apt',
        };
      case 'region':
        return {
          type: 'region',
          regionName: selectedRegionName || siteData.regions.list[0] || '서울 강남구',
        };
      case 'matrix':
        return {
          type: 'matrix',
          regionName: selectedMatrixRegion || siteData.regions.list[0] || '서울 강남구',
          serviceId: selectedMatrixServiceId || siteData.services.items[0]?.id || 'apt',
        };
      case 'gallery':
        return {
          type: 'gallery_detail',
          postId: selectedGalleryPostId || siteData.gallery.posts[0]?.id || '',
        };
    }
  }, [
    seoCategory,
    selectedCoreKey,
    selectedServiceId,
    selectedRegionName,
    selectedMatrixRegion,
    selectedMatrixServiceId,
    selectedGalleryPostId,
    siteData.services.items,
    siteData.regions.list,
    siteData.gallery.posts,
  ]);

  const selectedPageKey = useMemo(() => getSeoPageKey(selectedRoute), [selectedRoute]);
  const selectedDefaults = useMemo(
    () => getDefaultSeoForRoute(selectedRoute, draftPreviewData),
    [selectedRoute, draftPreviewData]
  );

  const currentOverride: PageSeoMeta = draftSeo.pages[selectedPageKey] ?? {};

  const customPageEntries = useMemo(
    () => Object.entries(draftSeo.pages).filter(([, meta]) => hasCustomMeta(meta)),
    [draftSeo.pages]
  );

  if (!isOpen) return null;

  const updateDraftCompany = (field: keyof SiteData['company'], val: string) => {
    setDraftCompany((prev) => ({ ...prev, [field]: val }));
    setIsDirty(true);
    setSaveMessage('');
    setSaveError('');
  };

  const updatePageSeoField = (field: keyof PageSeoMeta, val: string) => {
    setDraftSeo((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [selectedPageKey]: {
          ...(prev.pages[selectedPageKey] ?? {}),
          [field]: val,
        },
      },
    }));
    setIsDirty(true);
    setSaveMessage('');
    setSaveError('');
  };

  const handleResetPageSeo = () => {
    setDraftSeo((prev) => {
      const nextPages = { ...prev.pages };
      delete nextPages[selectedPageKey];
      return { ...prev, pages: nextPages };
    });
    setIsDirty(true);
    setSaveMessage('');
    setSaveError('');
  };

  const handleJumpToPageKey = (key: string) => {
    if (key === 'home') {
      setSeoCategory('core');
      setSelectedCoreKey('home');
    } else if (key === 'gallery_list') {
      setSeoCategory('core');
      setSelectedCoreKey('gallery_list');
    } else if (key.startsWith('service:')) {
      setSeoCategory('service');
      setSelectedServiceId(key.slice('service:'.length));
    } else if (key.startsWith('region:')) {
      setSeoCategory('region');
      setSelectedRegionName(key.slice('region:'.length));
    } else if (key.startsWith('gallery_detail:')) {
      setSeoCategory('gallery');
      setSelectedGalleryPostId(key.slice('gallery_detail:'.length));
    } else if (key.startsWith('matrix:')) {
      const rest = key.slice('matrix:'.length);
      const lastColon = rest.lastIndexOf(':');
      if (lastColon > 0) {
        setSeoCategory('matrix');
        setSelectedMatrixRegion(rest.slice(0, lastColon));
        setSelectedMatrixServiceId(rest.slice(lastColon + 1));
      }
    }
  };

  const getPageKeyDisplayLabel = (key: string): string => {
    if (key === 'home') return '메인 페이지';
    if (key === 'gallery_list') return '갤러리 목록';
    if (key.startsWith('service:')) {
      const id = key.slice('service:'.length);
      return siteData.services.items.find((s) => s.id === id)?.title || `서비스 (${id})`;
    }
    if (key.startsWith('region:')) {
      return `지역 · ${key.slice('region:'.length)}`;
    }
    if (key.startsWith('gallery_detail:')) {
      const id = key.slice('gallery_detail:'.length);
      return siteData.gallery.posts.find((p) => p.id === id)?.title || `시공사례 (${id})`;
    }
    if (key.startsWith('matrix:')) {
      const rest = key.slice('matrix:'.length);
      const lastColon = rest.lastIndexOf(':');
      if (lastColon > 0) {
        const reg = rest.slice(0, lastColon);
        const srvId = rest.slice(lastColon + 1);
        const srvTitle = siteData.services.items.find((s) => s.id === srvId)?.title || srvId;
        return `${reg} × ${srvTitle}`;
      }
    }
    return key;
  };

  const handleOgFileUpload = (
    target: 'global' | 'page',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingOgImage(target);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || '');
      let finalUrl = dataUrl;
      if (onUploadImage) {
        finalUrl = await onUploadImage(dataUrl, `og-${target}`);
      }
      if (target === 'global') {
        setDraftSeo((prev) => ({ ...prev, defaultOgImage: finalUrl }));
        setIsDirty(true);
        setSaveMessage('');
        setSaveError('');
      } else {
        updatePageSeoField('ogImage', finalUrl);
      }
      setUploadingOgImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async (closeAfterSave = false) => {
    const trimmedPin = draftPin.trim();
    if (!trimmedPin) {
      setSaveError('관리자 비밀번호는 비워둘 수 없습니다.');
      setSaveMessage('');
      return;
    }

    const cleanedSeo = cleanSeoSettings(draftSeo);

    const nextData: SiteData = {
      ...siteData,
      company: {
        ...draftCompany,
        name: draftCompany.name.trim() || siteData.company.name,
        region: draftCompany.region.trim() || siteData.company.region,
        phone: draftCompany.phone.trim(),
        kakaoLink: draftCompany.kakaoLink.trim(),
        representative: draftCompany.representative.trim(),
        bizNumber: draftCompany.bizNumber.trim(),
        operatingHours: draftCompany.operatingHours.trim(),
        address: draftCompany.address.trim(),
      },
      hero: {
        ...draftHero,
        title: draftHero.title.trim() || siteData.hero.title,
        stats: draftHero.stats.map((stat) => ({
          ...stat,
          value: stat.value.trim() || stat.value,
          label: stat.label.trim() || stat.label,
        })),
      },
      services: {
        ...draftServices,
        sectionTitle: draftServices.sectionTitle.trim() || siteData.services.sectionTitle,
      },
      process: draftProcess,
      pricing: draftPricing,
      regions: {
        ...siteData.regions,
        sectionTitle: draftRegionsMeta.sectionTitle.trim() || siteData.regions.sectionTitle,
        sectionSubtitle:
          draftRegionsMeta.sectionSubtitle.trim() || siteData.regions.sectionSubtitle,
      },
      gallery: {
        ...siteData.gallery,
        sectionTitle: draftGalleryMeta.sectionTitle.trim() || siteData.gallery.sectionTitle,
        sectionSubtitle:
          draftGalleryMeta.sectionSubtitle.trim() || siteData.gallery.sectionSubtitle,
      },
      reviews: {
        ...siteData.reviews,
        sectionTitle: draftReviewsMeta.sectionTitle.trim() || siteData.reviews.sectionTitle,
        sectionSubtitle:
          draftReviewsMeta.sectionSubtitle.trim() || siteData.reviews.sectionSubtitle,
      },
      faq: draftFaq,
      contactForm: draftContactForm,
      adminPin: trimmedPin,
      siteUrl: draftSiteUrl.trim() ? normalizeBaseUrl(draftSiteUrl.trim()) : undefined,
      seo: cleanedSeo,
    };

    setSaving(true);
    setSaveError('');
    setSaveMessage('');

    const result = await onSaveSettings(nextData);
    setSaving(false);

    if (!result.ok) {
      setSaveError(result.error || '저장에 실패했습니다. 다시 시도해 주세요.');
      return;
    }

    setDraftCompany(nextData.company);
    setDraftHero({
      ...nextData.hero,
      stats: nextData.hero.stats.map((s) => ({ ...s })),
    });
    setDraftServices({
      ...nextData.services,
      items: nextData.services.items.map((item) => ({
        ...item,
        detail: { ...item.detail },
      })),
    });
    setDraftProcess({
      ...nextData.process,
      steps: nextData.process.steps.map((st) => ({ ...st })),
    });
    setDraftPricing({
      ...nextData.pricing,
      rows: nextData.pricing.rows.map((r) => ({ ...r })),
    });
    setDraftRegionsMeta({
      sectionTitle: nextData.regions.sectionTitle,
      sectionSubtitle: nextData.regions.sectionSubtitle,
    });
    setDraftGalleryMeta({
      sectionTitle: nextData.gallery.sectionTitle,
      sectionSubtitle: nextData.gallery.sectionSubtitle,
    });
    setDraftReviewsMeta({
      sectionTitle: nextData.reviews.sectionTitle,
      sectionSubtitle: nextData.reviews.sectionSubtitle,
    });
    setDraftFaq({
      ...nextData.faq,
      items: nextData.faq.items.map((f) => ({ ...f })),
    });
    setDraftContactForm({ ...nextData.contactForm });
    setDraftPin(nextData.adminPin);
    setDraftSiteUrl(nextData.siteUrl ?? '');
    setDraftSeo(nextData.seo ?? { defaultOgImage: '', pages: {} });
    setIsDirty(false);

    if (closeAfterSave) {
      onClose();
      return;
    }

    setSaveMessage(
      canWriteCode
        ? '설정이 프리뷰 서버에 저장되었습니다. (GitHub 동기화는 아래 코드 복사를 참고하세요)'
        : '설정 및 페이지별 SEO 정보가 저장되었습니다.'
    );
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(draftPreviewData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clearworks-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.company || !parsed.hero || !parsed.services) {
          setImportError('올바른 클리어웍스 백업 JSON 파일이 아닙니다.');
          return;
        }
        onUpdateSiteData(parsed);
        onClose();
      } catch {
        setImportError('JSON 파일을 해석하는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  // Resolved preview strings for currently selected page in SEO tab
  const resolvedTitle = currentOverride.title?.trim() || selectedDefaults.title;
  const resolvedDescription =
    currentOverride.description?.trim() || selectedDefaults.description;
  const resolvedKeywords = currentOverride.keywords?.trim() || selectedDefaults.keywords;
  const resolvedOgTitle = currentOverride.ogTitle?.trim() || resolvedTitle;
  const resolvedOgDescription =
    currentOverride.ogDescription?.trim() || resolvedDescription;
  const resolvedOgImage =
    currentOverride.ogImage?.trim() ||
    draftSeo.defaultOgImage?.trim() ||
    selectedDefaults.ogImage;

  const parsedKeywords = resolvedKeywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  const previewUrlDisplay = `${effectiveSiteUrl.replace(/\/+$/, '')}${
    selectedDefaults.routeHash ? `/${selectedDefaults.routeHash}` : ''
  }`;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                사이트 기본 정보 &amp; SEO 설정
              </h3>
              <p className="text-xs text-slate-500">
                수정 후 &lsquo;수정하기&rsquo; 또는 하단 &lsquo;확인 (저장 후 닫기)&rsquo; 버튼을 눌러 적용하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="설정 창 닫기"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 py-3 border-b border-slate-100 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'general'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>기본 정보 · 백업</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'content'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>콘텐츠 · 섹션 관리</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'seo'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>SEO 설정</span>
            {customPageEntries.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums ${
                  activeTab === 'seo'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {customPageEntries.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'preview'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>SEO 미리보기</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 space-y-5 pr-1">
          {activeTab === 'general' ? (
            <>
              {/* Company Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    업체 기본 정보
                  </h4>
                  {isDirty && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      수정 중 (저장 필요)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">상호명</label>
                    <input
                      type="text"
                      value={draftCompany.name}
                      onChange={(e) => updateDraftCompany('name', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      서비스 대표 지역
                    </label>
                    <input
                      type="text"
                      value={draftCompany.region}
                      onChange={(e) => updateDraftCompany('region', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      대표 전화번호
                    </label>
                    <input
                      type="text"
                      value={draftCompany.phone}
                      onChange={(e) => updateDraftCompany('phone', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      카카오톡 상담 링크
                    </label>
                    <input
                      type="text"
                      value={draftCompany.kakaoLink}
                      onChange={(e) => updateDraftCompany('kakaoLink', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">대표자명</label>
                    <input
                      type="text"
                      value={draftCompany.representative}
                      onChange={(e) => updateDraftCompany('representative', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      사업자등록번호
                    </label>
                    <input
                      type="text"
                      value={draftCompany.bizNumber}
                      onChange={(e) => updateDraftCompany('bizNumber', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">운영시간</label>
                    <input
                      type="text"
                      value={draftCompany.operatingHours}
                      onChange={(e) => updateDraftCompany('operatingHours', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      사업장 주소
                    </label>
                    <input
                      type="text"
                      value={draftCompany.address}
                      onChange={(e) => updateDraftCompany('address', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Main Hero Stats & Key Section Headings */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        메인 핵심 지표 · 섹션 문구 (누적 시공 · 경력 등)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        더 많은 섹션·서비스 카드 문구는 상단 &lsquo;콘텐츠 · 섹션 관리&rsquo; 탭에서 카테고리별로 수정하세요.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('content')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                    >
                      전체 콘텐츠 관리 →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {draftHero.stats.map((stat, idx) => (
                      <div
                        key={stat.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                      >
                        <span className="block text-[10px] font-extrabold text-slate-400">
                          지표 카드 {idx + 1}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftHero((prev) => ({
                                ...prev,
                                stats: prev.stats.map((s) =>
                                  s.id === stat.id ? { ...s, value: val } : s
                                ),
                              }));
                              setIsDirty(true);
                              setSaveMessage('');
                              setSaveError('');
                            }}
                            placeholder="수치 (예: 2,500건+)"
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={stat.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftHero((prev) => ({
                                ...prev,
                                stats: prev.stats.map((s) =>
                                  s.id === stat.id ? { ...s, label: val } : s
                                ),
                              }));
                              setIsDirty(true);
                              setSaveMessage('');
                              setSaveError('');
                            }}
                            placeholder="라벨 (예: 누적 시공)"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        메인 히어로 제목
                      </label>
                      <textarea
                        rows={2}
                        value={draftHero.title}
                        onChange={(e) => {
                          setDraftHero((prev) => ({ ...prev, title: e.target.value }));
                          setIsDirty(true);
                          setSaveMessage('');
                          setSaveError('');
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        서비스 섹션 제목 (OUR SERVICES)
                      </label>
                      <input
                        type="text"
                        value={draftServices.sectionTitle}
                        onChange={(e) => {
                          setDraftServices((prev) => ({ ...prev, sectionTitle: e.target.value }));
                          setIsDirty(true);
                          setSaveMessage('');
                          setSaveError('');
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex-1 min-w-0">
                    {saveError && (
                      <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{saveError}</span>
                      </p>
                    )}
                    {!saveError && saveMessage && (
                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{saveMessage}</span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveChanges(false)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{saving ? '수정 저장 중...' : '수정하기'}</span>
                  </button>
                </div>
              </div>

              {/* Admin PIN */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>관리자 모드 비밀번호 설정</span>
                </h4>
                <input
                  type="text"
                  value={draftPin}
                  onChange={(e) => {
                    setDraftPin(e.target.value);
                    setIsDirty(true);
                    setSaveMessage('');
                    setSaveError('');
                  }}
                  placeholder="1234"
                  className="w-full sm:w-48 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500">
                  외부 방문자에게는 관리자 도구가 표시되지 않으며, 하단 &lsquo;관리자&rsquo; 버튼 또는{' '}
                  <code className="px-1 py-0.5 rounded bg-slate-100 font-mono">/#/admin</code> 경로로
                  접속할 수 있습니다.
                </p>
              </div>

              {/* SEO Sitemap Generator */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>검색엔진 사이트맵 (sitemap.xml) 생성</span>
                  </h4>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md tabular-nums">
                    총 {sitemapUrlCount}개 URL
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    실제 운영 도메인 (Google · Naver 등록 주소)
                  </label>
                  <input
                    type="url"
                    value={draftSiteUrl}
                    onChange={(e) => {
                      setDraftSiteUrl(e.target.value);
                      setIsDirty(true);
                      setSaveMessage('');
                      setSaveError('');
                    }}
                    placeholder="https://www.clearworks.kr"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeMatrix}
                      onChange={(e) => setIncludeMatrix(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>지역 × 서비스 조합 페이지 URL 포함 (지역 검색 최적화)</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canWriteCode && onGenerateSitemap && (
                    <button
                      type="button"
                      disabled={generatingSitemap}
                      onClick={async () => {
                        setGeneratingSitemap(true);
                        setSitemapMessage('');
                        const result = await onGenerateSitemap(
                          normalizeBaseUrl(effectiveSiteUrl),
                          includeMatrix
                        );
                        setGeneratingSitemap(false);
                        if (result.ok) {
                          setSitemapMessage(
                            `public/sitemap.xml (${result.count ?? sitemapUrlCount}개 URL) 및 robots.txt가 갱신되었습니다.`
                          );
                        } else {
                          setSitemapMessage(
                            result.error || '사이트맵 생성 중 오류가 발생했습니다.'
                          );
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${generatingSitemap ? 'animate-spin' : ''}`}
                      />
                      <span>public/sitemap.xml 즉시 갱신</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const xml = generateSitemapXml(draftPreviewData, {
                        baseUrl: effectiveSiteUrl,
                        includeMatrix,
                      });
                      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'sitemap.xml';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>sitemap.xml 다운로드</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const txt = generateRobotsTxt(effectiveSiteUrl);
                      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'robots.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>robots.txt 다운로드</span>
                  </button>
                </div>

                {sitemapMessage && (
                  <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{sitemapMessage}</span>
                  </p>
                )}
              </div>

              {/* Backup, GitHub Sync Helper & Reset */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900">
                  데이터 백업 · GitHub 동기화 안내 · 초기화
                </h4>

                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 text-[11px] text-amber-950 leading-relaxed">
                  <p className="font-extrabold flex items-center gap-1.5 text-amber-900">
                    <FileCode2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>GitHub 동기화 버튼에 &ldquo;변경된 코드 없음&rdquo;이 뜰 때</span>
                  </p>
                  <p>
                    미리보기 화면(바로 편집·사이트 설정)에서 바꾼 내용은 현재 미리보기 서버에는 즉시 저장되지만,{' '}
                    <strong>AI Studio의 GitHub 동기화는 에디터/채팅에서 수정한 파일만 변경 내역으로 감지</strong>합니다.
                    GitHub까지 반영하려면 수정 후{' '}
                    <strong>채팅창에 &ldquo;방금 수정한 내용 GitHub 동기화되게 반영해줘&rdquo;</strong>라고 요청하시거나,
                    아래 <strong>코드(JSON) 복사</strong> 버튼으로{' '}
                    <code className="px-1 py-0.5 rounded bg-amber-100 font-mono">
                      src/data/siteContent.json
                    </code>{' '}
                    파일에 붙여넣어 주세요.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const jsonText = `${JSON.stringify(
                        { ...draftPreviewData, updatedAt: new Date().toISOString() },
                        null,
                        2
                      )}\n`;
                      navigator.clipboard.writeText(jsonText);
                      setCopiedCodeJson(true);
                      setTimeout(() => setCopiedCodeJson(false), 2500);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      copiedCodeJson
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {copiedCodeJson ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copiedCodeJson ? 'siteContent.json 복사 완료!' : 'siteContent.json 코드 복사'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>수정 내역 JSON 다운로드</span>
                  </button>

                  <label className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>백업 JSON 불러오기</span>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>

                  {!confirmReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>초기값으로 되돌리기</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-2.5 py-1">
                      <span className="text-[11px] font-bold text-red-700">
                        정말 초기화할까요?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onResetDefaults();
                          setConfirmReset(false);
                          onClose();
                        }}
                        className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                      >
                        확인
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="px-2 py-1 rounded-lg bg-white text-slate-600 text-[11px] font-bold border border-slate-200 cursor-pointer"
                      >
                        취소
                      </button>
                    </div>
                  )}
                </div>
                {importError && <p className="text-xs text-red-600">{importError}</p>}
              </div>
            </>
          ) : activeTab === 'content' ? (
            /* CONTENT & SECTIONS MANAGEMENT TAB */
            <div className="space-y-4">
              {/* Sub-category Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'hero', label: '히어로 · 배너' },
                      { id: 'services', label: `서비스 카드 (${draftServices.items.length})` },
                      { id: 'sections', label: '절차 · 요금 · 지역' },
                      { id: 'trust', label: '갤러리 · 후기 · FAQ · 문의' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setContentCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        contentCategory === cat.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveChanges(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? '저장 중...' : '수정하기'}</span>
                </button>
              </div>

              {saveError && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{saveError}</span>
                </p>
              )}
              {!saveError && saveMessage && (
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{saveMessage}</span>
                </p>
              )}

              {contentCategory === 'hero' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        상단 배지 문구
                      </label>
                      <input
                        type="text"
                        value={draftHero.badgeText}
                        onChange={(e) => {
                          setDraftHero((prev) => ({ ...prev, badgeText: e.target.value }));
                          setIsDirty(true);
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        전/후 슬라이더 안내 문구
                      </label>
                      <input
                        type="text"
                        value={draftHero.beforeAfterNotice}
                        onChange={(e) => {
                          setDraftHero((prev) => ({
                            ...prev,
                            beforeAfterNotice: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      메인 히어로 제목 (줄바꿈 가능)
                    </label>
                    <textarea
                      rows={2}
                      value={draftHero.title}
                      onChange={(e) => {
                        setDraftHero((prev) => ({ ...prev, title: e.target.value }));
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      메인 히어로 부제목
                    </label>
                    <textarea
                      rows={2}
                      value={draftHero.subtitle}
                      onChange={(e) => {
                        setDraftHero((prev) => ({ ...prev, subtitle: e.target.value }));
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        전화 버튼 문구
                      </label>
                      <input
                        type="text"
                        value={draftHero.callButtonText}
                        onChange={(e) => {
                          setDraftHero((prev) => ({ ...prev, callButtonText: e.target.value }));
                          setIsDirty(true);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        카톡 버튼 문구
                      </label>
                      <input
                        type="text"
                        value={draftHero.kakaoButtonText}
                        onChange={(e) => {
                          setDraftHero((prev) => ({ ...prev, kakaoButtonText: e.target.value }));
                          setIsDirty(true);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        청소 전 라벨
                      </label>
                      <input
                        type="text"
                        value={draftHero.beforeLabel}
                        onChange={(e) => {
                          setDraftHero((prev) => ({ ...prev, beforeLabel: e.target.value }));
                          setIsDirty(true);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        청소 후 라벨
                      </label>
                      <input
                        type="text"
                        value={draftHero.afterLabel}
                        onChange={(e) => {
                          setDraftHero((prev) => ({ ...prev, afterLabel: e.target.value }));
                          setIsDirty(true);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {contentCategory === 'services' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        서비스 섹션 제목
                      </label>
                      <input
                        type="text"
                        value={draftServices.sectionTitle}
                        onChange={(e) => {
                          setDraftServices((prev) => ({ ...prev, sectionTitle: e.target.value }));
                          setIsDirty(true);
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        서비스 섹션 부제목
                      </label>
                      <input
                        type="text"
                        value={draftServices.sectionSubtitle}
                        onChange={(e) => {
                          setDraftServices((prev) => ({
                            ...prev,
                            sectionSubtitle: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {draftServices.items.map((srv, idx) => (
                      <div
                        key={srv.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-indigo-700">
                            서비스 카드 #{idx + 1}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ID: {srv.id}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              카드 제목
                            </label>
                            <input
                              type="text"
                              value={srv.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftServices((prev) => ({
                                  ...prev,
                                  items: prev.items.map((item) =>
                                    item.id === srv.id ? { ...item, title: val } : item
                                  ),
                                }));
                                setIsDirty(true);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              우측 상단 배지
                            </label>
                            <input
                              type="text"
                              value={srv.badge ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftServices((prev) => ({
                                  ...prev,
                                  items: prev.items.map((item) =>
                                    item.id === srv.id ? { ...item, badge: val } : item
                                  ),
                                }));
                                setIsDirty(true);
                              }}
                              placeholder="비워두면 배지 숨김"
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            카드 설명 문구
                          </label>
                          <textarea
                            rows={2}
                            value={srv.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftServices((prev) => ({
                                ...prev,
                                items: prev.items.map((item) =>
                                  item.id === srv.id ? { ...item, description: val } : item
                                ),
                              }));
                              setIsDirty(true);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              소요 시간 안내
                            </label>
                            <input
                              type="text"
                              value={srv.detail.duration}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftServices((prev) => ({
                                  ...prev,
                                  items: prev.items.map((item) =>
                                    item.id === srv.id
                                      ? { ...item, detail: { ...item.detail, duration: val } }
                                      : item
                                  ),
                                }));
                                setIsDirty(true);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              예상 비용 안내
                            </label>
                            <input
                              type="text"
                              value={srv.detail.priceGuide}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraftServices((prev) => ({
                                  ...prev,
                                  items: prev.items.map((item) =>
                                    item.id === srv.id
                                      ? { ...item, detail: { ...item.detail, priceGuide: val } }
                                      : item
                                  ),
                                }));
                                setIsDirty(true);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contentCategory === 'sections' && (
                <div className="space-y-4">
                  {/* Process Section */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <h5 className="text-xs font-extrabold text-slate-900">작업 진행 절차 (PROCESS)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={draftProcess.sectionTitle}
                        onChange={(e) => {
                          setDraftProcess((prev) => ({ ...prev, sectionTitle: e.target.value }));
                          setIsDirty(true);
                        }}
                        placeholder="섹션 제목"
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={draftProcess.sectionSubtitle}
                        onChange={(e) => {
                          setDraftProcess((prev) => ({
                            ...prev,
                            sectionSubtitle: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        placeholder="섹션 부제목"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {draftProcess.steps.map((st) => (
                        <div
                          key={st.step}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5"
                        >
                          <span className="block text-[10px] font-extrabold text-indigo-600">
                            STEP 0{st.step}
                          </span>
                          <input
                            type="text"
                            value={st.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftProcess((prev) => ({
                                ...prev,
                                steps: prev.steps.map((s) =>
                                  s.step === st.step ? { ...s, title: val } : s
                                ),
                              }));
                              setIsDirty(true);
                            }}
                            className="w-full px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <textarea
                            rows={2}
                            value={st.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftProcess((prev) => ({
                                ...prev,
                                steps: prev.steps.map((s) =>
                                  s.step === st.step ? { ...s, description: val } : s
                                ),
                              }));
                              setIsDirty(true);
                            }}
                            className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <h5 className="text-xs font-extrabold text-slate-900">요금 안내 (PRICING)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={draftPricing.sectionTitle}
                        onChange={(e) => {
                          setDraftPricing((prev) => ({ ...prev, sectionTitle: e.target.value }));
                          setIsDirty(true);
                        }}
                        placeholder="섹션 제목"
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={draftPricing.sectionSubtitle}
                        onChange={(e) => {
                          setDraftPricing((prev) => ({
                            ...prev,
                            sectionSubtitle: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        placeholder="섹션 부제목"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={draftPricing.footerNote}
                      onChange={(e) => {
                        setDraftPricing((prev) => ({ ...prev, footerNote: e.target.value }));
                        setIsDirty(true);
                      }}
                      placeholder="표 하단 유의사항 문구"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Regions Section */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <h5 className="text-xs font-extrabold text-slate-900">서비스 지역 안내</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={draftRegionsMeta.sectionTitle}
                        onChange={(e) => {
                          setDraftRegionsMeta((prev) => ({ ...prev, sectionTitle: e.target.value }));
                          setIsDirty(true);
                        }}
                        placeholder="지역 섹션 제목"
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={draftRegionsMeta.sectionSubtitle}
                        onChange={(e) => {
                          setDraftRegionsMeta((prev) => ({
                            ...prev,
                            sectionSubtitle: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        placeholder="지역 섹션 부제목"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {contentCategory === 'trust' && (
                <div className="space-y-4">
                  {/* Gallery & Reviews Titles */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h5 className="text-xs font-extrabold text-slate-900">
                      작업 갤러리 · 고객 후기 문구
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={draftGalleryMeta.sectionTitle}
                        onChange={(e) => {
                          setDraftGalleryMeta((prev) => ({ ...prev, sectionTitle: e.target.value }));
                          setIsDirty(true);
                        }}
                        placeholder="갤러리 제목"
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={draftGalleryMeta.sectionSubtitle}
                        onChange={(e) => {
                          setDraftGalleryMeta((prev) => ({
                            ...prev,
                            sectionSubtitle: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        placeholder="갤러리 부제목"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={draftReviewsMeta.sectionTitle}
                        onChange={(e) => {
                          setDraftReviewsMeta((prev) => ({ ...prev, sectionTitle: e.target.value }));
                          setIsDirty(true);
                        }}
                        placeholder="고객 후기 제목"
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={draftReviewsMeta.sectionSubtitle}
                        onChange={(e) => {
                          setDraftReviewsMeta((prev) => ({
                            ...prev,
                            sectionSubtitle: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        placeholder="고객 후기 부제목"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* FAQ Items */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <h5 className="text-xs font-extrabold text-slate-900">
                      자주 묻는 질문 (FAQ)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={draftFaq.sectionTitle}
                        onChange={(e) => {
                          setDraftFaq((prev) => ({ ...prev, sectionTitle: e.target.value }));
                          setIsDirty(true);
                        }}
                        placeholder="FAQ 섹션 제목"
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={draftFaq.sectionSubtitle}
                        onChange={(e) => {
                          setDraftFaq((prev) => ({ ...prev, sectionSubtitle: e.target.value }));
                          setIsDirty(true);
                        }}
                        placeholder="FAQ 섹션 부제목"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {draftFaq.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5"
                        >
                          <span className="block text-[10px] font-extrabold text-slate-400">
                            Q{idx + 1}
                          </span>
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftFaq((prev) => ({
                                ...prev,
                                items: prev.items.map((f) =>
                                  f.id === item.id ? { ...f, question: val } : f
                                ),
                              }));
                              setIsDirty(true);
                            }}
                            className="w-full px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <textarea
                            rows={2}
                            value={item.answer}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftFaq((prev) => ({
                                ...prev,
                                items: prev.items.map((f) =>
                                  f.id === item.id ? { ...f, answer: val } : f
                                ),
                              }));
                              setIsDirty(true);
                            }}
                            className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <h5 className="text-xs font-extrabold text-slate-900">견적 문의 폼 문구</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={draftContactForm.sectionTitle}
                        onChange={(e) => {
                          setDraftContactForm((prev) => ({
                            ...prev,
                            sectionTitle: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        placeholder="문의 폼 제목"
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        value={draftContactForm.sectionSubtitle}
                        onChange={(e) => {
                          setDraftContactForm((prev) => ({
                            ...prev,
                            sectionSubtitle: e.target.value,
                          }));
                          setIsDirty(true);
                        }}
                        placeholder="문의 폼 부제목"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <input
                      type="text"
                      value={draftContactForm.successMessage}
                      onChange={(e) => {
                        setDraftContactForm((prev) => ({
                          ...prev,
                          successMessage: e.target.value,
                        }));
                        setIsDirty(true);
                      }}
                      placeholder="접수 완료 안내 문구"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'seo' ? (
            /* SEO SETTINGS TAB */
            <div className="space-y-5">
              {/* Global Default OG Image */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>공통 기본 오픈그래프(OG) 대표 이미지</span>
                  </label>
                  <label className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>{uploadingOgImage === 'global' ? '업로드 중...' : '이미지 업로드'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleOgFileUpload('global', e)}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={draftSeo.defaultOgImage ?? ''}
                  onChange={(e) => {
                    setDraftSeo((prev) => ({ ...prev, defaultOgImage: e.target.value }));
                    setIsDirty(true);
                    setSaveMessage('');
                    setSaveError('');
                  }}
                  placeholder={siteData.hero.afterImage || '/images/hero_after.jpg'}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500">
                  페이지별 OG 이미지를 별도 지정하지 않을 때 카카오톡·네이버·페이스북 링크 공유 시
                  사용됩니다. (권장 1200×630px)
                </p>
              </div>

              {/* Page Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    메타 태그 편집 대상 페이지 선택
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {selectedPageKey}
                  </span>
                </div>

                {/* Category Selector */}
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'core', label: '주요 페이지' },
                      { id: 'service', label: '서비스 상세' },
                      { id: 'region', label: '지역별 페이지' },
                      { id: 'matrix', label: '지역×서비스' },
                      { id: 'gallery', label: '시공 갤러리' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSeoCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        seoCategory === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Target Page Picker within Category */}
                {seoCategory === 'core' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCoreKey('home')}
                      className={`px-3 py-2 rounded-xl border text-left text-xs font-bold cursor-pointer transition-colors flex items-center justify-between ${
                        selectedCoreKey === 'home'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>메인 홈페이지 (/)</span>
                      {hasCustomMeta(draftSeo.pages.home) && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCoreKey('gallery_list')}
                      className={`px-3 py-2 rounded-xl border text-left text-xs font-bold cursor-pointer transition-colors flex items-center justify-between ${
                        selectedCoreKey === 'gallery_list'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>현장 갤러리 목록 (#/gallery)</span>
                      {hasCustomMeta(draftSeo.pages.gallery_list) && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </button>
                  </div>
                )}

                {seoCategory === 'service' && (
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {siteData.services.items.map((srv) => {
                      const customized = hasCustomMeta(draftSeo.pages[`service:${srv.id}`]);
                      return (
                        <option key={srv.id} value={srv.id}>
                          {srv.title} (#/service/{srv.id}){customized ? ' ★ 개별설정됨' : ''}
                        </option>
                      );
                    })}
                  </select>
                )}

                {seoCategory === 'region' && (
                  <select
                    value={selectedRegionName}
                    onChange={(e) => setSelectedRegionName(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {siteData.regions.list.map((reg) => {
                      const customized = hasCustomMeta(draftSeo.pages[`region:${reg}`]);
                      return (
                        <option key={reg} value={reg}>
                          {reg} (#/region/{reg}){customized ? ' ★ 개별설정됨' : ''}
                        </option>
                      );
                    })}
                  </select>
                )}

                {seoCategory === 'matrix' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={selectedMatrixRegion}
                      onChange={(e) => setSelectedMatrixRegion(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      {siteData.regions.list.map((reg) => (
                        <option key={reg} value={reg}>
                          지역: {reg}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedMatrixServiceId}
                      onChange={(e) => setSelectedMatrixServiceId(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      {siteData.services.items.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          서비스: {srv.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {seoCategory === 'gallery' && (
                  <select
                    value={selectedGalleryPostId}
                    onChange={(e) => setSelectedGalleryPostId(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {siteData.gallery.posts.map((post) => {
                      const customized = hasCustomMeta(
                        draftSeo.pages[`gallery_detail:${post.id}`]
                      );
                      return (
                        <option key={post.id} value={post.id}>
                          [{post.category}] {post.title}
                          {customized ? ' ★ 개별설정됨' : ''}
                        </option>
                      );
                    })}
                  </select>
                )}

                {customPageEntries.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-500">개별 설정된 페이지:</span>
                    {customPageEntries.map(([key]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleJumpToPageKey(key)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          key === selectedPageKey
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {getPageKeyDisplayLabel(key)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Meta Tag Form for Selected Page */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900">
                      {getPageKeyDisplayLabel(selectedPageKey)} 메타 태그
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      비워둔 항목은 업체 정보 기반 자동 생성값이 적용됩니다.
                    </p>
                  </div>
                  {hasCustomMeta(currentOverride) && (
                    <button
                      type="button"
                      onClick={handleResetPageSeo}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>이 페이지 기본값 복원</span>
                    </button>
                  )}
                </div>

                {/* Page Title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      페이지 제목 (Title Tag)
                    </label>
                    <span
                      className={`text-[11px] font-semibold tabular-nums ${
                        resolvedTitle.length > 60
                          ? 'text-amber-600'
                          : resolvedTitle.length >= 20
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                      }`}
                    >
                      {resolvedTitle.length}자 (30~60자 권장)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={currentOverride.title ?? ''}
                    onChange={(e) => updatePageSeoField('title', e.target.value)}
                    placeholder={selectedDefaults.title}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Meta Description */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      메타 설명 (Meta Description)
                    </label>
                    <span
                      className={`text-[11px] font-semibold tabular-nums ${
                        resolvedDescription.length > 160
                          ? 'text-amber-600'
                          : resolvedDescription.length >= 60
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                      }`}
                    >
                      {resolvedDescription.length}자 (80~160자 권장)
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={currentOverride.description ?? ''}
                    onChange={(e) => updatePageSeoField('description', e.target.value)}
                    placeholder={selectedDefaults.description}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
                  />
                </div>

                {/* Meta Keywords */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>메타 키워드 (Meta Keywords · 쉼표로 구분)</span>
                    </label>
                    <button
                      type="button"
                      disabled={suggestingKeywords}
                      onClick={async () => {
                        setSuggestingKeywords(true);
                        setKeywordSuggestionError('');
                        try {
                          if (onSuggestSeoKeywords) {
                            const res = await onSuggestSeoKeywords({
                              pageKey: selectedPageKey,
                              pageLabel: getPageKeyDisplayLabel(selectedPageKey),
                              title: resolvedTitle,
                              description: resolvedDescription,
                              existingKeywords: resolvedKeywords,
                              companyName: draftCompany.name,
                              region: draftCompany.region,
                            });
                            if (!res.ok) {
                              setKeywordSuggestionError(
                                res.error || '추천 키워드를 생성하지 못했습니다.'
                              );
                            } else {
                              setKeywordSuggestions(res.suggestions ?? []);
                              setKeywordSuggestionSource(res.source || '');
                            }
                          }
                        } catch {
                          setKeywordSuggestionError('키워드 추천 요청 중 오류가 발생했습니다.');
                        } finally {
                          setSuggestingKeywords(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60 transition-all"
                    >
                      {suggestingKeywords ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {suggestingKeywords ? '검색 키워드 분석 중...' : 'AI 추천 키워드 제안'}
                      </span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={currentOverride.keywords ?? ''}
                    onChange={(e) => updatePageSeoField('keywords', e.target.value)}
                    placeholder={selectedDefaults.keywords}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />

                  {parsedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {parsedKeywords.slice(0, 14).map((kw, idx) => (
                        <span
                          key={`${kw}-${idx}`}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                        >
                          #{kw}
                        </span>
                      ))}
                      {parsedKeywords.length > 14 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{parsedKeywords.length - 14}개
                        </span>
                      )}
                    </div>
                  )}

                  {keywordSuggestionError && (
                    <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{keywordSuggestionError}</span>
                    </p>
                  )}

                  {keywordSuggestions.length > 0 && (
                    <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-xs font-extrabold text-slate-900">
                            구글·네이버 경쟁력 추천 키워드
                          </span>
                          {keywordSuggestionSource === 'gemini' && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                              AI 분석
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const currentList = (currentOverride.keywords ?? resolvedKeywords)
                                .split(',')
                                .map((k) => k.trim())
                                .filter(Boolean);
                              const merged = [...currentList];
                              for (const item of keywordSuggestions) {
                                if (!merged.includes(item.keyword)) {
                                  merged.push(item.keyword);
                                }
                              }
                              updatePageSeoField('keywords', merged.join(', '));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                          >
                            전체 추가
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextList = keywordSuggestions.map((item) => item.keyword);
                              updatePageSeoField('keywords', nextList.join(', '));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold cursor-pointer transition-colors"
                          >
                            추천으로 교체
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {keywordSuggestions.map((item) => {
                          const currentList = (currentOverride.keywords ?? resolvedKeywords)
                            .split(',')
                            .map((k) => k.trim())
                            .filter(Boolean);
                          const isApplied = currentList.includes(item.keyword);

                          return (
                            <button
                              key={item.keyword}
                              type="button"
                              onClick={() => {
                                if (isApplied) {
                                  const filtered = currentList.filter((k) => k !== item.keyword);
                                  updatePageSeoField('keywords', filtered.join(', '));
                                } else {
                                  const next = currentList.includes(item.keyword)
                                    ? currentList
                                    : [...currentList, item.keyword];
                                  updatePageSeoField('keywords', next.join(', '));
                                }
                              }}
                              className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                                isApplied
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-bold truncate">{item.keyword}</span>
                                <span
                                  className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    isApplied
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {isApplied ? (
                                    <>
                                      <Check className="w-2.5 h-2.5" />
                                      <span>적용됨</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-2.5 h-2.5" />
                                      <span>{item.intent}</span>
                                    </>
                                  )}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                {item.reason}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* OpenGraph Section */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <h6 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>오픈그래프 (OpenGraph · 카카오톡 / SNS 공유 카드)</span>
                  </h6>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      OG 제목 (og:title)
                    </label>
                    <input
                      type="text"
                      value={currentOverride.ogTitle ?? ''}
                      onChange={(e) => updatePageSeoField('ogTitle', e.target.value)}
                      placeholder={`비워두면 페이지 제목 적용 (${resolvedTitle})`}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      OG 설명 (og:description)
                    </label>
                    <textarea
                      rows={2}
                      value={currentOverride.ogDescription ?? ''}
                      onChange={(e) => updatePageSeoField('ogDescription', e.target.value)}
                      placeholder="비워두면 메타 설명이 자동 적용됩니다."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700">
                        OG 이미지 (og:image)
                      </label>
                      <label className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>
                          {uploadingOgImage === 'page' ? '업로드 중...' : '전용 이미지 업로드'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleOgFileUpload('page', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={currentOverride.ogImage ?? ''}
                      onChange={(e) => updatePageSeoField('ogImage', e.target.value)}
                      placeholder={
                        draftSeo.defaultOgImage?.trim() ||
                        selectedDefaults.ogImage ||
                        '/images/hero_after.jpg'
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Live Quick Preview Banner + Jump to Preview Tab */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-emerald-950">
                    구글 검색결과 &amp; 카카오톡 공유 카드 실시간 확인
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    방금 수정한 제목, 설명, OG 이미지가 실제 검색창과 카톡에 어떻게 뜨는지 시뮬레이션합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>SEO 미리보기 열기</span>
                </button>
              </div>

              {/* Inline Save Bar for SEO Tab */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex-1 min-w-0">
                  {saveError && (
                    <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{saveError}</span>
                    </p>
                  )}
                  {!saveError && saveMessage && (
                    <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{saveMessage}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveChanges(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'SEO 저장 중...' : 'SEO 설정 수정하기'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* SEO PREVIEW TAB */
            <div className="space-y-5">
              {/* Target Page Selector Bar in Preview Tab */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">
                      미리보기 대상 페이지: {getPageKeyDisplayLabel(selectedPageKey)}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      {previewUrlDisplay}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {currentRoute && (
                      <button
                        type="button"
                        onClick={() => {
                          setSeoCategory(getCategoryFromRoute(currentRoute));
                          if (currentRoute.type === 'home') setSelectedCoreKey('home');
                          else if (currentRoute.type === 'gallery_list')
                            setSelectedCoreKey('gallery_list');
                          else if (currentRoute.type === 'service')
                            setSelectedServiceId(currentRoute.serviceId);
                          else if (currentRoute.type === 'region')
                            setSelectedRegionName(currentRoute.regionName);
                          else if (currentRoute.type === 'matrix') {
                            setSelectedMatrixRegion(currentRoute.regionName);
                            setSelectedMatrixServiceId(currentRoute.serviceId);
                          } else if (currentRoute.type === 'gallery_detail')
                            setSelectedGalleryPostId(currentRoute.postId);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold cursor-pointer"
                      >
                        현재 화면 페이지 보기
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('seo')}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer"
                    >
                      이 페이지 문구 수정
                    </button>
                  </div>
                </div>

                {/* Quick Category + Page Switcher */}
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'core', label: '주요 페이지' },
                      { id: 'service', label: '서비스 상세' },
                      { id: 'region', label: '지역별 페이지' },
                      { id: 'matrix', label: '지역×서비스' },
                      { id: 'gallery', label: '시공 갤러리' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSeoCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        seoCategory === cat.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {seoCategory === 'core' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCoreKey('home')}
                      className={`px-3 py-1.5 rounded-xl border text-left text-xs font-bold cursor-pointer ${
                        selectedCoreKey === 'home'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      메인 홈페이지 (/)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCoreKey('gallery_list')}
                      className={`px-3 py-1.5 rounded-xl border text-left text-xs font-bold cursor-pointer ${
                        selectedCoreKey === 'gallery_list'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      현장 갤러리 목록 (#/gallery)
                    </button>
                  </div>
                )}

                {seoCategory === 'service' && (
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
                  >
                    {siteData.services.items.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.title} (#/service/{srv.id})
                      </option>
                    ))}
                  </select>
                )}

                {seoCategory === 'region' && (
                  <select
                    value={selectedRegionName}
                    onChange={(e) => setSelectedRegionName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
                  >
                    {siteData.regions.list.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg} (#/region/{reg})
                      </option>
                    ))}
                  </select>
                )}

                {seoCategory === 'matrix' && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedMatrixRegion}
                      onChange={(e) => setSelectedMatrixRegion(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
                    >
                      {siteData.regions.list.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedMatrixServiceId}
                      onChange={(e) => setSelectedMatrixServiceId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
                    >
                      {siteData.services.items.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {seoCategory === 'gallery' && (
                  <select
                    value={selectedGalleryPostId}
                    onChange={(e) => setSelectedGalleryPostId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl"
                  >
                    {siteData.gallery.posts.map((post) => (
                      <option key={post.id} value={post.id}>
                        [{post.category}] {post.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 1. Google Search Results Simulation */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white border border-slate-200 text-[11px] font-black text-blue-600">
                      G
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      Google 검색 결과 미리보기
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setGooglePreviewDevice('desktop')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        googlePreviewDevice === 'desktop'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Monitor className="w-3 h-3" />
                      <span>PC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGooglePreviewDevice('mobile')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        googlePreviewDevice === 'mobile'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>모바일</span>
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div
                    className={`rounded-xl border border-slate-100 bg-white p-3.5 ${
                      googlePreviewDevice === 'mobile' ? 'max-w-[360px] mx-auto shadow-xs' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                          {draftCompany.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{previewUrlDisplay}</p>
                      </div>
                    </div>
                    <h4 className="text-[17px] font-medium text-[#1a0dab] hover:underline leading-snug line-clamp-1">
                      {resolvedTitle}
                    </h4>
                    <p className="text-[13px] text-[#4d5156] mt-1 leading-relaxed line-clamp-2">
                      {resolvedDescription}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Naver Search Result Preview */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#03c75a] text-[11px] font-black text-white">
                      N
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      Naver 검색 결과 미리보기
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    키워드 {parsedKeywords.length}개 반영
                  </span>
                </div>
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-[#03c75a]">{draftCompany.name}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500 truncate">{previewUrlDisplay}</span>
                  </div>
                  <p className="text-[15px] font-bold text-[#0068c3] leading-snug line-clamp-1">
                    {resolvedTitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {resolvedDescription}
                  </p>
                  {parsedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {parsedKeywords.slice(0, 6).map((kw, idx) => (
                        <span
                          key={`${kw}-${idx}`}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-semibold"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. KakaoTalk Link Share Simulation */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#FEE500] text-[11px] font-black text-[#3c1e1e]">
                      K
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      카카오톡 링크 공유 미리보기 (OpenGraph)
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="p-4 bg-[#b2c7d9]">
                  <div className="flex items-start gap-2.5 max-w-[320px]">
                    <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="block text-[11px] font-bold text-slate-800">
                        {draftCompany.name}
                      </span>
                      <div className="rounded-2xl bg-[#FEE500] px-3 py-2 text-xs font-medium text-[#3c1e1e] shadow-xs inline-block">
                        무료 방문 견적 안내 페이지입니다 😊
                      </div>

                      <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-black/5">
                        <div className="aspect-[1.91/1] bg-slate-100 relative overflow-hidden">
                          {resolvedOgImage ? (
                            <img
                              src={resolveAssetUrl(resolvedOgImage)}
                              alt="카카오톡 링크 미리보기 이미지"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                              <ImageIcon className="w-5 h-5" />
                              <span>설정된 OG 이미지 없음</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-1">
                          <p className="text-[13px] font-extrabold text-slate-900 leading-snug line-clamp-2">
                            {resolvedOgTitle}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                            {resolvedOgDescription}
                          </p>
                          <p className="text-[10px] text-slate-400 pt-1 truncate font-mono">
                            {(() => {
                              try {
                                return new URL(effectiveSiteUrl).hostname;
                              } catch {
                                return effectiveSiteUrl;
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Quick SEO Diagnostic Checklist */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400">제목 길이</span>
                  <span
                    className={`text-xs font-extrabold tabular-nums ${
                      resolvedTitle.length >= 20 && resolvedTitle.length <= 60
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {resolvedTitle.length}자
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400">설명 길이</span>
                  <span
                    className={`text-xs font-extrabold tabular-nums ${
                      resolvedDescription.length >= 60 && resolvedDescription.length <= 160
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {resolvedDescription.length}자
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400">메타 키워드</span>
                  <span className="text-xs font-extrabold text-blue-600 tabular-nums">
                    {parsedKeywords.length}개
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400">OG 이미지</span>
                  <span
                    className={`text-xs font-extrabold ${
                      resolvedOgImage ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {resolvedOgImage ? '설정됨' : '미설정'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="shrink-0 pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            {isDirty ? '저장되지 않은 변경사항이 있습니다.' : '모든 변경사항이 최신 상태입니다.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveChanges(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? '저장 중...' : '확인 (저장 후 닫기)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

