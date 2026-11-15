import React from 'react';
import {
  CheckCircle2,
  Eye,
  Inbox,
  Loader2,
  LogOut,
  Pencil,
  Save,
  Settings,
  Shield,
} from 'lucide-react';

export type CodeSyncStatus = 'checking' | 'saved' | 'saving' | 'unsynced' | 'readonly' | 'error';

interface AdminToolbarProps {
  isEditMode: boolean;
  inquiryCount: number;
  codeSyncStatus: CodeSyncStatus;
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
  onSaveNow,
  onToggleEditMode,
  onOpenSettings,
  onOpenInquiries,
  onExitAdmin,
}) => {
  return (
    <div className="bg-slate-950 text-white border-b border-slate-800 px-3 sm:px-6 py-2.5 z-[60]">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
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
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold"
              title="현재 프리뷰 서버에 저장되었습니다. GitHub 반영은 채팅으로 요청해 주세요."
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>프리뷰 저장 완료</span>
            </span>
          )}
          {codeSyncStatus === 'unsynced' && (
            <button
              type="button"
              onClick={onSaveNow}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold cursor-pointer transition-colors"
              title="브라우저에 남은 수정사항을 프리뷰 서버에 저장합니다"
            >
              <span>서버 반영 대기중 (클릭 저장)</span>
            </button>
          )}
          {codeSyncStatus === 'readonly' && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-bold"
              title="GitHub Pages/Vercel에서는 브라우저에만 임시 저장됩니다."
            >
              <span>배포 미리보기 (브라우저 임시저장)</span>
            </span>
          )}
          {codeSyncStatus === 'error' && (
            <button
              type="button"
              onClick={onSaveNow}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-bold cursor-pointer"
            >
              <span>저장 오류 (재시도)</span>
            </button>
          )}

          <span className="text-slate-600 hidden lg:inline">|</span>
          <span className="text-[11px] text-slate-400 hidden lg:inline">
            {isEditMode
              ? '편집 내용은 프리뷰에 자동 저장됩니다. (GitHub 반영은 채팅으로 요청하세요)'
              : '방문자 화면 미리보기 중입니다.'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {codeSyncStatus !== 'readonly' && (
            <button
              type="button"
              onClick={onSaveNow}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              title="수정된 내용을 프리뷰 서버에 즉시 저장합니다"
            >
              <Save className="w-3.5 h-3.5" />
              <span>프리뷰 저장</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleEditMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              isEditMode
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {isEditMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>편집 중 (미리보기 전환)</span>
              </>
            ) : (
              <>
                <Pencil className="w-3.5 h-3.5" />
                <span>바로 편집 켜기</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenInquiries}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
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
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span>사이트 설정</span>
          </button>

          <button
            type="button"
            onClick={onExitAdmin}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/70 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>관리자 종료</span>
          </button>
        </div>
      </div>
    </div>
  );
};
