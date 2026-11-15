import { useCallback, useEffect, useRef, useState } from 'react';
import { ContactSection } from '@/src/components/ContactSection';
import { FaqSection } from '@/src/components/FaqSection';
import { Footer } from '@/src/components/Footer';
import { GalleryDetailPage } from '@/src/components/GalleryDetailPage';
import { GalleryListPage } from '@/src/components/GalleryListPage';
import { GallerySection } from '@/src/components/GallerySection';
import { Header } from '@/src/components/Header';
import { Hero } from '@/src/components/Hero';
import { MatrixPage } from '@/src/components/MatrixPage';
import { MobileFloatingCta } from '@/src/components/MobileFloatingCta';
import { PricingSection } from '@/src/components/PricingSection';
import { ProcessSection } from '@/src/components/ProcessSection';
import { RegionDetailPage } from '@/src/components/RegionDetailPage';
import { RegionsSection } from '@/src/components/RegionsSection';
import { ReviewsSection } from '@/src/components/ReviewsSection';
import { ServiceDetailPage } from '@/src/components/ServiceDetailPage';
import { ServicesSection } from '@/src/components/ServicesSection';
import { AdminLoginModal } from '@/src/components/admin/AdminLoginModal';
import { AdminToolbar, type CodeSyncStatus } from '@/src/components/admin/AdminToolbar';
import {
  ImageEditorModal,
  type ImageEditTarget,
} from '@/src/components/admin/ImageEditorModal';
import { InquiriesModal } from '@/src/components/admin/InquiriesModal';
import {
  SiteSettingsModal,
  type SeoKeywordSuggestion,
} from '@/src/components/admin/SiteSettingsModal';
import {
  CLEARWORKS_IMAGES,
  DEFAULT_SITE_DATA,
  INITIAL_SITE_DATA,
} from '@/src/data/clearworksData';
import type {
  CompanyInfo,
  GalleryPost,
  HeroData,
  InquiryItem,
  InquiryPayload,
  PageRoute,
  RegionDetail,
  ServiceItem,
  SiteData,
} from '@/src/types/clearworks';
import { applySeoForRoute } from '@/src/utils/seo';

const SITE_DATA_STORAGE_KEY = 'clearworks_site_data_v1';
const INQUIRIES_STORAGE_KEY = 'clearworks_inquiries_v1';
const ADMIN_SESSION_KEY = 'clearworks_admin_session_v1';
const ADMIN_PIN_SESSION_KEY = 'clearworks_admin_pin_v1';

function loadInitialInquiries(): InquiryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INQUIRIES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InquiryItem[]) : [];
  } catch {
    return [];
  }
}

function parseTimeMs(iso?: string): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function readStoredSiteData(): SiteData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SITE_DATA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SiteData>;
    if (!parsed || !parsed.company || !parsed.hero || !parsed.services) {
      return null;
    }
    return {
      ...INITIAL_SITE_DATA,
      ...parsed,
    } as SiteData;
  } catch {
    return null;
  }
}

function persistLocalSiteData(data: SiteData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SITE_DATA_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

function loadInitialSiteData(): SiteData {
  const stored = readStoredSiteData();
  if (!stored) return INITIAL_SITE_DATA;
  const storedTime = parseTimeMs(stored.updatedAt);
  const initTime = parseTimeMs(INITIAL_SITE_DATA.updatedAt);
  if (storedTime > 0 && storedTime >= initTime) {
    return stored;
  }
  return INITIAL_SITE_DATA;
}

function isAdminHash(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return hash === 'admin';
}

function parseHashRoute(): PageRoute {
  if (typeof window === 'undefined') return { type: 'home' };
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash || hash.toLowerCase() === 'admin') return { type: 'home' };

  const parts = hash.split('/').map((p) => decodeURIComponent(p));
  if (parts[0] === 'service' && parts[1]) {
    return { type: 'service', serviceId: parts[1] };
  }
  if (parts[0] === 'region' && parts[1]) {
    if (parts[2] === 'service' && parts[3]) {
      return { type: 'matrix', regionName: parts[1], serviceId: parts[3] };
    }
    return { type: 'region', regionName: parts[1] };
  }
  if (parts[0] === 'gallery') {
    if (parts[1]) return { type: 'gallery_detail', postId: parts[1] };
    return { type: 'gallery_list' };
  }
  return { type: 'home' };
}

function buildHashForRoute(route: PageRoute): string {
  switch (route.type) {
    case 'home':
      return '';
    case 'service':
      return `#/service/${encodeURIComponent(route.serviceId)}`;
    case 'region':
      return `#/region/${encodeURIComponent(route.regionName)}`;
    case 'matrix':
      return `#/region/${encodeURIComponent(route.regionName)}/service/${encodeURIComponent(route.serviceId)}`;
    case 'gallery_list':
      return '#/gallery';
    case 'gallery_detail':
      return `#/gallery/${encodeURIComponent(route.postId)}`;
  }
}

export default function App() {
  const [siteData, setSiteData] = useState<SiteData>(() => loadInitialSiteData());
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => loadInitialInquiries());
  const [route, setRoute] = useState<PageRoute>(() => parseHashRoute());

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [canWriteCode, setCanWriteCode] = useState<boolean>(false);
  const [codeSyncStatus, setCodeSyncStatus] = useState<CodeSyncStatus>('checking');
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(() => isAdminHash());
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [inquiriesModalOpen, setInquiriesModalOpen] = useState<boolean>(false);
  const [imageEditTarget, setImageEditTarget] = useState<ImageEditTarget | null>(null);

  const verifiedPinRef = useRef<string>(
    (typeof window !== 'undefined' && sessionStorage.getItem(ADMIN_PIN_SESSION_KEY)) ||
      INITIAL_SITE_DATA.adminPin
  );
  const hasUserEditedRef = useRef<boolean>(false);
  const hasPendingDiskSyncRef = useRef<boolean>(false);
  const latestSiteDataRef = useRef<SiteData>(siteData);
  const canWriteCodeRef = useRef<boolean>(false);
  const isAdminModeRef = useRef<boolean>(isAdminMode);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  latestSiteDataRef.current = siteData;
  canWriteCodeRef.current = canWriteCode;
  isAdminModeRef.current = isAdminMode;

  // Active editing only allowed when authenticated in Admin Mode AND Edit Toggle is ON
  const activeEditMode = isAdminMode && isEditMode;

  // Check if backend codebase persistence server is running (AI Studio Build / local dev)
  useEffect(() => {
    let active = true;
    async function initCodebaseSync() {
      try {
        const capRes = await fetch('/api/admin/capabilities', { cache: 'no-store' });
        if (!capRes.ok) throw new Error('No codebase API');
        const cap = (await capRes.json()) as { canWriteCode?: boolean };
        if (!active) return;

        if (cap.canWriteCode) {
          canWriteCodeRef.current = true;
          setCanWriteCode(true);

          const dataRes = await fetch('/api/admin/site-data', { cache: 'no-store' });
          if (dataRes.ok && active) {
            const diskData = (await dataRes.json()) as SiteData;
            const localData = readStoredSiteData();
            const diskTime = parseTimeMs(diskData.updatedAt);
            const localTime = parseTimeMs(localData?.updatedAt);

            if (
              localData &&
              localTime > diskTime &&
              JSON.stringify(localData) !== JSON.stringify(diskData)
            ) {
              // Preserve newer browser edits if disk snapshot was reset/older, and sync back to disk
              hasUserEditedRef.current = false;
              hasPendingDiskSyncRef.current = true;
              latestSiteDataRef.current = localData;
              setSiteData(localData);

              const isSessionAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
              const storedPin = sessionStorage.getItem(ADMIN_PIN_SESSION_KEY);
              if (
                isSessionAdmin &&
                (storedPin === diskData.adminPin || storedPin === localData.adminPin)
              ) {
                try {
                  const resync = await fetch('/api/admin/save-site-data', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-admin-pin': diskData.adminPin,
                    },
                    body: JSON.stringify(localData),
                  });
                  if (resync.ok && active) {
                    verifiedPinRef.current = localData.adminPin;
                    sessionStorage.setItem(ADMIN_PIN_SESSION_KEY, localData.adminPin);
                    hasPendingDiskSyncRef.current = false;
                    setCodeSyncStatus('saved');
                  } else if (active) {
                    verifiedPinRef.current = diskData.adminPin;
                    setCodeSyncStatus('unsynced');
                  }
                } catch {
                  if (active) {
                    verifiedPinRef.current = diskData.adminPin;
                    setCodeSyncStatus('unsynced');
                  }
                }
              } else {
                verifiedPinRef.current = diskData.adminPin;
                setCodeSyncStatus('unsynced');
              }
            } else {
              hasUserEditedRef.current = false;
              hasPendingDiskSyncRef.current = false;
              latestSiteDataRef.current = diskData;
              setSiteData(diskData);
              persistLocalSiteData(diskData);
              setCodeSyncStatus('saved');

              const storedPin = sessionStorage.getItem(ADMIN_PIN_SESSION_KEY);
              if (!storedPin) {
                verifiedPinRef.current = diskData.adminPin;
              } else if (storedPin !== diskData.adminPin) {
                sessionStorage.removeItem(ADMIN_SESSION_KEY);
                sessionStorage.removeItem(ADMIN_PIN_SESSION_KEY);
                verifiedPinRef.current = diskData.adminPin;
                isAdminModeRef.current = false;
                setIsAdminMode(false);
              }
            }
          } else if (active) {
            setCodeSyncStatus('error');
          }
          return;
        }
      } catch {
        // Static build (e.g., Vercel) without local write server
      }

      if (!active) return;
      canWriteCodeRef.current = false;
      setCanWriteCode(false);
      setCodeSyncStatus('readonly');
    }

    initCodebaseSync();
    return () => {
      active = false;
    };
  }, []);

  const saveSiteDataToCodebase = useCallback(
    async (
      dataToSave: SiteData,
      options?: { pinOverride?: string; forceAdmin?: boolean }
    ): Promise<{ ok: boolean; error?: string }> => {
      const effectiveAdmin = options?.forceAdmin ?? isAdminModeRef.current;
      if (!effectiveAdmin) {
        return { ok: false, error: '관리자 모드에서만 저장할 수 있습니다.' };
      }
      latestSiteDataRef.current = dataToSave;
      persistLocalSiteData(dataToSave);

      if (!canWriteCodeRef.current && !canWriteCode) {
        return { ok: true };
      }

      const pinHeader = options?.pinOverride ?? verifiedPinRef.current;
      setCodeSyncStatus('saving');
      try {
        const res = await fetch('/api/admin/save-site-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': pinHeader,
          },
          body: JSON.stringify(dataToSave),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          hasPendingDiskSyncRef.current = true;
          setCodeSyncStatus('error');
          return {
            ok: false,
            error: errBody.error || `저장에 실패했습니다. (HTTP ${res.status})`,
          };
        }
        verifiedPinRef.current = dataToSave.adminPin;
        hasPendingDiskSyncRef.current = false;
        hasUserEditedRef.current = false;
        try {
          sessionStorage.setItem(ADMIN_PIN_SESSION_KEY, dataToSave.adminPin);
        } catch {
          // Ignore
        }
        setCodeSyncStatus('saved');
        return { ok: true };
      } catch {
        hasPendingDiskSyncRef.current = true;
        setCodeSyncStatus('error');
        return { ok: false, error: '서버와 통신하는 중 네트워크 오류가 발생했습니다.' };
      }
    },
    [canWriteCode]
  );

  // Wrapper so only intentional user/admin edits mark dirty and trigger codebase save
  const updateSiteData: React.Dispatch<React.SetStateAction<SiteData>> = useCallback((updater) => {
    hasUserEditedRef.current = true;
    hasPendingDiskSyncRef.current = true;
    setSiteData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const stamped: SiteData = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      latestSiteDataRef.current = stamped;
      persistLocalSiteData(stamped);
      return stamped;
    });
  }, []);

  const handleSaveSettings = useCallback(
    async (nextData: SiteData): Promise<{ ok: boolean; error?: string }> => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      hasUserEditedRef.current = false;
      const stamped: SiteData = {
        ...nextData,
        updatedAt: new Date().toISOString(),
      };
      latestSiteDataRef.current = stamped;
      persistLocalSiteData(stamped);
      setSiteData(stamped);
      return saveSiteDataToCodebase(stamped);
    },
    [saveSiteDataToCodebase]
  );

  // Auto-save edits directly into codebase JSON when in Admin Mode
  useEffect(() => {
    if (!hasUserEditedRef.current) return;

    if (canWriteCode && isAdminMode) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      setCodeSyncStatus('saving');
      autoSaveTimerRef.current = setTimeout(() => {
        autoSaveTimerRef.current = null;
        void saveSiteDataToCodebase(latestSiteDataRef.current);
      }, 150);
      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }
      };
    }

    // Fallback preview storage on read-only static hosts
    if (!canWriteCode && isAdminMode) {
      persistLocalSiteData(siteData);
    }
  }, [siteData, canWriteCode, isAdminMode, saveSiteDataToCodebase]);

  // Flush any pending edits to codebase immediately when tab is hidden or closing
  useEffect(() => {
    const flushPendingToDisk = () => {
      if (!canWriteCodeRef.current || !isAdminModeRef.current) return;
      if (!hasPendingDiskSyncRef.current && !hasUserEditedRef.current && !autoSaveTimerRef.current) {
        return;
      }
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      try {
        void fetch('/api/admin/save-site-data', {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': verifiedPinRef.current,
          },
          body: JSON.stringify(latestSiteDataRef.current),
        });
      } catch {
        // Ignore keepalive network issues on unload
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingToDisk();
      }
    };

    window.addEventListener('pagehide', flushPendingToDisk);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flushPendingToDisk);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(inquiries));
    } catch {
      // Ignore storage quota errors
    }
  }, [inquiries]);

  useEffect(() => {
    if (isAdminHash() && !isAdminMode) {
      setLoginModalOpen(true);
    }
  }, [isAdminMode]);

  useEffect(() => {
    const onHashChange = () => {
      if (isAdminHash() && !isAdminMode) {
        setLoginModalOpen(true);
      }
      setRoute(parseHashRoute());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [isAdminMode]);

  useEffect(() => {
    applySeoForRoute(route, siteData);
  }, [route, siteData]);

  const uploadImageToCodebase = async (dataUrl: string, nameHint?: string): Promise<string> => {
    if (!canWriteCode || !isAdminMode) return dataUrl;
    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': verifiedPinRef.current,
        },
        body: JSON.stringify({ dataUrl, nameHint }),
      });
      if (!res.ok) return dataUrl;
      const json = (await res.json()) as { url?: string };
      return json.url || dataUrl;
    } catch {
      return dataUrl;
    }
  };

  const navigateTo = (next: PageRoute) => {
    setRoute(next);
    const nextHash = buildHashForRoute(next);
    if (typeof window !== 'undefined') {
      if (nextHash) {
        window.history.pushState(null, '', nextHash);
      } else {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (route.type !== 'home') {
      navigateTo({ type: 'home' });
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearAdminHash = () => {
    if (typeof window !== 'undefined' && isAdminHash()) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleAdminLoginSuccess = () => {
    const currentData = latestSiteDataRef.current;
    verifiedPinRef.current = currentData.adminPin;
    isAdminModeRef.current = true;
    setIsAdminMode(true);
    setIsEditMode(true);
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      sessionStorage.setItem(ADMIN_PIN_SESSION_KEY, currentData.adminPin);
    } catch {
      // Ignore
    }
    clearAdminHash();

    if (canWriteCodeRef.current && (hasPendingDiskSyncRef.current || hasUserEditedRef.current)) {
      void saveSiteDataToCodebase(currentData, {
        pinOverride: currentData.adminPin,
        forceAdmin: true,
      });
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdminMode(false);
    setSettingsModalOpen(false);
    setInquiriesModalOpen(false);
    setImageEditTarget(null);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_PIN_SESSION_KEY);
    } catch {
      // Ignore
    }
    clearAdminHash();
  };

  const handleInquirySubmit = (payload: InquiryPayload) => {
    const newEntry: InquiryItem = {
      ...payload,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: '대기중',
    };
    setInquiries((prev) => [newEntry, ...prev]);
  };

  // Updaters
  const updateCompany = (field: keyof CompanyInfo, value: string) => {
    updateSiteData((prev) => ({
      ...prev,
      company: { ...prev.company, [field]: value },
    }));
  };

  const updateHero = (field: keyof HeroData, value: string) => {
    updateSiteData((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
  };

  const updateHeroStat = (statId: string, field: 'value' | 'label', value: string) => {
    updateSiteData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        stats: prev.hero.stats.map((s) => (s.id === statId ? { ...s, [field]: value } : s)),
      },
    }));
  };

  const updateServiceField = (
    id: string,
    field: 'title' | 'description' | 'badge',
    val: string
  ) => {
    updateSiteData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        items: prev.services.items.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
      },
    }));
  };

  const updateFullService = (updated: ServiceItem) => {
    updateSiteData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        items: prev.services.items.map((s) => (s.id === updated.id ? updated : s)),
      },
    }));
  };

  const addService = () => {
    const newItem: ServiceItem = {
      id: `srv-${Date.now()}`,
      title: '새 전문 청소 서비스',
      description: '신규 서비스에 대한 간단한 설명을 입력해 주세요.',
      iconName: 'Sparkles',
      badge: '신규 서비스',
      detail: {
        tagline: '맞춤형 프리미엄 유리창·외벽 케어 솔루션',
        targetAudience: '아파트, 상가, 오피스, 빌딩',
        scopeList: ['기본 오염물 제거 및 유리창 양면 세척', '창틀 및 마감 라인 정밀 클리닝'],
        equipment: ['전문가용 윈도우 스퀴지', '친환경 중성 세정제'],
        duration: '현장 규모별 약 2~4시간 소요',
        priceGuide: '현장 확인 후 무료 견적 산출',
        beforeImage: CLEARWORKS_IMAGES.aptBefore,
        afterImage: CLEARWORKS_IMAGES.aptAfter,
        faqList: [
          {
            q: '상담 후 언제 작업이 가능한가요?',
            a: '일정 조율 후 평일 및 주말 모두 원하시는 날짜에 맞춰 출장 시공이 가능합니다.',
          },
        ],
      },
    };
    updateSiteData((prev) => ({
      ...prev,
      services: { ...prev.services, items: [...prev.services.items, newItem] },
    }));
  };

  const deleteService = (id: string) => {
    updateSiteData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        items: prev.services.items.filter((s) => s.id !== id),
      },
    }));
  };

  const updateProcessStep = (stepNum: number, field: 'title' | 'description', val: string) => {
    updateSiteData((prev) => ({
      ...prev,
      process: {
        ...prev.process,
        steps: prev.process.steps.map((st) =>
          st.step === stepNum ? { ...st, [field]: val } : st
        ),
      },
    }));
  };

  const updateGalleryPostField = (
    postId: string,
    field: 'title' | 'excerpt' | 'coverImage',
    val: string
  ) => {
    updateSiteData((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        posts: prev.gallery.posts.map((p) => {
          if (p.id !== postId) return p;
          if (field === 'coverImage') {
            return { ...p, coverImage: val, afterImage: val };
          }
          return { ...p, [field]: val };
        }),
      },
    }));
  };

  const addGalleryPost = (post: GalleryPost) => {
    updateSiteData((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        posts: [post, ...prev.gallery.posts],
      },
    }));
  };

  const updateGalleryPost = (updated: GalleryPost) => {
    updateSiteData((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        posts: prev.gallery.posts.map((p) => (p.id === updated.id ? updated : p)),
      },
    }));
  };

  const deleteGalleryPost = (postId: string) => {
    updateSiteData((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        posts: prev.gallery.posts.filter((p) => p.id !== postId),
      },
    }));
  };

  const updatePricingRow = (id: string, field: 'category' | 'standard' | 'price', val: string) => {
    updateSiteData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        rows: prev.pricing.rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
      },
    }));
  };

  const addPricingRow = () => {
    updateSiteData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        rows: [
          ...prev.pricing.rows,
          {
            id: `price-${Date.now()}`,
            category: '새 서비스 항목',
            standard: '기준 설명 입력',
            price: '상담 후 결정',
          },
        ],
      },
    }));
  };

  const deletePricingRow = (id: string) => {
    updateSiteData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        rows: prev.pricing.rows.filter((r) => r.id !== id),
      },
    }));
  };

  const updateReview = (id: string, field: 'content' | 'author' | 'tag', val: string) => {
    updateSiteData((prev) => ({
      ...prev,
      reviews: {
        ...prev.reviews,
        items: prev.reviews.items.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
      },
    }));
  };

  const addReview = () => {
    updateSiteData((prev) => ({
      ...prev,
      reviews: {
        ...prev.reviews,
        items: [
          ...prev.reviews.items,
          {
            id: `rev-${Date.now()}`,
            content: '시공이 꼼꼼하고 유리창이 새것처럼 투명해져서 매우 만족합니다.',
            author: '서울시 고객님',
            rating: 5,
            tag: '유리창 청소',
          },
        ],
      },
    }));
  };

  const deleteReview = (id: string) => {
    updateSiteData((prev) => ({
      ...prev,
      reviews: {
        ...prev.reviews,
        items: prev.reviews.items.filter((r) => r.id !== id),
      },
    }));
  };

  const updateFaq = (id: string, field: 'question' | 'answer', val: string) => {
    updateSiteData((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.map((f) => (f.id === id ? { ...f, [field]: val } : f)),
      },
    }));
  };

  const addFaq = () => {
    updateSiteData((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: [
          ...prev.faq.items,
          {
            id: `faq-${Date.now()}`,
            question: '새 질문을 입력해 주세요.',
            answer: '클릭하여 답변 내용을 바로 작성할 수 있습니다.',
          },
        ],
      },
    }));
  };

  const deleteFaq = (id: string) => {
    updateSiteData((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.filter((f) => f.id !== id),
      },
    }));
  };

  const addRegion = (name: string) => {
    updateSiteData((prev) => {
      if (prev.regions.list.includes(name)) return prev;
      return {
        ...prev,
        regions: {
          ...prev.regions,
          list: [...prev.regions.list, name],
        },
      };
    });
  };

  const removeRegion = (index: number) => {
    updateSiteData((prev) => ({
      ...prev,
      regions: {
        ...prev.regions,
        list: prev.regions.list.filter((_, i) => i !== index),
      },
    }));
  };

  const updateRegionDetail = (regionName: string, detail: RegionDetail) => {
    updateSiteData((prev) => ({
      ...prev,
      regions: {
        ...prev.regions,
        details: {
          ...prev.regions.details,
          [regionName]: detail,
        },
      },
    }));
  };

  const activeService =
    route.type === 'service' || route.type === 'matrix'
      ? siteData.services.items.find((s) => s.id === route.serviceId) ??
        siteData.services.items[0]
      : siteData.services.items[0];

  const activePost =
    route.type === 'gallery_detail'
      ? siteData.gallery.posts.find((p) => p.id === route.postId) ??
        siteData.gallery.posts[0]
      : siteData.gallery.posts[0];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white bg-white">
      {isAdminMode && (
        <AdminToolbar
          isEditMode={isEditMode}
          inquiryCount={inquiries.length}
          codeSyncStatus={codeSyncStatus}
          onSaveNow={() => {
            const stamped: SiteData = {
              ...latestSiteDataRef.current,
              updatedAt: new Date().toISOString(),
            };
            latestSiteDataRef.current = stamped;
            setSiteData(stamped);
            void saveSiteDataToCodebase(stamped);
          }}
          onToggleEditMode={() => setIsEditMode((prev) => !prev)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenInquiries={() => setInquiriesModalOpen(true)}
          onExitAdmin={handleLogoutAdmin}
        />
      )}

      <Header
        company={siteData.company}
        services={siteData.services.items}
        currentPage={route}
        isEditMode={activeEditMode}
        isAdminMode={isAdminMode}
        onUpdateCompany={updateCompany}
        onOpenAdminLogin={() => setLoginModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        onNavigateHome={() => navigateTo({ type: 'home' })}
        onNavigateService={(serviceId) => navigateTo({ type: 'service', serviceId })}
        onNavigateGalleryList={() => navigateTo({ type: 'gallery_list' })}
        onScrollToSection={scrollToSection}
      />

      <main className="flex-1">
        {route.type === 'home' && (
          <>
            <Hero
              hero={siteData.hero}
              company={siteData.company}
              isEditMode={activeEditMode}
              onUpdateHero={updateHero}
              onUpdateStat={updateHeroStat}
              onEditImage={setImageEditTarget}
              onScrollToContact={() => scrollToSection('contact')}
            />
            <ServicesSection
              sectionTitle={siteData.services.sectionTitle}
              sectionSubtitle={siteData.services.sectionSubtitle}
              services={siteData.services.items}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  services: { ...prev.services, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  services: { ...prev.services, sectionSubtitle: val },
                }))
              }
              onUpdateService={updateServiceField}
              onAddService={addService}
              onDeleteService={deleteService}
              onViewDetail={(serviceId) => navigateTo({ type: 'service', serviceId })}
            />
            <ProcessSection
              sectionTitle={siteData.process.sectionTitle}
              sectionSubtitle={siteData.process.sectionSubtitle}
              steps={siteData.process.steps}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  process: { ...prev.process, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  process: { ...prev.process, sectionSubtitle: val },
                }))
              }
              onUpdateStep={updateProcessStep}
            />
            <GallerySection
              sectionTitle={siteData.gallery.sectionTitle}
              sectionSubtitle={siteData.gallery.sectionSubtitle}
              posts={siteData.gallery.posts}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  gallery: { ...prev.gallery, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  gallery: { ...prev.gallery, sectionSubtitle: val },
                }))
              }
              onUpdatePostField={updateGalleryPostField}
              onEditImage={setImageEditTarget}
              onViewGalleryList={() => navigateTo({ type: 'gallery_list' })}
              onSelectPost={(postId) => navigateTo({ type: 'gallery_detail', postId })}
            />
            <PricingSection
              sectionTitle={siteData.pricing.sectionTitle}
              sectionSubtitle={siteData.pricing.sectionSubtitle}
              footerNote={siteData.pricing.footerNote}
              rows={siteData.pricing.rows}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  pricing: { ...prev.pricing, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  pricing: { ...prev.pricing, sectionSubtitle: val },
                }))
              }
              onUpdateFooterNote={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  pricing: { ...prev.pricing, footerNote: val },
                }))
              }
              onUpdateRow={updatePricingRow}
              onAddRow={addPricingRow}
              onDeleteRow={deletePricingRow}
              onScrollToContact={() => scrollToSection('contact')}
            />
            <ReviewsSection
              sectionTitle={siteData.reviews.sectionTitle}
              sectionSubtitle={siteData.reviews.sectionSubtitle}
              reviews={siteData.reviews.items}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  reviews: { ...prev.reviews, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  reviews: { ...prev.reviews, sectionSubtitle: val },
                }))
              }
              onUpdateReview={updateReview}
              onAddReview={addReview}
              onDeleteReview={deleteReview}
            />
            <FaqSection
              sectionTitle={siteData.faq.sectionTitle}
              sectionSubtitle={siteData.faq.sectionSubtitle}
              items={siteData.faq.items}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  faq: { ...prev.faq, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  faq: { ...prev.faq, sectionSubtitle: val },
                }))
              }
              onUpdateFaq={updateFaq}
              onAddFaq={addFaq}
              onDeleteFaq={deleteFaq}
            />
            <RegionsSection
              sectionTitle={siteData.regions.sectionTitle}
              sectionSubtitle={siteData.regions.sectionSubtitle}
              regions={siteData.regions.list}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  regions: { ...prev.regions, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  regions: { ...prev.regions, sectionSubtitle: val },
                }))
              }
              onAddRegion={addRegion}
              onRemoveRegion={removeRegion}
              onViewRegion={(regionName) => navigateTo({ type: 'region', regionName })}
            />
            <ContactSection
              sectionTitle={siteData.contactForm.sectionTitle}
              sectionSubtitle={siteData.contactForm.sectionSubtitle}
              successMessage={siteData.contactForm.successMessage}
              company={siteData.company}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  contactForm: { ...prev.contactForm, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  contactForm: { ...prev.contactForm, sectionSubtitle: val },
                }))
              }
              onUpdateSuccessMessage={(val) =>
                updateSiteData((prev) => ({
                  ...prev,
                  contactForm: { ...prev.contactForm, successMessage: val },
                }))
              }
              onSubmitInquiry={handleInquirySubmit}
            />
          </>
        )}

        {route.type === 'service' && (
          <ServiceDetailPage
            service={activeService}
            allServices={siteData.services.items}
            company={siteData.company}
            isEditMode={activeEditMode}
            onUpdateService={updateFullService}
            onEditImage={setImageEditTarget}
            onBack={() => navigateTo({ type: 'home' })}
            onSelectService={(serviceId) => navigateTo({ type: 'service', serviceId })}
            onSubmitInquiry={handleInquirySubmit}
          />
        )}

        {route.type === 'region' && (
          <RegionDetailPage
            regionName={route.regionName}
            regionDetail={siteData.regions.details[route.regionName]}
            allServices={siteData.services.items}
            company={siteData.company}
            isEditMode={activeEditMode}
            onUpdateRegionDetail={updateRegionDetail}
            onBack={() => navigateTo({ type: 'home' })}
            onSelectMatrix={(regionName, serviceId) =>
              navigateTo({ type: 'matrix', regionName, serviceId })
            }
            onSubmitInquiry={handleInquirySubmit}
          />
        )}

        {route.type === 'matrix' && (
          <MatrixPage
            regionName={route.regionName}
            regionDetail={siteData.regions.details[route.regionName]}
            service={activeService}
            company={siteData.company}
            isEditMode={activeEditMode}
            onUpdateService={updateFullService}
            onEditImage={setImageEditTarget}
            onBack={() => navigateTo({ type: 'home' })}
            onNavigateRegion={(regionName) => navigateTo({ type: 'region', regionName })}
            onNavigateService={(serviceId) => navigateTo({ type: 'service', serviceId })}
            onSubmitInquiry={handleInquirySubmit}
          />
        )}

        {route.type === 'gallery_list' && (
          <GalleryListPage
            posts={siteData.gallery.posts}
            isEditMode={activeEditMode}
            onAddPost={addGalleryPost}
            onUpdatePost={updateGalleryPost}
            onDeletePost={deleteGalleryPost}
            onUploadImage={uploadImageToCodebase}
            onBackHome={() => navigateTo({ type: 'home' })}
            onSelectPost={(postId) => navigateTo({ type: 'gallery_detail', postId })}
          />
        )}

        {route.type === 'gallery_detail' && activePost && (
          <GalleryDetailPage
            post={activePost}
            allPosts={siteData.gallery.posts}
            company={siteData.company}
            isEditMode={activeEditMode}
            onUpdatePost={updateGalleryPost}
            onEditImage={setImageEditTarget}
            onUploadImage={uploadImageToCodebase}
            onBackToList={() => navigateTo({ type: 'gallery_list' })}
            onSelectPost={(postId) => navigateTo({ type: 'gallery_detail', postId })}
            onSubmitInquiry={handleInquirySubmit}
          />
        )}

      </main>

      <Footer
        company={siteData.company}
        isEditMode={activeEditMode}
        isAdminMode={isAdminMode}
        onUpdateCompany={updateCompany}
        onOpenAdminLogin={() => setLoginModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        onScrollToSection={scrollToSection}
      />
      <MobileFloatingCta
        company={siteData.company}
        onOpenQuote={() => scrollToSection('contact')}
      />

      <AdminLoginModal
        isOpen={loginModalOpen}
        expectedPin={siteData.adminPin}
        onClose={() => {
          setLoginModalOpen(false);
          clearAdminHash();
        }}
        onSuccess={handleAdminLoginSuccess}
      />

      {isAdminMode && (
        <>
          <ImageEditorModal
            target={imageEditTarget}
            onUploadImage={uploadImageToCodebase}
            onClose={() => setImageEditTarget(null)}
          />
          <InquiriesModal
            isOpen={inquiriesModalOpen}
            inquiries={inquiries}
            onClose={() => setInquiriesModalOpen(false)}
            onToggleStatus={(id) =>
              setInquiries((prev) =>
                prev.map((item) =>
                  item.id === id
                    ? { ...item, status: item.status === '대기중' ? '상담완료' : '대기중' }
                    : item
                )
              )
            }
            onDelete={(id) => setInquiries((prev) => prev.filter((item) => item.id !== id))}
          />
          <SiteSettingsModal
            isOpen={settingsModalOpen}
            siteData={siteData}
            currentRoute={route}
            canWriteCode={canWriteCode}
            onUploadImage={uploadImageToCodebase}
            onSuggestSeoKeywords={async (payload) => {
              if (!canWriteCode || !isAdminMode) {
                const regionToken =
                  payload.region.split(/[·,\s/]+/).find((t) => t.trim().length >= 2) || '서울';
                const combined = `${payload.pageLabel} ${payload.title} ${payload.description}`;
                const suggestions: SeoKeywordSuggestion[] = [
                  {
                    keyword: `${regionToken} 유리창청소`,
                    intent: '지역검색',
                    reason: '지역명과 핵심 서비스가 결합되어 네이버·구글 지역 검색 유입이 높습니다.',
                  },
                  {
                    keyword: `${regionToken} 외벽청소 업체`,
                    intent: '지역검색',
                    reason: '시공 업체를 찾는 지역 고객의 비교 검색에 최적화되어 있습니다.',
                  },
                  {
                    keyword: '상가 유리창청소 비용',
                    intent: '롱테일·문의',
                    reason: '견적 문의 직전 단계의 점주·매니저가 자주 검색하는 키워드입니다.',
                  },
                  {
                    keyword: '매장 쇼윈도 청소',
                    intent: '서비스핵심',
                    reason: '카페·로드샵 등 고정 수요층 타겟팅에 유리합니다.',
                  },
                  {
                    keyword: '고층 건물 외벽청소',
                    intent: '서비스핵심',
                    reason: '오피스텔·빌딩 시설 관리 담당자 검색 의도와 맞닿아 있습니다.',
                  },
                  {
                    keyword: '유리창 물때 찌든때 제거',
                    intent: '롱테일·문의',
                    reason: '구체적인 오염 고민을 검색하는 실수요자 유입 키워드입니다.',
                  },
                  {
                    keyword: '유리 발수코팅 시공',
                    intent: '서비스핵심',
                    reason: '추가 시공 옵션을 함께 문의하도록 유도하는 고부가 키워드입니다.',
                  },
                  {
                    keyword: `${payload.companyName || '클리어웍스'} 견적문의`,
                    intent: '브랜드·신뢰',
                    reason: '브랜드명 직접 검색 및 신뢰도 기반 전환에 도움을 줍니다.',
                  },
                ];
                if (combined.includes('썬팅') || combined.includes('스티커')) {
                  suggestions.unshift({
                    keyword: '유리창 썬팅 시트지 제거',
                    intent: '서비스핵심',
                    reason: '원상복구·이전 시즌 검색 수요가 집중되는 핵심 작업 키워드입니다.',
                  });
                }
                return {
                  ok: true,
                  source: 'smart-local',
                  suggestions: suggestions.slice(0, 10),
                };
              }

              try {
                const res = await fetch('/api/admin/suggest-seo-keywords', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-admin-pin': verifiedPinRef.current,
                  },
                  body: JSON.stringify(payload),
                });
                const json = (await res.json()) as {
                  ok?: boolean;
                  source?: string;
                  suggestions?: SeoKeywordSuggestion[];
                  error?: string;
                };
                if (!res.ok || !json.ok) {
                  return { ok: false, error: json.error || 'AI 키워드 추천 요청에 실패했습니다.' };
                }
                return {
                  ok: true,
                  source: json.source,
                  suggestions: json.suggestions || [],
                };
              } catch {
                return { ok: false, error: '네트워크 오류로 키워드를 불러오지 못했습니다.' };
              }
            }}
            onSaveSettings={handleSaveSettings}
            onGenerateSitemap={async (baseUrl, includeMatrix) => {
              if (!canWriteCode || !isAdminMode) {
                return { ok: false, error: '배포 환경에서는 다운로드를 이용해 주세요.' };
              }
              try {
                const res = await fetch('/api/admin/generate-sitemap', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-admin-pin': verifiedPinRef.current,
                  },
                  body: JSON.stringify({ baseUrl, includeMatrix }),
                });
                const json = (await res.json()) as {
                  ok?: boolean;
                  count?: number;
                  baseUrl?: string;
                  error?: string;
                };
                if (!res.ok || !json.ok) {
                  return { ok: false, error: json.error || '생성 실패' };
                }
                if (json.baseUrl) {
                  hasUserEditedRef.current = false;
                  setSiteData((prev) => ({ ...prev, siteUrl: json.baseUrl }));
                }
                return { ok: true, count: json.count };
              } catch {
                return { ok: false, error: '네트워크 오류가 발생했습니다.' };
              }
            }}
            onClose={() => setSettingsModalOpen(false)}
            onUpdateSiteData={updateSiteData}
            onResetDefaults={() => {
              void handleSaveSettings({
                ...DEFAULT_SITE_DATA,
                updatedAt: new Date().toISOString(),
              });
            }}
          />
        </>
      )}
    </div>
  );
}
