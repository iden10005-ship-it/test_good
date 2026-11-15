import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Image as ImageIcon,
  MessageCircle,
  Phone,
  Plus,
  Send,
  Trash2,
  Wrench,
} from 'lucide-react';
import { BeforeAfterSlider } from '@/src/components/BeforeAfterSlider';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import type { CompanyInfo, InquiryPayload, ServiceItem } from '@/src/types/clearworks';

interface ServiceDetailPageProps {
  service: ServiceItem;
  allServices: ServiceItem[];
  company: CompanyInfo;
  isEditMode: boolean;
  onUpdateService: (updated: ServiceItem) => void;
  onEditImage: (target: ImageEditTarget) => void;
  onBack: () => void;
  onSelectService: (serviceId: string) => void;
  onSubmitInquiry: (payload: InquiryPayload) => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  service,
  allServices,
  company,
  isEditMode,
  onUpdateService,
  onEditImage,
  onBack,
  onSelectService,
  onSubmitInquiry,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [content, setContent] = useState(`${service.title} 관련 무료 견적 문의드립니다.`);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setContent(`${service.title} 관련 무료 견적 문의드립니다.`);
    setSent(false);
  }, [service.id, service.title]);

  const otherServices = allServices.filter((s) => s.id !== service.id);
  const { detail } = service;

  const updateDetail = (patch: Partial<ServiceItem['detail']>) => {
    onUpdateService({
      ...service,
      detail: { ...detail, ...patch },
    });
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmitInquiry({
      name,
      phone,
      region: region.trim() || company.region,
      buildingType: service.title,
      content,
    });
    setSent(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Breadcrumb Top Bar */}
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
            <button type="button" onClick={onBack} className="hover:underline cursor-pointer">
              홈
            </button>
            <span>/</span>
            <span>서비스 안내</span>
            <span>/</span>
            <span className="font-bold text-blue-600">{service.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-10">
        {/* Hero Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/90 shadow-xl">
          <div className="max-w-3xl">
            {(service.badge || isEditMode) && (
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-3">
                <EditableText
                  value={service.badge || '뱃지 입력'}
                  onSave={(v) => onUpdateService({ ...service, badge: v })}
                  isEditMode={isEditMode}
                  label="서비스 뱃지 수정"
                />
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug mb-3">
              <EditableText
                value={service.title}
                onSave={(v) => onUpdateService({ ...service, title: v })}
                isEditMode={isEditMode}
                label="서비스명 수정"
              />
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-blue-600 font-bold mb-3 leading-relaxed">
              <EditableText
                value={detail.tagline}
                onSave={(v) => updateDetail({ tagline: v })}
                isEditMode={isEditMode}
                label="핵심 슬로건 수정"
                multiline
              />
            </p>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed mb-6">
              <EditableText
                value={service.description}
                onSave={(v) => onUpdateService({ ...service, description: v })}
                isEditMode={isEditMode}
                label="서비스 요약 설명 수정"
                multiline
              />{' '}
              · 추천 대상:{' '}
              <strong className="text-slate-800">
                <EditableText
                  value={detail.targetAudience}
                  onSave={(v) => updateDetail({ targetAudience: v })}
                  isEditMode={isEditMode}
                  label="추천 대상 수정"
                />
              </strong>
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <a
                href={`tel:${company.phone}`}
                className="justify-center px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all tabular-nums"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>{company.phone} 전화 상담</span>
              </a>
              <a
                href={company.kakaoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="justify-center px-5 py-3 rounded-xl bg-[#FEE500] text-[#3c1e1e] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs hover:brightness-95 transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                <span>카톡 1:1 상담</span>
              </a>
              <a
                href="#service-quote"
                className="justify-center px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors text-center"
              >
                무료 견적 신청
              </a>
            </div>
          </div>
        </div>

        {/* Before / After Comparison */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                {service.title} 전후 비교
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                실제 시공 현장에서 촬영된 비교 사진입니다. 슬라이더를 밀어 확인해보세요.
              </p>
            </div>

            {isEditMode && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onEditImage({
                      title: `[${service.title}] 청소 전(Before) 사진 변경`,
                      currentUrl: detail.beforeImage,
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
                      currentUrl: detail.afterImage,
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
          </div>
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-md">
            <BeforeAfterSlider
              beforeImage={detail.beforeImage}
              afterImage={detail.afterImage}
              beforeLabel="시공 전"
              afterLabel="시공 후"
            />
          </div>
        </div>

        {/* Scope & Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">시공 범위 및 체크리스트</h3>
              </div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() =>
                    updateDetail({ scopeList: [...detail.scopeList, '새 시공 범위 항목'] })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>항목 추가</span>
                </button>
              )}
            </div>
            <ul className="space-y-3">
              {detail.scopeList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </span>
                  <span className="leading-relaxed flex-1">
                    <EditableText
                      value={item}
                      onSave={(v) => {
                        const next = detail.scopeList.map((s, i) => (i === idx ? v : s));
                        updateDetail({ scopeList: next });
                      }}
                      isEditMode={isEditMode}
                      label="시공 범위 항목 수정"
                    />
                  </span>
                  {isEditMode && detail.scopeList.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        updateDetail({
                          scopeList: detail.scopeList.filter((_, i) => i !== idx),
                        })
                      }
                      className="p-1 text-red-400 hover:text-red-600 cursor-pointer shrink-0"
                      title="항목 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">사용 전문 장비 및 공법</h3>
                </div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() =>
                      updateDetail({ equipment: [...detail.equipment, '새 장비/공법 항목'] })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold hover:bg-blue-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>장비 추가</span>
                  </button>
                )}
              </div>
              <ul className="space-y-3">
                {detail.equipment.map((eq, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      •
                    </span>
                    <span className="leading-relaxed flex-1">
                      <EditableText
                        value={eq}
                        onSave={(v) => {
                          const next = detail.equipment.map((s, i) => (i === idx ? v : s));
                          updateDetail({ equipment: next });
                        }}
                        isEditMode={isEditMode}
                        label="장비/공법 항목 수정"
                      />
                    </span>
                    {isEditMode && detail.equipment.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateDetail({
                            equipment: detail.equipment.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-1 text-red-400 hover:text-red-600 cursor-pointer shrink-0"
                        title="항목 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500 block mb-0.5">평균 소요 시간</span>
                <span className="font-bold text-slate-900">
                  <EditableText
                    value={detail.duration}
                    onSave={(v) => updateDetail({ duration: v })}
                    isEditMode={isEditMode}
                    label="소요 시간 수정"
                  />
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500 block mb-0.5">예상 견적 기준</span>
                <span className="font-bold text-blue-600">
                  <EditableText
                    value={detail.priceGuide}
                    onSave={(v) => updateDetail({ priceGuide: v })}
                    isEditMode={isEditMode}
                    label="예상 견적 기준 수정"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Service FAQs */}
        {((detail.faqList && detail.faqList.length > 0) || isEditMode) && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {service.title} 자주 묻는 질문
              </h3>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() =>
                    updateDetail({
                      faqList: [
                        ...(detail.faqList ?? []),
                        { q: '새 질문을 입력하세요.', a: '답변 내용을 입력하세요.' },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>질문 추가</span>
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(detail.faqList ?? []).map((faq, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 relative">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-bold text-slate-900 flex-1">
                      Q.{' '}
                      <EditableText
                        value={faq.q}
                        onSave={(v) => {
                          const next = (detail.faqList ?? []).map((item, i) =>
                            i === idx ? { ...item, q: v } : item
                          );
                          updateDetail({ faqList: next });
                        }}
                        isEditMode={isEditMode}
                        label="질문 수정"
                      />
                    </p>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() =>
                          updateDetail({
                            faqList: (detail.faqList ?? []).filter((_, i) => i !== idx),
                          })
                        }
                        className="p-1 text-red-400 hover:text-red-600 cursor-pointer shrink-0"
                        title="질문 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    A.{' '}
                    <EditableText
                      value={faq.a}
                      onSave={(v) => {
                        const next = (detail.faqList ?? []).map((item, i) =>
                          i === idx ? { ...item, a: v } : item
                        );
                        updateDetail({ faqList: next });
                      }}
                      isEditMode={isEditMode}
                      label="답변 수정"
                      multiline
                    />
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service Quote Form */}
        <div
          id="service-quote"
          className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl"
        >
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">
            {service.title} 빠른 무료 견적
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-5">
            연락처를 남겨주시면 담당 엔지니어가 영업시간 내 빠르게 안내해 드립니다.
          </p>

          {sent ? (
            <div className="py-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-900 text-sm mb-1">견적 신청이 완료되었습니다!</p>
              <p className="text-xs text-slate-600">빠른 시간 내에 연락드리겠습니다.</p>
            </div>
          ) : (
            <form onSubmit={handleQuoteSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="지역 (예: 서울 강남구)"
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

        {/* Other Services */}
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-4">
            다른 전문 서비스 둘러보기
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherServices.map((other) => (
              <button
                key={other.id}
                type="button"
                onClick={() => onSelectService(other.id)}
                className="text-left p-4 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between gap-2 cursor-pointer group"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                    {other.title}
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{other.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
