import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
  sidebarProps?: Record<string, unknown>;
}

export default function MainLayout({ children, sidebarProps }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="flex relative">
        <Sidebar {...(sidebarProps || {})} />
        <main
          id="main-content"
          className="flex-1 overflow-auto h-[calc(100vh-4rem)] w-full lg:w-auto"
        >
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
