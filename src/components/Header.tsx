import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Lock,
  Menu,
  MessageCircle,
  Phone,
  Sparkles,
  X,
} from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { CompanyInfo, PageRoute, ServiceItem } from '@/src/types/clearworks';

interface HeaderProps {
  company: CompanyInfo;
  services: ServiceItem[];
  currentPage: PageRoute;
  isEditMode: boolean;
  isAdminMode: boolean;
  onUpdateCompany: (field: keyof CompanyInfo, value: string) => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onNavigateHome: () => void;
  onNavigateService: (serviceId: string) => void;
  onNavigateGalleryList: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  company,
  services,
  currentPage,
  isEditMode,
  isAdminMode,
  onUpdateCompany,
  onOpenAdminLogin,
  onLogoutAdmin,
  onNavigateHome,
  onNavigateService,
  onNavigateGalleryList,
  onScrollToSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSectionLink = (sectionId: string) => {
    setMobileMenuOpen(false);
    setServiceDropdownOpen(false);
    onScrollToSection(sectionId);
  };

  const handleGoHome = () => {
    setMobileMenuOpen(false);
    setServiceDropdownOpen(false);
    onNavigateHome();
  };

  return (
    <>
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="font-medium text-slate-200 truncate">
              <EditableText
                value={company.region}
                onSave={(v) => onUpdateCompany('region', v)}
                isEditMode={isEditMode}
                label="대표 지역 수정"
              />{' '}
              전지역 무료 견적 출장
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <span className="text-slate-400 hidden sm:inline whitespace-nowrap">
              운영시간:{' '}
              <EditableText
                value={company.operatingHours}
                onSave={(v) => onUpdateCompany('operatingHours', v)}
                isEditMode={isEditMode}
                label="운영시간 수정"
              />
            </span>
            <a
              href={`tel:${company.phone}`}
              className="font-bold text-white hover:text-blue-400 flex items-center gap-1.5 transition-colors whitespace-nowrap tabular-nums"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <EditableText
                value={company.phone}
                onSave={(v) => onUpdateCompany('phone', v)}
                isEditMode={isEditMode}
                label="대표 전화번호 수정"
              />
            </a>
            {!isAdminMode ? (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors pl-2 border-l border-slate-700 font-semibold text-[11px] cursor-pointer"
                title="관리자 모드 로그인"
              >
                <Lock className="w-3 h-3 text-blue-400" />
                <span>관리자</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-200 transition-colors pl-2 border-l border-slate-700 font-semibold text-[11px] cursor-pointer"
                title="관리자 모드 종료"
              >
                <Lock className="w-3 h-3" />
                <span>관리자 종료</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header
        className={`sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : 'shadow-2xs'
        }`}
      >
        <nav
          aria-label="주 메뉴"
          className={`max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 transition-all duration-200 ${
            scrolled ? 'py-2.5' : 'py-3 sm:py-3.5'
          }`}
        >
          {/* Brand Logo */}
          <div
            onClick={handleGoHome}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleGoHome();
              }
            }}
            className="flex items-center gap-2.5 group cursor-pointer select-none text-left shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                <EditableText
                  value={company.name}
                  onSave={(v) => onUpdateCompany('name', v)}
                  isEditMode={isEditMode}
                  label="업체명 수정"
                />
              </span>
              <span className="text-[10px] text-blue-600 font-bold tracking-wider uppercase mt-0.5">
                Glass Cleaning Specialist
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={handleGoHome}
              className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentPage.type === 'home'
                  ? 'text-blue-600 bg-blue-50/70'
                  : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              홈
            </button>

            <div
              className="relative"
              onMouseEnter={() => setServiceDropdownOpen(true)}
              onMouseLeave={() => setServiceDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => handleSectionLink('service')}
                aria-expanded={serviceDropdownOpen}
                className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                  currentPage.type === 'service'
                    ? 'text-blue-600 bg-blue-50/70'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <span>서비스</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {serviceDropdownOpen && (
                <div className="absolute top-full left-0 w-64 pt-1.5 z-50">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2">
                    <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider border-b border-slate-100 mb-1">
                      전문 서비스 목록
                    </div>
                    {services.map((srv) => (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => {
                          setServiceDropdownOpen(false);
                          onNavigateService(srv.id);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span>{srv.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleSectionLink('process')}
              className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              작업과정
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (currentPage.type === 'home') {
                  handleSectionLink('gallery');
                } else {
                  onNavigateGalleryList();
                }
              }}
              className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentPage.type === 'gallery_list' || currentPage.type === 'gallery_detail'
                  ? 'text-blue-600 bg-blue-50/70'
                  : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              작업갤러리
            </button>

            <button
              type="button"
              onClick={() => handleSectionLink('price')}
              className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              가격안내
            </button>

            <button
              type="button"
              onClick={() => handleSectionLink('faq')}
              className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              FAQ
            </button>

            <button
              type="button"
              onClick={() => handleSectionLink('regions')}
              className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentPage.type === 'region' || currentPage.type === 'matrix'
                  ? 'text-blue-600 bg-blue-50/70'
                  : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              서비스지역
            </button>

            <button
              type="button"
              onClick={() => handleSectionLink('contact')}
              className="ml-1 px-4 py-2 text-sm font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-xl transition-all border border-blue-200 hover:border-blue-600 whitespace-nowrap shrink-0 cursor-pointer"
            >
              무료견적
            </button>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <a
              href={company.kakaoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-[#FEE500] hover:bg-[#fada0a] text-[#3c1e1e] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
              title="카카오톡 1:1 상담"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>카톡 문의</span>
            </a>
            <a
              href={`tel:${company.phone}`}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 whitespace-nowrap shrink-0 tabular-nums"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{company.phone}</span>
            </a>
          </div>

          {/* Mobile Controls */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <a
              href={`tel:${company.phone}`}
              className="w-11 h-11 rounded-xl bg-blue-600 text-white shadow-xs flex items-center justify-center sm:hidden"
              aria-label="전화 걸기"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 shadow-2xl max-h-[78vh] overflow-y-auto">
            <div className="space-y-1 mb-4">
              <button
                type="button"
                onClick={handleGoHome}
                className="w-full text-left px-3.5 py-3 text-base font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
              >
                홈으로
              </button>
              <button
                type="button"
                onClick={() => handleSectionLink('service')}
                className="w-full text-left px-3.5 py-3 text-base font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
              >
                서비스 안내
              </button>
              <div className="pl-3 space-y-1 pb-2">
                {services.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateService(srv.id);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg flex items-center justify-between"
                  >
                    <span>· {srv.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleSectionLink('process')}
                className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                작업과정
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateGalleryList();
                }}
                className="w-full text-left px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                작업갤러리 (현장일지)
              </button>
              <button
                type="button"
                onClick={() => handleSectionLink('price')}
                className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                가격안내
              </button>
              <button
                type="button"
                onClick={() => handleSectionLink('faq')}
                className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                자주 묻는 질문 (FAQ)
              </button>
              <button
                type="button"
                onClick={() => handleSectionLink('regions')}
                className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                서비스 지역 안내
              </button>
              <button
                type="button"
                onClick={() => handleSectionLink('contact')}
                className="w-full text-left px-3.5 py-3 text-base font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                무료 견적 신청하기
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
              <a
                href={`tel:${company.phone}`}
                className="py-3 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>전화 상담</span>
              </a>
              <a
                href={company.kakaoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 rounded-xl bg-[#FEE500] text-[#3c1e1e] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>카톡 1:1 문의</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
