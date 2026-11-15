import React from 'react';
import { Camera, Plus, Trash2 } from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { PricingRow } from '@/src/types/clearworks';

interface PricingSectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  footerNote: string;
  rows: PricingRow[];
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdateFooterNote: (val: string) => void;
  onUpdateRow: (id: string, field: 'category' | 'standard' | 'price', val: string) => void;
  onAddRow: () => void;
  onDeleteRow: (id: string) => void;
  onScrollToContact: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  footerNote,
  rows,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateFooterNote,
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  onScrollToContact,
}) => {
  return (
    <section
      id="price"
      className="py-16 md:py-28 bg-slate-50 relative border-t border-slate-200/60"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2 block">
            Transparent Pricing
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
            <EditableText
              value={sectionTitle}
              onSave={onUpdateTitle}
              isEditMode={isEditMode}
              label="가격 섹션 제목 수정"
            />
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            <EditableText
              value={sectionSubtitle}
              onSave={onUpdateSubtitle}
              isEditMode={isEditMode}
              label="가격 섹션 부제목 수정"
            />
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs sm:text-sm font-semibold tracking-wider">
                  <th className="py-4 px-4 sm:px-8 whitespace-nowrap">구분</th>
                  <th className="py-4 px-4 sm:px-8 whitespace-nowrap">기준</th>
                  <th className="py-4 px-4 sm:px-8 text-right whitespace-nowrap">가격 (VAT 별도)</th>
                  {isEditMode && <th className="py-4 px-4 text-center w-16">관리</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm sm:text-base">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      row.highlight ? 'bg-blue-50/20 font-medium' : ''
                    }`}
                  >
                    <td className="py-4 sm:py-5 px-4 sm:px-8 text-slate-900 font-bold whitespace-nowrap">
                      <EditableText
                        value={row.category}
                        onSave={(v) => onUpdateRow(row.id, 'category', v)}
                        isEditMode={isEditMode}
                        label="구분명 수정"
                      />
                    </td>
                    <td className="py-4 sm:py-5 px-4 sm:px-8 text-slate-600">
                      <EditableText
                        value={row.standard}
                        onSave={(v) => onUpdateRow(row.id, 'standard', v)}
                        isEditMode={isEditMode}
                        label="기준 정보 수정"
                      />
                    </td>
                    <td className="py-4 sm:py-5 px-4 sm:px-8 text-right font-extrabold text-blue-600 text-base sm:text-lg whitespace-nowrap tabular-nums">
                      <EditableText
                        value={row.price}
                        onSave={(v) => onUpdateRow(row.id, 'price', v)}
                        isEditMode={isEditMode}
                        label="가격 정보 수정"
                      />
                    </td>
                    {isEditMode && (
                      <td className="py-4 px-4 text-center">
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteRow(row.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="행 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isEditMode && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onAddRow}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>새 가격 행 추가하기</span>
              </button>
            </div>
          )}
        </div>

        {/* Photo Quote Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                <EditableText
                  value={footerNote}
                  onSave={onUpdateFooterNote}
                  isEditMode={isEditMode}
                  label="사진 견적 안내문구 수정"
                />
              </h3>
              <p className="text-xs sm:text-sm text-blue-100">
                창문 전경 사진 2~3장을 보내주시면 10분 내에 정확한 견적을 안내해 드립니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onScrollToContact}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm shrink-0 hover:bg-blue-50 transition-colors shadow-md shadow-black/10 cursor-pointer whitespace-nowrap"
          >
            사진 견적 문의하기
          </button>
        </div>
      </div>
    </section>
  );
};
