import React from 'react';
import { CheckCircle, Plus, Quote, Star, Trash2 } from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ReviewItem } from '@/src/types/clearworks';

interface ReviewsSectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  reviews: ReviewItem[];
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdateReview: (id: string, field: 'content' | 'author' | 'tag', val: string) => void;
  onAddReview: () => void;
  onDeleteReview: (id: string) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  reviews,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateReview,
  onAddReview,
  onDeleteReview,
}) => {
  return (
    <section className="py-16 md:py-28 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2 block">
            Customer Reviews
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
            <EditableText
              value={sectionTitle}
              onSave={onUpdateTitle}
              isEditMode={isEditMode}
              label="고객 후기 섹션 제목 수정"
            />
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            <EditableText
              value={sectionSubtitle}
              onSave={onUpdateSubtitle}
              isEditMode={isEditMode}
              label="고객 후기 섹션 부제목 수정"
            />
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-slate-50/90 hover:bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 hover:border-blue-300 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex items-center gap-1 text-amber-400"
                    aria-label={`별점 ${review.rating}점`}
                  >
                    {Array.from({ length: review.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-slate-300" />
                </div>
                <blockquote className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal mb-6">
                  <EditableText
                    value={review.content}
                    onSave={(v) => onUpdateReview(review.id, 'content', v)}
                    isEditMode={isEditMode}
                    label="후기 본문 수정"
                    multiline
                  />
                </blockquote>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <EditableText
                      value={review.author}
                      onSave={(v) => onUpdateReview(review.id, 'author', v)}
                      isEditMode={isEditMode}
                      label="고객명/지역 수정"
                    />
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 inline shrink-0" />
                  </div>
                  {(review.tag || isEditMode) && (
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      <EditableText
                        value={review.tag || '시공 태그 입력'}
                        onSave={(v) => onUpdateReview(review.id, 'tag', v)}
                        isEditMode={isEditMode}
                        label="시공 태그 수정"
                      />
                    </span>
                  )}
                </div>

                {isEditMode && reviews.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteReview(review.id)}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer shrink-0"
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
              onClick={onAddReview}
              className="rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/60 p-6 flex flex-col items-center justify-center text-blue-600 gap-2 min-h-[220px] transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm">새 고객 후기 추가하기</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
