import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StarredRepo, RepoMetadata, Collection, ShareConfig } from "../types";
import { moveToSessionStorage } from "./session-storage";
import { useSettingsStore } from "./settings";

type User = { id: number; login: string; name: string | null; avatarUrl: string };
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  gistId: string | null;
  login: (user: User, token: string, gistId?: string | null) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setGistId: (id: string | null) => void;
  getAccessToken: () => string | null;
  getUser: () => User | null;
  getGistId: () => string | null;
}

interface StarsState {
  stars: StarredRepo[];
  filteredStars: StarredRepo[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedLanguages: string[];
  selectedTags: string[];
  sortBy: "updated" | "stars" | "name";
  sortDirection: "asc" | "desc";
  selectedCollection: string | null;
  collections: Collection[];
  shareConfig: ShareConfig | null;
  metadata: Record<string, RepoMetadata>;
  setStars: (stars: StarredRepo[]) => void;
  addStar: (star: StarredRepo) => void;
  removeStar: (id: number) => void;
  clearStars: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedLanguages: (languages: string[]) => void;
  setSelectedTags: (tags: string[]) => void;
  setSortBy: (sort: StarsState["sortBy"]) => void;
  setSortDirection: (direction: StarsState["sortDirection"]) => void;
  setSelectedCollection: (id: string | null) => void;
  applyFilters: () => void;
  setMetadata: (metadata: StarsState["metadata"]) => void;
  setCollections: (collections: Collection[]) => void;
  setShareConfig: (config: ShareConfig | null) => void;
  getAllLanguages: () => string[];
  getAllTags: () => string[];
  getStarById: (id: number) => StarredRepo | undefined;
}

interface UIState {
  sidebarOpen: boolean;
  viewMode: "grid" | "list";
  theme: "light" | "dark";
  showLoginModal: boolean;
  showSettingsModal: boolean;
  showTagModal: boolean;
  showAISummaryModal: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setViewMode: (mode: UIState["viewMode"]) => void;
  setTheme: (theme: UIState["theme"]) => void;
  toggleTheme: () => void;
  setShowLoginModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setShowTagModal: (show: boolean) => void;
  setShowAISummaryModal: (show: boolean) => void;
}

moveToSessionStorage("starkeeper-auth", (value) => {
  const state = JSON.parse(value).state;
  if (state?.user?.id && state.gistId)
    localStorage.setItem(`starkeeper-gist:${state.user.id}`, state.gistId);
});
try {
  localStorage.removeItem("github_token");
} catch {
  /* storage is unavailable */
}

// ============================================================
// applyFilters 防抖 — 避免连续 setSearchQuery/setSortBy 等触发过多重计算
// ============================================================
let filterTimer: ReturnType<typeof setTimeout> | null = null;
const FILTER_DEBOUNCE_MS = 32; // ~1 帧间隔，足够合并同一 tick 内的多次 setState

function debouncedApplyFilters() {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    filterTimer = null;
    useStarsStore.getState().applyFilters();
  }, FILTER_DEBOUNCE_MS);
}

/**
 * 认证状态管理
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 状态
      isAuthenticated: false,
      user: null,
      accessToken: null,
      gistId: null,

      // Actions
      login: (user, accessToken, gistId = null) => {
        if (get().user?.id !== user.id) useStarsStore.getState().clearStars();
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
        useSettingsStore.getState().clearAll();
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
      storage: createJSONStorage(() => sessionStorage),
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
export const useStarsStore = create<StarsState>((set, get) => ({
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
  shareConfig: null,
  setShareConfig: (shareConfig: ShareConfig | null) => set({ shareConfig }),
  collections: [], // [{ id, name, description, repoIds: [], createdAt, updatedAt }]

  // Actions
  setStars: (stars) => {
    set({ stars });
    debouncedApplyFilters();
  },

  addStar: (star) => {
    set((state) => ({
      stars: [star, ...state.stars.filter((item) => item.id !== star.id)],
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
      loading: false,
      error: null,
      metadata: {},
      searchQuery: "",
      selectedLanguages: [],
      selectedTags: [],
      selectedCollection: null,
      collections: [],
      shareConfig: null,
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
      filtered = filtered.filter(
        (star) => star.language !== null && selectedLanguages.includes(star.language),
      );
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
    debouncedApplyFilters();
  },

  setCollections: (collections) => {
    set((state) => ({
      collections,
      selectedCollection: collections.some((item) => item.id === state.selectedCollection)
        ? state.selectedCollection
        : null,
    }));
    debouncedApplyFilters();
  },

  setSelectedCollection: (collectionId) => {
    set({ selectedCollection: collectionId });
    debouncedApplyFilters();
  },

  // Getters
  getAllLanguages: () => {
    const stars = get().stars;
    const languages = new Set(
      stars.map((s) => s.language).filter((language): language is string => !!language),
    );
    return Array.from(languages).sort();
  },

  getAllTags: () => {
    const metadata = get().metadata;
    const tags = new Set<string>();
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
export const useUIStore = create<UIState>((set) => ({
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
