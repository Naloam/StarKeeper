import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StarredRepo, RepoMetadata, Collection } from "./types";

// ============================================================
// applyFilters 防抖 — 避免连续 setSearchQuery/setSortBy 等触发过多重计算
// ============================================================
let filterTimer = null;
const FILTER_DEBOUNCE_MS = 32; // ~1 帧间隔，足够合并同一 tick 内的多次 setState

function debouncedApplyFilters() {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    filterTimer = null;
    useStarsStore.getState()._applyFiltersImmediate();
  }, FILTER_DEBOUNCE_MS);
}

/**
 * 认证状态管理
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // 状态
      isAuthenticated: false,
      user: null,
      accessToken: null,
      gistId: null,

      // Actions
      login: (user, accessToken, gistId = null) => {
        set({
          isAuthenticated: true,
          user,
          accessToken,
          gistId,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          gistId: null,
        });
        // 清除其他 store
        useStarsStore.getState().clearStars();
      },

      updateUser: (user) => {
        set({ user });
      },

      setGistId: (gistId) => {
        set({ gistId });
      },

      // Getters
      getAccessToken: () => get().accessToken,
      getUser: () => get().user,
      getGistId: () => get().gistId,
    }),
    {
      name: "starkeeper-auth",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        gistId: state.gistId,
      }),
    },
  ),
);

/**
 * Stars 数据管理
 */
export const useStarsStore = create((set, get) => ({
  // 状态
  stars: [],
  filteredStars: [],
  loading: false,
  error: null,
  searchQuery: "",
  selectedLanguages: [],
  selectedTags: [],
  sortBy: "updated", // updated | stars | name
  sortDirection: "desc", // asc | desc
  selectedCollection: null, // 当前选中的收藏夹 ID

  // 元数据（标签、笔记等）
  metadata: {}, // { [repoId]: { tags: [], notes: '', color: '' } }

  // 收藏夹（Collections）
  collections: [], // [{ id, name, description, repoIds: [], createdAt, updatedAt }]

  // Actions
  setStars: (stars) => {
    set({ stars });
    debouncedApplyFilters();
  },

  addStar: (star) => {
    set((state) => ({
      stars: [star, ...state.stars],
    }));
    debouncedApplyFilters();
  },

  removeStar: (repoId) => {
    set((state) => ({
      stars: state.stars.filter((s) => s.id !== repoId),
    }));
    debouncedApplyFilters();
  },

  clearStars: () => {
    set({
      stars: [],
      filteredStars: [],
      metadata: {},
      searchQuery: "",
      selectedLanguages: [],
      selectedTags: [],
      selectedCollection: null,
      collections: [],
    });
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // 搜索与过滤
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    debouncedApplyFilters();
  },

  setSelectedLanguages: (languages) => {
    set({ selectedLanguages: languages });
    debouncedApplyFilters();
  },

  setSelectedTags: (tags) => {
    set({ selectedTags: tags });
    debouncedApplyFilters();
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    debouncedApplyFilters();
  },

  setSortDirection: (direction) => {
    set({ sortDirection: direction });
    debouncedApplyFilters();
  },

  // 应用过滤和排序
  applyFilters: () => {
    const {
      stars,
      searchQuery,
      selectedLanguages,
      selectedTags,
      sortBy,
      sortDirection,
      metadata,
      selectedCollection,
      collections,
    } = get();

    let filtered = [...stars];

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (star) =>
          star.name.toLowerCase().includes(query) ||
          star.fullName.toLowerCase().includes(query) ||
          star.description?.toLowerCase().includes(query) ||
          star.owner.login.toLowerCase().includes(query),
      );
    }

    // 语言过滤
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter((star) => selectedLanguages.includes(star.language));
    }

    // 标签过滤
    if (selectedTags.length > 0) {
      filtered = filtered.filter((star) => {
        const starTags = metadata[star.id]?.tags || [];
        return selectedTags.some((tag) => starTags.includes(tag));
      });
    }

    // 收藏夹过滤
    if (selectedCollection) {
      const col = collections.find((c) => c.id === selectedCollection);
      if (col) {
        const repoIdSet = new Set(col.repoIds);
        filtered = filtered.filter((star) => repoIdSet.has(star.id));
      }
    }

    // 排序
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case "stars":
          compareValue = a.stargazersCount - b.stargazersCount;
          break;
        case "name":
          compareValue = a.name.localeCompare(b.name);
          break;
        case "updated":
        default:
          compareValue =
            (new Date(a.updatedAt).getTime() || 0) - (new Date(b.updatedAt).getTime() || 0);
          break;
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });

    set({ filteredStars: filtered });
  },

  // 元数据管理
  setMetadata: (metadata) => {
    set({ metadata });
  },

  updateRepoMetadata: (repoId, updates) => {
    set((state) => ({
      metadata: {
        ...state.metadata,
        [repoId]: {
          ...state.metadata[repoId],
          ...updates,
        },
      },
    }));
  },

  addTag: (repoId, tag) => {
    const current = get().metadata[repoId] || { tags: [], notes: "" };
    if (!current.tags.includes(tag)) {
      get().updateRepoMetadata(repoId, {
        tags: [...current.tags, tag],
      });
    }
  },

  removeTag: (repoId, tag) => {
    const current = get().metadata[repoId] || { tags: [], notes: "" };
    get().updateRepoMetadata(repoId, {
      tags: current.tags.filter((t) => t !== tag),
    });
  },

  setNotes: (repoId, notes) => {
    get().updateRepoMetadata(repoId, { notes });
  },

  // Collections 管理
  setCollections: (collections) => {
    set({ collections });
  },

  createCollection: (name, description = "") => {
    const collection = {
      id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      description,
      repoIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ collections: [...state.collections, collection] }));
    return collection;
  },

  updateCollection: (collectionId, updates) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c,
      ),
    }));
  },

  deleteCollection: (collectionId) => {
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== collectionId),
      selectedCollection:
        state.selectedCollection === collectionId ? null : state.selectedCollection,
    }));
  },

  addRepoToCollection: (collectionId, repoId) => {
    set((state) => ({
      collections: state.collections.map((c) => {
        if (c.id === collectionId && !c.repoIds.includes(repoId)) {
          return { ...c, repoIds: [...c.repoIds, repoId], updatedAt: new Date().toISOString() };
        }
        return c;
      }),
    }));
  },

  removeRepoFromCollection: (collectionId, repoId) => {
    set((state) => ({
      collections: state.collections.map((c) => {
        if (c.id === collectionId) {
          return {
            ...c,
            repoIds: c.repoIds.filter((id) => id !== repoId),
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      }),
    }));
  },

  setSelectedCollection: (collectionId) => {
    set({ selectedCollection: collectionId });
    debouncedApplyFilters();
  },

  // Getters
  getAllLanguages: () => {
    const stars = get().stars;
    const languages = new Set(stars.map((s) => s.language).filter(Boolean));
    return Array.from(languages).sort();
  },

  getAllTags: () => {
    const metadata = get().metadata;
    const tags = new Set();
    Object.values(metadata).forEach((m) => {
      m.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  },

  getStarById: (repoId) => {
    return get().stars.find((s) => s.id === repoId);
  },
}));

/**
 * UI 状态管理
 */
export const useUIStore = create((set) => ({
  // 状态
  sidebarOpen: typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  viewMode: "grid", // grid | list
  theme: "light", // light | dark

  // Modals
  showLoginModal: false,
  showSettingsModal: false,
  showTagModal: false,
  showAISummaryModal: false,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),

  // Modal controls
  setShowLoginModal: (show) => set({ showLoginModal: show }),
  setShowSettingsModal: (show) => set({ showSettingsModal: show }),
  setShowTagModal: (show) => set({ showTagModal: show }),
  setShowAISummaryModal: (show) => set({ showAISummaryModal: show }),
}));
