import React, { useEffect, useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onSave: (newValue: string) => void;
  isEditMode: boolean;
  label?: string;
  multiline?: boolean;
  className?: string;
  as?: 'span' | 'div';
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  isEditMode,
  label = '텍스트 수정',
  multiline = false,
  className = '',
  as = 'span',
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (!isEditMode) {
    const Tag = as;
    return <Tag className={className}>{value}</Tag>;
  }

  if (editing) {
    const commit = () => {
      const trimmed = draft;
      if (trimmed !== value) {
        onSave(trimmed);
      }
      setEditing(false);
    };

    const cancel = () => {
      setDraft(value);
      setEditing(false);
    };

    return (
      <span
        onClick={(e) => e.stopPropagation()}
        className="inline-flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 w-full max-w-full bg-white text-slate-900 p-1.5 rounded-xl border-2 border-blue-500 shadow-lg z-30 relative"
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                commit();
              }
            }}
            rows={3}
            aria-label={label}
            className="w-full min-w-[200px] px-2.5 py-1.5 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
            aria-label={label}
            className="w-full min-w-[140px] px-2.5 py-1 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
        <span className="flex items-center gap-1 shrink-0 justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              commit();
            }}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            title="저장"
            aria-label="저장"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cancel();
            }}
            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
            title="취소"
            aria-label="취소"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      </span>
    );
  }

  const Tag = as;
  return (
    <Tag
      role="button"
      tabIndex={0}
      title={`${label} (클릭하여 바로 수정)`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setEditing(true);
        }
      }}
      className={`${className} relative group/edit cursor-pointer rounded-md outline-1 outline-dashed outline-blue-400/70 hover:outline-2 hover:outline-blue-600 hover:bg-blue-50/30 transition-all px-1 -mx-1`}
    >
      {value || '(비어 있음)'}
      <span className="inline-flex items-center justify-center w-4 h-4 ml-1 rounded bg-blue-600 text-white align-middle opacity-80 group-hover/edit:opacity-100">
        <Pencil className="w-2.5 h-2.5" />
      </span>
    </Tag>
  );
};
