import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Send,
  User,
  Wrench,
} from 'lucide-react';
import { BeforeAfterSlider } from '@/src/components/BeforeAfterSlider';
import { EditableText } from '@/src/components/admin/EditableText';
import { GalleryPostModal } from '@/src/components/admin/GalleryPostModal';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import type { CompanyInfo, GalleryPost, InquiryPayload } from '@/src/types/clearworks';
import { resolveAssetUrl } from '@/src/utils/assetUrl';

interface GalleryDetailPageProps {
  post: GalleryPost;
  allPosts: GalleryPost[];
  company: CompanyInfo;
  isEditMode: boolean;
  onUpdatePost: (post: GalleryPost) => void;
  onEditImage: (target: ImageEditTarget) => void;
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onBackToList: () => void;
  onSelectPost: (postId: string) => void;
  onSubmitInquiry: (payload: InquiryPayload) => void;
}

export const GalleryDetailPage: React.FC<GalleryDetailPageProps> = ({
  post,
  allPosts,
  company,
  isEditMode,
  onUpdatePost,
  onEditImage,
  onUploadImage,
  onBackToList,
  onSelectPost,
  onSubmitInquiry,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [buildingType, setBuildingType] = useState('아파트 외창 케어');
  const [content, setContent] = useState(
    `[${post.region}] ${post.title} 작업일지를 보고 견적 문의드립니다.`
  );
  const [sent, setSent] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setContent(`[${post.region}] ${post.title} 작업일지를 보고 견적 문의드립니다.`);
    setSent(false);
  }, [post.id, post.region, post.title]);

  const relatedPosts = allPosts.filter((p) => p.id !== post.id).slice(0, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmitInquiry({
      name,
      phone,
      region: post.region || company.region,
      buildingType,
      content,
    });
    setSent(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>작업갤러리 목록으로 돌아가기</span>
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>이 게시글 전체 수정하기</span>
            </button>
          )}
        </div>

        <article className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-10">
          {/* Header */}
          <div className="p-6 sm:p-10 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-extrabold shadow-2xs">
                {post.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1 border border-slate-200">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <EditableText
                  value={post.region}
                  onSave={(v) => onUpdatePost({ ...post, region: v })}
                  isEditMode={isEditMode}
                  label="지역 수정"
                />
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug mb-4">
              <EditableText
                value={post.title}
                onSave={(v) => onUpdatePost({ ...post, title: v })}
                isEditMode={isEditMode}
                label="게시글 제목 수정"
              />
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5 tabular-nums">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>
                  작성일자:{' '}
                  <EditableText
                    value={post.date}
                    onSave={(v) => onUpdatePost({ ...post, date: v })}
                    isEditMode={isEditMode}
                    label="작성일자 수정"
                  />
                </span>
              </span>
              <span aria-hidden="true">•</span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                <span>
                  시공담당:{' '}
                  <EditableText
                    value={post.author}
                    onSave={(v) => onUpdatePost({ ...post, author: v })}
                    isEditMode={isEditMode}
                    label="시공담당 수정"
                  />
                </span>
              </span>
            </div>
          </div>

          {/* Before/After Visual Comparison */}
          {post.beforeImage && post.afterImage && (
            <div className="p-4 sm:p-8 bg-slate-900 border-y border-slate-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold text-blue-400 tracking-wider uppercase block mb-1">
                    Before &amp; After Visual Comparison
                  </span>
                  <p className="text-xs text-slate-300">
                    슬라이더를 좌우로 밀어 현장 시공 전후 차이를 확인하세요
                  </p>
                </div>

                {isEditMode && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEditImage({
                          title: '현장일지 시공 전(Before) 사진 변경',
                          currentUrl: post.beforeImage,
                          onSave: (url) => onUpdatePost({ ...post, beforeImage: url }),
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span>시공 전 사진 변경</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onEditImage({
                          title: '현장일지 시공 후(After) 사진 변경',
                          currentUrl: post.afterImage,
                          onSave: (url) =>
                            onUpdatePost({ ...post, afterImage: url, coverImage: url }),
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>시공 후 사진 변경</span>
                    </button>
                  </div>
                )}
              </div>
              <BeforeAfterSlider
                beforeImage={post.beforeImage}
                afterImage={post.afterImage}
                beforeLabel="시공 전"
                afterLabel="시공 후"
              />
            </div>
          )}

          {/* Body Content */}
          <div className="p-6 sm:p-10 space-y-8">
            <div className="whitespace-pre-line text-sm sm:text-base text-slate-700 leading-relaxed">
              <EditableText
                value={post.content}
                onSave={(v) => onUpdatePost({ ...post, content: v })}
                isEditMode={isEditMode}
                label="본문 내용 수정"
                multiline
                as="div"
              />
            </div>

            {/* Key Points & Equipment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-slate-100">
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>현장 핵심 시공 포인트</span>
                </h2>
                <ul className="space-y-2">
                  {post.keyPoints.map((kp, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span className="flex-1">
                        <EditableText
                          value={kp}
                          onSave={(v) =>
                            onUpdatePost({
                              ...post,
                              keyPoints: post.keyPoints.map((item, i) => (i === idx ? v : item)),
                            })
                          }
                          isEditMode={isEditMode}
                          label="시공 포인트 수정"
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/70">
                <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  <span>투입 장비 및 약품</span>
                </h2>
                <ul className="space-y-2">
                  {post.equipmentUsed.map((eq, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span className="flex-1">
                        <EditableText
                          value={eq}
                          onSave={(v) =>
                            onUpdatePost({
                              ...post,
                              equipmentUsed: post.equipmentUsed.map((item, i) =>
                                i === idx ? v : item
                              ),
                            })
                          }
                          isEditMode={isEditMode}
                          label="투입 장비 수정"
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-500">
                {post.tags.map((tag) => (
                  <span key={tag} className="font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Inline Inquiry Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg mb-10">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">
            이와 동일한 시공이 필요하신가요?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-5">
            연락처를 남겨주시면 담당 마스터가 무료 견적 상담을 도와드립니다.
          </p>

          {sent ? (
            <div className="py-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-900 text-sm">견적 문의가 접수되었습니다!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="성함 / 고객명 *"
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
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  placeholder="건물 유형"
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
                <span>무료 견적 문의하기</span>
              </button>
            </form>
          )}
        </div>

        {/* Related Field Logs */}
        {relatedPosts.length > 0 && (
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-4">
              다른 현장 작업일지
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectPost(rel.id)}
                  className="text-left bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/10] bg-slate-900 overflow-hidden">
                      <img
                        src={resolveAssetUrl(rel.coverImage || rel.afterImage)}
                        alt={rel.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-[11px] font-bold text-blue-600">{rel.region}</span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 mt-1 group-hover:text-blue-600">
                        {rel.title}
                      </h4>
                    </div>
                  </div>
                  <div className="px-4 py-2.5 border-t border-slate-100 text-[11px] font-bold text-blue-600 flex items-center justify-between">
                    <span>보기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isEditMode && (
        <GalleryPostModal
          isOpen={modalOpen}
          editingPost={post}
          onUploadImage={onUploadImage}
          onClose={() => setModalOpen(false)}
          onSave={onUpdatePost}
        />
      )}
    </div>
  );
};
