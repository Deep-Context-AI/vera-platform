import Header from "@/components/ui/header";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import DynamicSidebarContent from "@/components/ui/dynamic-sidebar-content";
import SidebarHeader from "@/components/ui/sidebar-header";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen bg-neutral-100 dark:bg-neutral-800">
      {/* Header */}
      <Header />
      
      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar>
          <SidebarBody className="justify-between gap-0">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              <SidebarHeader />
              <div className="p-4 flex flex-col gap-2">
                <DynamicSidebarContent />
              </div>
            </div>
          </SidebarBody>
        </Sidebar>
        
        {/* Main content container with rounded corners */}
        <main className="flex-1 overflow-auto p-1">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm h-full p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
