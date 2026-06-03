import TopNav from '@/components/layout/TopNav';

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#edf1f7]">
      <TopNav />
      <main className="pt-[88px] h-screen">
        {children}
      </main>
    </div>
  );
}