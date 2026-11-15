import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { FaqItem } from '@/src/types/clearworks';

interface FaqSectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  items: FaqItem[];
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdateFaq: (id: string, field: 'question' | 'answer', val: string) => void;
  onAddFaq: () => void;
  onDeleteFaq: (id: string) => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  items,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateFaq,
  onAddFaq,
  onDeleteFaq,
}) => {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({
    [items[0]?.id ?? '']: true,
  });

  const toggleItem = (id: string) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="faq" className="py-16 md:py-28 bg-slate-50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2 block">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
            <EditableText
              value={sectionTitle}
              onSave={onUpdateTitle}
              isEditMode={isEditMode}
              label="FAQ 섹션 제목 수정"
            />
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            <EditableText
              value={sectionSubtitle}
              onSave={onUpdateSubtitle}
              isEditMode={isEditMode}
              label="FAQ 섹션 부제목 수정"
            />
          </p>
        </div>

        <div className="space-y-3.5">
          {items.map((item) => {
            const isOpen = !!openMap[item.id];
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-150"
              >
                <div
                  onClick={() => toggleItem(item.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleItem(item.id);
                    }
                  }}
                  className="w-full text-left flex items-center justify-between p-5 sm:p-6 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                >
                  <div className="flex-1 flex items-start gap-3.5 pr-4">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      Q
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      <EditableText
                        value={item.question}
                        onSave={(v) => onUpdateFaq(item.id, 'question', v)}
                        isEditMode={isEditMode}
                        label="질문 내용 수정"
                      />
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isEditMode && items.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFaq(item.id);
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="질문 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <span
                      className={`p-1.5 rounded-full transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'
                      }`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-3 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100/80 bg-slate-50/40">
                    <div className="flex items-start gap-3.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        A
                      </span>
                      <div className="flex-1">
                        <EditableText
                          value={item.answer}
                          onSave={(v) => onUpdateFaq(item.id, 'answer', v)}
                          isEditMode={isEditMode}
                          label="답변 내용 수정"
                          multiline
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isEditMode && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onAddFaq}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 자주 묻는 질문 추가하기</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
