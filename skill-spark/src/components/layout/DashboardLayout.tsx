import { ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background-alt">
      <Navbar />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
