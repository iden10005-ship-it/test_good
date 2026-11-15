import React from 'react';
import { CheckCircle2, Clock, Inbox, Trash2, X } from 'lucide-react';
import type { InquiryItem } from '@/src/types/clearworks';

interface InquiriesModalProps {
  isOpen: boolean;
  inquiries: InquiryItem[];
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export const InquiriesModal: React.FC<InquiriesModalProps> = ({
  isOpen,
  inquiries,
  onClose,
  onToggleStatus,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                접수된 견적 문의 ({inquiries.length}건)
              </h3>
              <p className="text-xs text-slate-500">상담 진행 상태를 변경하거나 내역을 관리하세요.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
          {inquiries.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              아직 접수된 견적 문의가 없습니다.
            </div>
          ) : (
            inquiries.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{item.name}</span>
                    <a
                      href={`tel:${item.phone}`}
                      className="text-xs font-bold text-blue-600 hover:underline tabular-nums"
                    >
                      {item.phone}
                    </a>
                    <span className="text-xs text-slate-500">· {item.region}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        item.status === '상담완료'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status === '상담완료' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{item.status}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-700">
                  서비스 유형: {item.buildingType}
                </div>
                {item.content && (
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80">
                    {item.content}
                  </p>
                )}
                <div className="text-[11px] text-slate-400 tabular-nums">
                  접수일시: {new Date(item.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
