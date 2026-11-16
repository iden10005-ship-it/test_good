import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Compass,
  Eye,
  Globe,
  Home,
  Inbox,
  LayoutGrid,
  Loader2,
  LogOut,
  Pencil,
  Save,
  Settings,
  Shield,
} from 'lucide-react';
import type { PageRoute, ServiceItem } from '@/src/types/clearworks';

export type CodeSyncStatus = 'checking' | 'saved' | 'saving' | 'unsynced' | 'readonly' | 'error';

interface AdminToolbarProps {
  isEditMode: boolean;
  inquiryCount: number;
  codeSyncStatus: CodeSyncStatus;
  regions: string[];
  services: ServiceItem[];
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  onSaveNow: () => void;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
  onOpenInquiries: () => void;
  onExitAdmin: () => void;
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  isEditMode,
  inquiryCount,
  codeSyncStatus,
  regions,
  services,
  currentRoute,
  onNavigate,
  onSaveNow,
  onToggleEditMode,
  onOpenSettings,
  onOpenInquiries,
  onExitAdmin,
}) => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  useEffect(() => {
    if (currentRoute.type === 'region') {
      setSelectedRegion(currentRoute.regionName);
      setSelectedServiceId('');
    } else if (currentRoute.type === 'service') {
      setSelectedRegion('');
      setSelectedServiceId(currentRoute.serviceId);
    } else if (currentRoute.type === 'matrix') {
      setSelectedRegion(currentRoute.regionName);
      setSelectedServiceId(currentRoute.serviceId);
    } else {
      setSelectedRegion('');
      setSelectedServiceId('');
    }
  }, [currentRoute]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reg = e.target.value;
    setSelectedRegion(reg);
    if (!reg && !selectedServiceId) {
      onNavigate({ type: 'home' });
    } else if (reg && selectedServiceId) {
      onNavigate({ type: 'matrix', regionName: reg, serviceId: selectedServiceId });
    } else if (reg && !selectedServiceId) {
      onNavigate({ type: 'region', regionName: reg });
    } else if (!reg && selectedServiceId) {
      onNavigate({ type: 'service', serviceId: selectedServiceId });
    }
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const srvId = e.target.value;
    setSelectedServiceId(srvId);
    if (!selectedRegion && !srvId) {
      onNavigate({ type: 'home' });
    } else if (selectedRegion && srvId) {
      onNavigate({ type: 'matrix', regionName: selectedRegion, serviceId: srvId });
    } else if (selectedRegion && !srvId) {
      onNavigate({ type: 'region', regionName: selectedRegion });
    } else if (!selectedRegion && srvId) {
      onNavigate({ type: 'service', serviceId: srvId });
    }
  };

  const getRouteBadgeLabel = (): string => {
    switch (currentRoute.type) {
      case 'home':
        return '/';
      case 'gallery_list':
        return '/gallery';
      case 'gallery_detail':
        return `/gallery/${currentRoute.postId}`;
      case 'service':
        return `/service/${currentRoute.serviceId}`;
      case 'region':
        return `/region/${currentRoute.regionName}`;
      case 'matrix':
        return `/region/${currentRoute.regionName}/service/${currentRoute.serviceId}`;
    }
  };

  return (
    <div className="bg-slate-950 text-white border-b border-slate-800 px-3 sm:px-6 py-2.5 z-[60] space-y-2">
      {/* Row 1: Admin Mode status & main management actions */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-400">
            <Shield className="w-4 h-4 shrink-0" />
            <span>관리자 모드</span>
          </div>

          {codeSyncStatus === 'saving' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px] font-bold">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>프리뷰 저장 중...</span>
            </span>
          )}
          {codeSyncStatus === 'saved' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>프리뷰 저장 완료</span>
            </span>
          )}
          {codeSyncStatus === 'unsynced' && (
            <button
              type="button"
              onClick={onSaveNow}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold cursor-pointer"
            >
              <span>서버 반영 대기 (클릭 저장)</span>
            </button>
          )}

          <span className="text-slate-700 hidden lg:inline">|</span>
          <span className="text-[11px] text-slate-400 hidden lg:inline">
            편집 내용은 프리뷰에 자동 저장됩니다. (GitHub 반영은 채팅으로 요청하세요)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {codeSyncStatus !== 'readonly' && (
            <button
              type="button"
              onClick={onSaveNow}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>프리뷰 저장</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleEditMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              isEditMode
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isEditMode ? '편집 중 (미리보기 전환)' : '바로 편집 켜기'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenInquiries}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Inbox className="w-3.5 h-3.5 text-blue-400" />
            <span>견적문의</span>
            <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[10px] tabular-nums">
              {inquiryCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span>사이트 설정</span>
          </button>

          <button
            type="button"
            onClick={onExitAdmin}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/70 text-slate-300 hover:text-red-300 border border-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>관리자 종료</span>
          </button>
        </div>
      </div>

      {/* Row 2: Region + Service navigation bar */}
      <div className="max-w-7xl mx-auto pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 text-blue-300 border border-blue-800/60 text-xs font-bold shadow-xs">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>지역 + 서비스 복합 이동</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 text-xs font-mono shadow-xs">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{getRouteBadgeLabel()}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate({ type: 'home' })}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>홈</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate({ type: 'gallery_list' })}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
            <span>작업 갤러리</span>
          </button>

          <select
            value={selectedRegion}
            onChange={handleRegionChange}
            aria-label="지역 선택"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-100 border border-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
          >
            <option value="">-- 지역 선택 (전체) --</option>
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>

          <select
            value={selectedServiceId}
            onChange={handleServiceChange}
            aria-label="서비스 항목 선택"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-100 border border-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
          >
            <option value="">-- 서비스 항목 선택 --</option>
            {services.map((srv) => (
              <option key={srv.id} value={srv.id}>
                {srv.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
