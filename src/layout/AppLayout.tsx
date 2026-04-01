import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';
import Sidebar from './Sidebar';
import TopNavBar from './TopNavBar';

const AppLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isChatRoute = pathname === '/chat';

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-50">
          <div className="pointer-events-auto">
            <TopNavBar />
          </div>
        </div>
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <div className="pointer-events-none absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div
            className={cn(
              'flex min-h-0 w-full flex-1 flex-col px-4 pt-16 lg:px-5',
              isChatRoute ? 'pb-0' : 'pb-6'
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
