import React from 'react';
import { ArrowRight, Calendar, Image as ImageIcon, MapPin, Sparkles } from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import type { GalleryPost } from '@/src/types/clearworks';
import { resolveAssetUrl } from '@/src/utils/assetUrl';

interface GallerySectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  posts: GalleryPost[];
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdatePostField: (
    postId: string,
    field: 'title' | 'excerpt' | 'coverImage',
    val: string
  ) => void;
  onEditImage: (target: ImageEditTarget) => void;
  onViewGalleryList: () => void;
  onSelectPost: (postId: string) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  posts,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdatePostField,
  onEditImage,
  onViewGalleryList,
  onSelectPost,
}) => {
  const visiblePosts = posts.slice(0, 6);

  return (
    <section
      id="gallery"
      className="py-16 md:py-28 bg-slate-50 relative border-t border-slate-200/60"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-5">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Real Field Stories &amp; Work Logs</span>
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              <EditableText
                value={sectionTitle}
                onSave={onUpdateTitle}
                isEditMode={isEditMode}
                label="작업갤러리 제목 수정"
              />
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              <EditableText
                value={sectionSubtitle}
                onSave={onUpdateSubtitle}
                isEditMode={isEditMode}
                label="작업갤러리 부제목 수정"
              />
            </p>
          </div>

          <button
            type="button"
            onClick={onViewGalleryList}
            className="self-start md:self-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-blue-600 font-extrabold text-xs sm:text-sm border border-slate-200 shadow-2xs flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer whitespace-nowrap"
          >
            <span>전체 작업일지 보러가기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {visiblePosts.map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPost(post.id);
                }
              }}
              role="button"
              tabIndex={0}
              className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div>
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  <img
                    src={resolveAssetUrl(post.coverImage || post.afterImage)}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold shadow-md">
                      {post.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span>{post.region}</span>
                    </span>
                  </div>

                  {isEditMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditImage({
                          title: `[${post.title}] 대표 이미지 변경`,
                          currentUrl: post.coverImage || post.afterImage,
                          onSave: (url) => onUpdatePostField(post.id, 'coverImage', url),
                        });
                      }}
                      className="absolute bottom-3 right-3 z-20 px-2.5 py-1.5 rounded-lg bg-slate-950/85 hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-lg cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>사진 변경</span>
                    </button>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                    <EditableText
                      value={post.title}
                      onSave={(v) => onUpdatePostField(post.id, 'title', v)}
                      isEditMode={isEditMode}
                      label="게시글 제목 수정"
                    />
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    <EditableText
                      value={post.excerpt}
                      onSave={(v) => onUpdatePostField(post.id, 'excerpt', v)}
                      isEditMode={isEditMode}
                      label="게시글 요약 수정"
                      multiline
                    />
                  </p>
                </div>
              </div>

              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:bg-blue-50/50 transition-colors">
                <span>자세히 보기</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
