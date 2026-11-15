import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { BeforeAfterSlider } from '@/src/components/BeforeAfterSlider';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import type {
  CompanyInfo,
  InquiryPayload,
  RegionDetail,
  ServiceItem,
} from '@/src/types/clearworks';

interface MatrixPageProps {
  regionName: string;
  regionDetail?: RegionDetail;
  service: ServiceItem;
  company: CompanyInfo;
  isEditMode?: boolean;
  onUpdateService?: (updated: ServiceItem) => void;
  onEditImage?: (target: ImageEditTarget) => void;
  onBack: () => void;
  onNavigateRegion: (regionName: string) => void;
  onNavigateService: (serviceId: string) => void;
  onSubmitInquiry: (payload: InquiryPayload) => void;
}

export const MatrixPage: React.FC<MatrixPageProps> = ({
  regionName,
  regionDetail,
  service,
  company,
  isEditMode = false,
  onUpdateService,
  onEditImage,
  onBack,
  onNavigateRegion,
  onNavigateService,
  onSubmitInquiry,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [content, setContent] = useState(
    `${regionName} ${service.title} 무료 출장 견적을 문의드립니다.`
  );
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setContent(`${regionName} ${service.title} 무료 출장 견적을 문의드립니다.`);
    setSent(false);
  }, [regionName, service.title]);

  const subDistricts = regionDetail?.subDistricts ?? [`${regionName} 전지역`];

  const updateDetail = (patch: Partial<ServiceItem['detail']>) => {
    if (!onUpdateService) return;
    onUpdateService({
      ...service,
      detail: { ...service.detail, ...patch },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmitInquiry({
      name,
      phone,
      region: regionName,
      buildingType: service.title,
      content,
    });
    setSent(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>메인으로 돌아가기</span>
          </button>

          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5 font-medium">
            <button
              type="button"
              onClick={() => onNavigateRegion(regionName)}
              className="hover:underline cursor-pointer"
            >
              {regionName}
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => onNavigateService(service.id)}
              className="hover:underline cursor-pointer"
            >
              {service.title}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/90 shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{regionName} 전담팀 직영 출장</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug mb-3">
            {regionName} {service.title} 전문 | {company.name}
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-blue-600 font-bold mb-3">
            <EditableText
              value={service.detail.tagline}
              onSave={(v) => updateDetail({ tagline: v })}
              isEditMode={isEditMode && !!onUpdateService}
              label="서비스 슬로건 수정"
              multiline
            />
          </p>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
            {regionName}({subDistricts.slice(0, 6).join(', ')} 등) 전지역에서 {service.title} 시공을 진행합니다.{' '}
            <EditableText
              value={service.detail.duration}
              onSave={(v) => updateDetail({ duration: v })}
              isEditMode={isEditMode && !!onUpdateService}
              label="소요 시간 수정"
            />{' '}
            ·{' '}
            <EditableText
              value={service.detail.priceGuide}
              onSave={(v) => updateDetail({ priceGuide: v })}
              isEditMode={isEditMode && !!onUpdateService}
              label="예상 견적 수정"
            />
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <a
              href={`tel:${company.phone}`}
              className="justify-center px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md tabular-nums"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>{company.phone} 전화 상담</span>
            </a>
            <a
              href={company.kakaoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="justify-center px-5 py-3 rounded-xl bg-[#FEE500] text-[#3c1e1e] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span>카톡 1:1 상담</span>
            </a>
          </div>
        </div>

        <div className="space-y-3">
          {isEditMode && onEditImage && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  onEditImage({
                    title: `[${service.title}] 청소 전(Before) 사진 변경`,
                    currentUrl: service.detail.beforeImage,
                    onSave: (url) => updateDetail({ beforeImage: url }),
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
                    title: `[${service.title}] 청소 후(After) 사진 변경`,
                    currentUrl: service.detail.afterImage,
                    onSave: (url) => updateDetail({ afterImage: url }),
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>청소 후 사진 변경</span>
              </button>
            </div>
          )}

          <div className="bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md">
            <BeforeAfterSlider
              beforeImage={service.detail.beforeImage}
              afterImage={service.detail.afterImage}
              beforeLabel="시공 전"
              afterLabel="시공 후"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3">
              {regionName} {service.title} 작업 범위
            </h2>
            <ul className="space-y-2.5">
              {service.detail.scopeList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="flex-1">
                    <EditableText
                      value={item}
                      onSave={(v) =>
                        updateDetail({
                          scopeList: service.detail.scopeList.map((s, i) => (i === idx ? v : s)),
                        })
                      }
                      isEditMode={isEditMode && !!onUpdateService}
                      label="작업 범위 수정"
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>사용 장비 및 안심 보증</span>
            </h2>
            <ul className="space-y-2.5">
              {service.detail.equipment.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="flex-1">
                    <EditableText
                      value={item}
                      onSave={(v) =>
                        updateDetail({
                          equipment: service.detail.equipment.map((s, i) => (i === idx ? v : s)),
                        })
                      }
                      isEditMode={isEditMode && !!onUpdateService}
                      label="장비 안내 수정"
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">
            {regionName} {service.title} 빠른 견적 신청
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-5">
            남겨주시면 영업시간 내에 담당자가 연락드립니다.
          </p>

          {sent ? (
            <div className="py-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-900 text-sm">견적 신청이 완료되었습니다!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="성함 / 상호명 *"
                  className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="연락처 (010-0000-0000) *"
                  className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>무료 견적 신청하기</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
