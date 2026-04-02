import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 用户设置状态管理
 * 持久化到 localStorage，存储用户自行配置的 API Key
 */
interface SettingsState {
  deepseekApiKey: string;
  siliconflowApiKey: string;

  setDeepseekApiKey: (key: string) => void;
  setSiliconflowApiKey: (key: string) => void;
  clearAll: () => void;
}

export const useSettingsStore = create(
  persist<SettingsState>(
    (set) => ({
      deepseekApiKey: "",
      siliconflowApiKey: "",

      setDeepseekApiKey: (key: string) => set({ deepseekApiKey: key }),
      setSiliconflowApiKey: (key: string) => set({ siliconflowApiKey: key }),
      clearAll: () => set({ deepseekApiKey: "", siliconflowApiKey: "" }),
    }),
    {
      name: "starkeeper-settings",
    },
  ),
);
