import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  ChevronRight,
  Home,
  Layers,
  LayoutGrid,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Wrench,
} from 'lucide-react';
import { GalleryPostModal } from '@/src/components/admin/GalleryPostModal';
import type { GalleryPost } from '@/src/types/clearworks';
import { resolveAssetUrl } from '@/src/utils/assetUrl';

interface GalleryListPageProps {
  posts: GalleryPost[];
  isEditMode: boolean;
  onAddPost: (post: GalleryPost) => void;
  onUpdatePost: (post: GalleryPost) => void;
  onDeletePost: (postId: string) => void;
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onBackHome: () => void;
  onSelectPost: (postId: string) => void;
}

const CATEGORIES = [
  { id: '전체', label: '전체일지', icon: LayoutGrid },
  { id: '아파트', label: '아파트', icon: Home },
  { id: '상가', label: '상가', icon: Store },
  { id: '빌딩', label: '빌딩', icon: Building2 },
  { id: '간판,어닝청소', label: '간판·어닝청소', icon: Wrench },
  { id: '시트지제거', label: '시트지제거', icon: Layers },
  { id: '기타', label: '기타', icon: null },
] as const;

export const GalleryListPage: React.FC<GalleryListPageProps> = ({
  posts,
  isEditMode,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onUploadImage,
  onBackHome,
  onSelectPost,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<GalleryPost | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const matchesCategory = (postCategory: string, selected: string) => {
    if (selected === '전체') return true;
    const cat = postCategory.trim().toLowerCase();
    if (selected === '아파트') return cat.includes('아파트') || cat.includes('주택');
    if (selected === '상가') return cat.includes('상가') || cat.includes('매장') || cat.includes('점포');
    if (selected === '빌딩') return cat.includes('빌딩') || cat.includes('외벽');
    if (selected === '간판,어닝청소') return cat.includes('간판') || cat.includes('어닝');
    if (selected === '시트지제거') {
      return (
        cat.includes('시트지') ||
        cat.includes('썬팅') ||
        cat.includes('스티커') ||
        cat.includes('필름')
      );
    }
    if (selected === '기타') {
      return (
        cat.includes('기타') ||
        cat.includes('특수') ||
        (!cat.includes('아파트') &&
          !cat.includes('주택') &&
          !cat.includes('상가') &&
          !cat.includes('매장') &&
          !cat.includes('점포') &&
          !cat.includes('빌딩') &&
          !cat.includes('외벽') &&
          !cat.includes('간판') &&
          !cat.includes('어닝') &&
          !cat.includes('시트지') &&
          !cat.includes('썬팅') &&
          !cat.includes('스티커') &&
          !cat.includes('필름'))
      );
    }
    return cat.includes(selected.toLowerCase());
  };

  const filteredPosts = posts.filter((p) => matchesCategory(p.category, activeCategory));

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <button
            type="button"
            onClick={onBackHome}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            홈
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-800">작업 갤러리 (현장일지)</span>
        </nav>

        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-6 sm:p-12 text-white shadow-2xl relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Real Field Stories &amp; Work Logs</span>
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
                클리어웍스 현장 작업 갤러리
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-5">
                아파트 외창부터 상가·빌딩 외벽까지, 실제 현장에서 직접 시공한 전후 결과와 클리어웍스만의 세척 노하우를 생생한 현장 일지로 만나보세요.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% 직접 시공한 현장 사례만 게재합니다</span>
              </div>
            </div>

            {isEditMode && (
              <button
                type="button"
                onClick={() => {
                  setEditingPost(null);
                  setModalOpen(true);
                }}
                className="self-start md:self-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>새 작업일지 작성하기</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <p className="text-sm font-bold text-slate-600">
              선택한 카테고리에 등록된 작업일지가 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredPosts.map((post) => (
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
                      <div
                        className="absolute top-3 right-3 z-20 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPost(post);
                            setModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950/85 hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-md cursor-pointer"
                          title="게시글 수정"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>수정</span>
                        </button>
                        {posts.length > 1 &&
                          (confirmDeleteId === post.id ? (
                            <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 shadow-md">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeletePost(post.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                삭제확인
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(post.id)}
                              className="px-2 py-1 rounded-lg bg-red-600/90 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-md cursor-pointer"
                              title="게시글 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{post.date}</span>
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                      {post.title}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {post.excerpt}
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
        )}
      </div>

      {isEditMode && (
        <GalleryPostModal
          isOpen={modalOpen}
          editingPost={editingPost}
          onUploadImage={onUploadImage}
          onClose={() => {
            setModalOpen(false);
            setEditingPost(null);
          }}
          onSave={(saved) => {
            if (editingPost) {
              onUpdatePost(saved);
            } else {
              onAddPost(saved);
            }
          }}
        />
      )}
    </div>
  );
};
