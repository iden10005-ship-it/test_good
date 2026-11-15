import React from 'react';
import {
  Building2,
  Home,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
} from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ServiceIconName, ServiceItem } from '@/src/types/clearworks';

interface ServicesSectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  services: ServiceItem[];
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdateService: (id: string, field: 'title' | 'description' | 'badge', val: string) => void;
  onAddService: () => void;
  onDeleteService: (id: string) => void;
  onViewDetail: (serviceId: string) => void;
}

const ICON_MAP: Record<ServiceIconName, React.ReactNode> = {
  Home: <Home className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />,
  Store: <Store className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />,
  Building2: <Building2 className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />,
  Sparkles: <Sparkles className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />,
  Layers: <Layers className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />,
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  services,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateService,
  onAddService,
  onDeleteService,
  onViewDetail,
}) => {
  return (
    <section id="service" className="py-16 md:py-28 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2 block">
            Our Services
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
            <EditableText
              value={sectionTitle}
              onSave={onUpdateTitle}
              isEditMode={isEditMode}
              label="서비스 섹션 제목 수정"
            />
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            <EditableText
              value={sectionSubtitle}
              onSave={onUpdateSubtitle}
              isEditMode={isEditMode}
              label="서비스 섹션 부제목 수정"
            />
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => onViewDetail(service.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewDetail(service.id);
                }
              }}
              role="button"
              tabIndex={0}
              className="group bg-slate-50/70 hover:bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100/70 group-hover:bg-blue-600 flex items-center justify-center transition-colors shadow-2xs shrink-0">
                    {ICON_MAP[service.iconName]}
                  </div>
                  {(service.badge || isEditMode) && (
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100/80 text-blue-700 whitespace-nowrap">
                      <EditableText
                        value={service.badge || '뱃지 추가'}
                        onSave={(v) => onUpdateService(service.id, 'badge', v)}
                        isEditMode={isEditMode}
                        label="서비스 뱃지 수정"
                      />
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5 group-hover:text-blue-600 transition-colors">
                  <EditableText
                    value={service.title}
                    onSave={(v) => onUpdateService(service.id, 'title', v)}
                    isEditMode={isEditMode}
                    label="서비스 제목 수정"
                  />
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <EditableText
                    value={service.description}
                    onSave={(v) => onUpdateService(service.id, 'description', v)}
                    isEditMode={isEditMode}
                    label="서비스 설명 수정"
                    multiline
                  />
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-800 transition-colors">
                  <span>상세보기 및 작업범위</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </span>

                {isEditMode && services.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteService(service.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>삭제</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {isEditMode && (
            <button
              type="button"
              onClick={onAddService}
              className="rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/60 p-6 flex flex-col items-center justify-center text-blue-600 gap-2 min-h-[220px] transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm">새 서비스 항목 추가하기</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
