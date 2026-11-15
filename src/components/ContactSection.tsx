import React, { useState } from 'react';
import { CheckCircle2, Clock, Phone, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { CompanyInfo, InquiryPayload } from '@/src/types/clearworks';

interface ContactSectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  successMessage: string;
  company: CompanyInfo;
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdateSuccessMessage: (val: string) => void;
  onSubmitInquiry: (payload: InquiryPayload) => void;
}

const BUILDING_TYPES = [
  '아파트 외창 (베란다/확장형)',
  '상가·매장 통유리',
  '사무실·오피스 내부/외창',
  '빌딩 외벽 (로프/스카이)',
  '입주·이사 청소 유리창',
  '썬팅/스티커 제거 작업',
  '기타 맞춤 작업',
];

export const ContactSection: React.FC<ContactSectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  successMessage,
  company,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateSuccessMessage,
  onSubmitInquiry,
}) => {
  const [form, setForm] = useState<InquiryPayload>({
    name: '',
    phone: '',
    region: '',
    buildingType: BUILDING_TYPES[0],
    content: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg('성함 또는 상호명을 입력해 주세요.');
      return;
    }
    const digitsOnly = form.phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 9) {
      setErrorMsg('올바른 연락처(전화번호)를 입력해 주세요.');
      return;
    }

    setErrorMsg('');
    onSubmitInquiry({
      ...form,
      region: form.region.trim() || company.region,
    });
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-16 md:py-28 bg-white relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-5">
          {/* Left Dark Info Column */}
          <div className="lg:col-span-2 bg-slate-900 p-7 sm:p-10 text-white flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-6 border border-blue-400/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>비대면 사진 견적 가능</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 text-white">
                빠르고 투명한
                <br />
                무료 견적 안내
              </h3>

              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                창문 종류와 상태를 남겨주시면 담당 엔지니어가 작업 일정과 합리적인 견적을 꼼꼼히 산출하여 안내해 드립니다.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-200 text-sm">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">직통 전화 상담</span>
                    <a
                      href={`tel:${company.phone}`}
                      className="font-bold hover:text-blue-300 transition-colors tabular-nums"
                    >
                      {company.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-200 text-sm">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">운영 시간</span>
                    <span className="font-medium">{company.operatingHours}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-200 text-sm">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">안심 보장</span>
                    <span className="font-medium">영업배상책임보험 1억원 가입</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-3 p-7 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                <EditableText
                  value={sectionTitle}
                  onSave={onUpdateTitle}
                  isEditMode={isEditMode}
                  label="견적 신청 제목 수정"
                />
              </h2>
              <p className="text-sm text-slate-600">
                <EditableText
                  value={sectionSubtitle}
                  onSave={onUpdateSubtitle}
                  isEditMode={isEditMode}
                  label="견적 신청 안내문구 수정"
                />
              </p>
              {isEditMode && !submitted && (
                <div className="mt-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs text-slate-700">
                  <span className="font-bold text-blue-700 mr-1.5">접수 완료 안내문구:</span>
                  <EditableText
                    value={successMessage}
                    onSave={onUpdateSuccessMessage}
                    isEditMode={isEditMode}
                    label="접수 완료 안내문구 수정"
                  />
                </div>
              )}
            </div>

            {submitted ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">접수가 완료되었습니다!</h4>
                <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
                  <EditableText
                    value={successMessage}
                    onSave={onUpdateSuccessMessage}
                    isEditMode={isEditMode}
                    label="접수 완료 안내문구 수정"
                  />
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      name: '',
                      phone: '',
                      region: '',
                      buildingType: BUILDING_TYPES[0],
                      content: '',
                    });
                    setSubmitted(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  추가 견적 작성하기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {errorMsg && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium"
                  >
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      이름 / 고객명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="홍길동"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="010-1234-5678"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-region"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      지역 (시·구·동)
                    </label>
                    <input
                      id="contact-region"
                      type="text"
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                      placeholder="예: 서울 서초구 반포동"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-type"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      건물 유형
                    </label>
                    <select
                      id="contact-type"
                      value={form.buildingType}
                      onChange={(e) => setForm({ ...form, buildingType: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      {BUILDING_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-content"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    문의 내용 / 희망 작업일
                  </label>
                  <textarea
                    id="contact-content"
                    rows={3}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="창문 수량, 대략적인 평수 또는 오염 상태를 간단히 적어주시면 더 신속하게 견적 산출이 가능합니다."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>무료 견적 신청 완료하기</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
