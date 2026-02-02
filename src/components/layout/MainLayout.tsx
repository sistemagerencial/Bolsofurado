
import { ReactNode } from 'react';
import Sidebar, { SidebarProvider, useSidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

function MainContent({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <main 
      className={`
        min-h-screen w-full
        transition-all duration-300 ease-in-out
        lg:pl-20
        ${isOpen ? 'lg:pl-64' : 'lg:pl-20'}
      `}
      style={{
        transitionProperty: 'padding-left',
      }}
    >
      <div className="w-full transition-all duration-300 ease-in-out">
        {children}
      </div>
    </main>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#0E0B16] flex">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
