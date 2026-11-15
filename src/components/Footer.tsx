import React from 'react';
import { ArrowUp, Lock, Sparkles } from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { CompanyInfo } from '@/src/types/clearworks';

interface FooterProps {
  company: CompanyInfo;
  isEditMode: boolean;
  isAdminMode: boolean;
  onUpdateCompany: (field: keyof CompanyInfo, value: string) => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  company,
  isEditMode,
  isAdminMode,
  onUpdateCompany,
  onOpenAdminLogin,
  onLogoutAdmin,
  onScrollToSection,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 pb-24 md:pb-12 border-t border-slate-900 text-xs sm:text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight block leading-tight">
                <EditableText
                  value={company.name}
                  onSave={(v) => onUpdateCompany('name', v)}
                  isEditMode={isEditMode}
                  label="업체명 수정"
                />
              </span>
              <span className="text-xs text-slate-500 block">
                프리미엄 윈도우 케어 &amp; 외벽 청소 솔루션
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onScrollToSection('service')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              서비스
            </button>
            <button
              type="button"
              onClick={() => onScrollToSection('price')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              가격안내
            </button>
            <button
              type="button"
              onClick={() => onScrollToSection('faq')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              자주 묻는 질문
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs cursor-pointer"
              title="맨 위로"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>TOP</span>
            </button>
          </div>
        </div>

        <div className="pt-6 space-y-2 text-slate-500 text-xs leading-relaxed">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong className="text-slate-300 font-bold">
              <EditableText
                value={company.name}
                onSave={(v) => onUpdateCompany('name', v)}
                isEditMode={isEditMode}
                label="상호명 수정"
              />
            </strong>
            <span>·</span>
            <span>
              대표:{' '}
              <EditableText
                value={company.representative}
                onSave={(v) => onUpdateCompany('representative', v)}
                isEditMode={isEditMode}
                label="대표자명 수정"
              />
            </span>
            <span>·</span>
            <span className="tabular-nums">
              사업자등록번호:{' '}
              <EditableText
                value={company.bizNumber}
                onSave={(v) => onUpdateCompany('bizNumber', v)}
                isEditMode={isEditMode}
                label="사업자등록번호 수정"
              />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              사업장 주소:{' '}
              <EditableText
                value={company.address}
                onSave={(v) => onUpdateCompany('address', v)}
                isEditMode={isEditMode}
                label="사업장 주소 수정"
              />
            </span>
            <span>·</span>
            <span>
              전화:{' '}
              <a
                href={`tel:${company.phone}`}
                className="text-slate-400 hover:text-white tabular-nums"
              >
                <EditableText
                  value={company.phone}
                  onSave={(v) => onUpdateCompany('phone', v)}
                  isEditMode={isEditMode}
                  label="대표 전화번호 수정"
                />
              </a>
            </span>
            <span>·</span>
            <span>
              운영시간:{' '}
              <EditableText
                value={company.operatingHours}
                onSave={(v) => onUpdateCompany('operatingHours', v)}
                isEditMode={isEditMode}
                label="운영시간 수정"
              />
            </span>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-slate-600 gap-2">
            <p>© 2026 {company.name}. All rights reserved.</p>
            <div className="flex items-center gap-3 text-[11px]">
              <span>배상책임보험 가입 업체 | 안전시공 인증</span>
              {!isAdminMode ? (
                <button
                  type="button"
                  onClick={onOpenAdminLogin}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer"
                  title="관리자 모드 로그인"
                >
                  <Lock className="w-3 h-3" />
                  <span>관리자</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLogoutAdmin}
                  className="inline-flex items-center gap-1 text-emerald-500 hover:text-emerald-300 transition-colors font-semibold cursor-pointer"
                  title="관리자 모드 종료"
                >
                  <Lock className="w-3 h-3" />
                  <span>관리자 접속 중 · 종료</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
