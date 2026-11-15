import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, RotateCcw, Upload, X } from 'lucide-react';

export interface ImageEditTarget {
  title: string;
  currentUrl: string;
  defaultUrl?: string;
  onSave: (newUrl: string) => void;
}

interface ImageEditorModalProps {
  target: ImageEditTarget | null;
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onClose: () => void;
}

function resizeImageFile(file: File, maxWidth = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('올바른 이미지 파일이 아닙니다.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  target,
  onUploadImage,
  onClose,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (target) {
      setUrlInput(target.currentUrl);
      setError('');
    }
  }, [target]);

  if (!target) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const dataUrl = await resizeImageFile(file);
      const savedUrl = onUploadImage
        ? await onUploadImage(dataUrl, file.name.replace(/\.[^.]+$/, ''))
        : dataUrl;
      setUrlInput(savedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setError('이미지 파일을 업로드하거나 URL을 입력해 주세요.');
      return;
    }
    target.onSave(urlInput.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{target.title}</h3>
              <p className="text-xs text-slate-500">이미지 파일 업로드 또는 URL로 교체하세요.</p>
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

        <form onSubmit={handleSave} className="space-y-4">
          {/* Preview */}
          <div className="aspect-[16/9] rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
            {urlInput ? (
              <img
                src={urlInput}
                alt="미리보기"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-slate-400">미리보기 없음</span>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>{uploading ? '이미지 최적화 중...' : '내 기기에서 사진 파일 선택하기'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              또는 이미지 주소(URL) 직접 입력
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            {target.defaultUrl ? (
              <button
                type="button"
                onClick={() => setUrlInput(target.defaultUrl!)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>기본 이미지 복원</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                이미지 적용하기
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
