import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "#080E1A" }}>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar title="Overview" breadcrumb="Dashboard" agentLive={true} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
