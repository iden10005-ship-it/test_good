import React, { useEffect, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { CLEARWORKS_IMAGES } from '@/src/data/clearworksData';
import type { GalleryPost } from '@/src/types/clearworks';

interface GalleryPostModalProps {
  isOpen: boolean;
  editingPost: GalleryPost | null;
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onClose: () => void;
  onSave: (post: GalleryPost) => void;
}

export const GalleryPostModal: React.FC<GalleryPostModalProps> = ({
  isOpen,
  editingPost,
  onUploadImage,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('아파트');
  const [region, setRegion] = useState('서울 강남구');
  const [date, setDate] = useState('');
  const [author, setAuthor] = useState('클리어웍스 마스터');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [beforeImage, setBeforeImage] = useState(CLEARWORKS_IMAGES.aptBefore);
  const [afterImage, setAfterImage] = useState(CLEARWORKS_IMAGES.aptAfter);
  const [tagsText, setTagsText] = useState('유리창청소, 외창청소');

  useEffect(() => {
    if (!isOpen) return;
    if (editingPost) {
      setTitle(editingPost.title);
      setCategory(editingPost.category);
      setRegion(editingPost.region);
      setDate(editingPost.date);
      setAuthor(editingPost.author);
      setExcerpt(editingPost.excerpt);
      setContent(editingPost.content);
      setBeforeImage(editingPost.beforeImage);
      setAfterImage(editingPost.afterImage);
      setTagsText(editingPost.tags.join(', '));
    } else {
      const today = new Date();
      const formatted = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(
        2,
        '0'
      )}.${String(today.getDate()).padStart(2, '0')}`;
      setTitle('');
      setCategory('아파트');
      setRegion('서울 강남구');
      setDate(formatted);
      setAuthor('클리어웍스 현장팀');
      setExcerpt('');
      setContent('');
      setBeforeImage(CLEARWORKS_IMAGES.aptBefore);
      setAfterImage(CLEARWORKS_IMAGES.aptAfter);
      setTagsText('유리창청소, 아파트외창');
    }
  }, [isOpen, editingPost]);

  if (!isOpen) return null;

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const img = new Image();
      img.onload = async () => {
        const maxWidth = 1400;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const dataUrl = ctx
          ? (() => {
              ctx.drawImage(img, 0, 0, width, height);
              return canvas.toDataURL('image/jpeg', 0.85);
            })()
          : (reader.result as string);

        if (onUploadImage) {
          const uploadedUrl = await onUploadImage(dataUrl, file.name.replace(/\.[^.]+$/, ''));
          setter(uploadedUrl);
        } else {
          setter(dataUrl);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const post: GalleryPost = {
      id: editingPost ? editingPost.id : `post-${Date.now()}`,
      title: title.trim(),
      category,
      region: region.trim() || '서울·수도권',
      date: date.trim() || '2026.11.13',
      author: author.trim() || '클리어웍스 현장팀',
      excerpt: excerpt.trim() || content.slice(0, 80),
      coverImage: afterImage,
      beforeImage,
      afterImage,
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      equipmentUsed: editingPost?.equipmentUsed ?? ['전문가용 윈도우 스퀴지', '친환경 세정제'],
      keyPoints: editingPost?.keyPoints ?? ['오염물 정밀 세척 및 무얼룩 마감', '보양 및 안전 시공'],
      content: content.trim() || excerpt.trim(),
    };
    onSave(post);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
          <h3 className="text-base font-extrabold text-slate-900">
            {editingPost ? '작업일지 게시글 수정' : '새 작업일지 작성하기'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">제목 *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 반포동 아파트 34평 거실 외창 물때 제거 & 발수 코팅"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="아파트">아파트</option>
                <option value="상가">상가</option>
                <option value="빌딩">빌딩</option>
                <option value="간판,어닝청소">간판·어닝청소</option>
                <option value="시트지제거">시트지제거</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">지역</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">작성일</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">시공 전 사진</span>
                <label className="text-[11px] font-bold text-blue-600 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setBeforeImage)}
                    className="hidden"
                  />
                </label>
              </div>
              <img src={beforeImage} alt="시공 전" className="w-full h-24 object-cover rounded-xl" />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">시공 후 사진 (대표 썸네일)</span>
                <label className="text-[11px] font-bold text-blue-600 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setAfterImage)}
                    className="hidden"
                  />
                </label>
              </div>
              <img src={afterImage} alt="시공 후" className="w-full h-24 object-cover rounded-xl" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">요약 문구</label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="목록 카드에 표시될 1~2줄 요약"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">본문 내용</label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="시공 전 상태, 진행 공법, 완료 후 결과 등을 작성하세요."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">태그 (쉼표로 구분)</label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
