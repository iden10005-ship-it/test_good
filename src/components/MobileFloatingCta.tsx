import React from 'react';
import { FileText, MessageCircle, MessageSquare, Phone } from 'lucide-react';
import type { CompanyInfo } from '@/src/types/clearworks';

interface MobileFloatingCtaProps {
  company: CompanyInfo;
  onOpenQuote: () => void;
}

export const MobileFloatingCta: React.FC<MobileFloatingCtaProps> = ({
  company,
  onOpenQuote,
}) => {
  const smsDigits = company.phone.replace(/[^0-9]/g, '');

  return (
    <aside
      aria-label="빠른 문의"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="grid grid-cols-4 gap-1.5 max-w-md mx-auto">
        <a
          href={`tel:${company.phone}`}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 active:scale-95 transition-all shadow-2xs"
        >
          <Phone className="w-4 h-4 mb-0.5 text-blue-400" />
          <span className="text-[11px] font-bold leading-tight">전화상담</span>
        </a>

        <a
          href={company.kakaoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-[#FEE500] text-[#3c1e1e] font-bold text-xs hover:brightness-95 active:scale-95 transition-all shadow-2xs"
        >
          <MessageCircle className="w-4 h-4 mb-0.5 fill-current" />
          <span className="text-[11px] font-bold leading-tight">카톡상담</span>
        </a>

        <a
          href={`sms:${smsDigits}`}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 active:scale-95 transition-all shadow-2xs"
        >
          <MessageSquare className="w-4 h-4 mb-0.5 text-emerald-100" />
          <span className="text-[11px] font-bold leading-tight">문자상담</span>
        </a>

        <button
          type="button"
          onClick={onOpenQuote}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-95 transition-all shadow-2xs cursor-pointer"
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span className="text-[11px] font-bold leading-tight">무료견적</span>
        </button>
      </div>
    </aside>
  );
};
