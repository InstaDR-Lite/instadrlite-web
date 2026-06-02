import TopNav from '@/components/layout/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <TopNav />
      <main className="pt-[88px] h-screen">
        <div className=" h-full">
          {children}
        </div>
      </main>
    </div>
  );
}