import React from 'react';
import { Award, CheckCircle2, Image as ImageIcon, MessageCircle, Phone, ShieldCheck, Star } from 'lucide-react';
import { BeforeAfterSlider } from '@/src/components/BeforeAfterSlider';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import { CLEARWORKS_IMAGES } from '@/src/data/clearworksData';
import type { CompanyInfo, HeroData } from '@/src/types/clearworks';

interface HeroProps {
  hero: HeroData;
  company: CompanyInfo;
  isEditMode: boolean;
  onUpdateHero: (field: keyof HeroData, value: string) => void;
  onUpdateStat: (statId: string, field: 'value' | 'label', value: string) => void;
  onEditImage: (target: ImageEditTarget) => void;
  onScrollToContact: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  hero,
  company,
  isEditMode,
  onUpdateHero,
  onUpdateStat,
  onEditImage,
  onScrollToContact,
}) => {
  const statIcons = [
    <CheckCircle2 key="s1" className="w-5 h-5 text-blue-600" />,
    <Award key="s2" className="w-5 h-5 text-indigo-600" />,
    <ShieldCheck key="s3" className="w-5 h-5 text-emerald-600" />,
    <Star key="s4" className="w-5 h-5 text-amber-500 fill-amber-400" />,
  ];

  return (
    <section
      id="top"
      className="pt-8 pb-14 md:pt-14 md:pb-24 bg-gradient-to-b from-blue-50/60 via-white to-slate-50 relative overflow-hidden"
    >
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-300/20 to-cyan-300/20 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-semibold mb-4 border border-blue-200/60 shadow-2xs">
            <EditableText
              value={hero.badgeText}
              onSave={(v) => onUpdateHero('badgeText', v)}
              isEditMode={isEditMode}
              label="상단 뱃지 수정"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.2] mb-4 sm:mb-5 whitespace-pre-line">
            <EditableText
              value={hero.title}
              onSave={(v) => onUpdateHero('title', v)}
              isEditMode={isEditMode}
              label="메인 헤드라인 수정"
              multiline
              as="div"
            />
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed font-normal mb-7 sm:mb-8 max-w-2xl mx-auto">
            <EditableText
              value={hero.subtitle}
              onSave={(v) => onUpdateHero('subtitle', v)}
              isEditMode={isEditMode}
              label="서브 카피 수정"
              multiline
            />
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-3.5 mb-8">
            <a
              href={`tel:${company.phone}`}
              className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 whitespace-nowrap"
            >
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              <EditableText
                value={hero.callButtonText}
                onSave={(v) => onUpdateHero('callButtonText', v)}
                isEditMode={isEditMode}
                label="전화 버튼 문구 수정"
              />
            </a>

            <a
              href={company.kakaoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#3c1e1e] font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <EditableText
                value={hero.kakaoButtonText}
                onSave={(v) => onUpdateHero('kakaoButtonText', v)}
                isEditMode={isEditMode}
                label="카카오톡 버튼 문구 수정"
              />
            </a>

            <button
              type="button"
              onClick={onScrollToContact}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm sm:text-base border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer whitespace-nowrap"
            >
              빠른 온라인 견적
            </button>
          </div>
        </div>

        {/* Before / After Showcase */}
        <div className="relative max-w-4xl mx-auto mb-10 sm:mb-12">
          <div className="p-2 sm:p-3 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200/80">
            <BeforeAfterSlider
              beforeImage={hero.beforeImage}
              afterImage={hero.afterImage}
              beforeLabel={hero.beforeLabel}
              afterLabel={hero.afterLabel}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-3 px-2 gap-2">
            <p className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
              <EditableText
                value={hero.beforeAfterNotice}
                onSave={(v) => onUpdateHero('beforeAfterNotice', v)}
                isEditMode={isEditMode}
                label="전후 비교 안내 문구 수정"
              />
            </p>

            {isEditMode && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onEditImage({
                      title: '메인 청소 전(Before) 사진 변경',
                      currentUrl: hero.beforeImage,
                      defaultUrl: CLEARWORKS_IMAGES.beforeHero,
                      onSave: (url) => onUpdateHero('beforeImage', url),
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>청소 전 사진 변경</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onEditImage({
                      title: '메인 청소 후(After) 사진 변경',
                      currentUrl: hero.afterImage,
                      defaultUrl: CLEARWORKS_IMAGES.afterHero,
                      onSave: (url) => onUpdateHero('afterImage', url),
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>청소 후 사진 변경</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Trust Stats 4-Column Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {hero.stats.map((stat, idx) => (
            <div
              key={stat.id}
              className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center mb-2.5">
                {statIcons[idx % statIcons.length]}
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                <EditableText
                  value={stat.value}
                  onSave={(v) => onUpdateStat(stat.id, 'value', v)}
                  isEditMode={isEditMode}
                  label={`${stat.label} 수치 수정`}
                />
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                <EditableText
                  value={stat.label}
                  onSave={(v) => onUpdateStat(stat.id, 'label', v)}
                  isEditMode={isEditMode}
                  label="통계 라벨 수정"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
