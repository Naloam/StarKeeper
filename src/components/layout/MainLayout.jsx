import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="flex relative">
        <Sidebar />
        <main className="flex-1 overflow-auto h-[calc(100vh-4rem)] w-full lg:w-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
