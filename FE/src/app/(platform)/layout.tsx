import Header from "@/components/ui/header";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import DynamicSidebarContent from "@/components/ui/dynamic-sidebar-content";
import SidebarHeader from "@/components/ui/sidebar-header";
import FadeInWrapper from "@/components/ui/fade-in-wrapper";
import { BoltNewBadge } from "@/components/ui/BoltNewBadge";
import { getSidebarState } from "@/lib/sidebar-server";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the sidebar state from server-side cookies
  const initialSidebarState = await getSidebarState();

  return (
    <div className="flex flex-col h-screen bg-neutral-100 dark:bg-neutral-800">
      {/* Header */}
      <Header />
      
      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <FadeInWrapper 
          delay={100} 
          direction="right" 
          className="flex-shrink-0"
        >
          <Sidebar initialServerState={initialSidebarState}>
            <SidebarBody className="justify-between gap-0">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <SidebarHeader />
                <div className="p-4 flex flex-col gap-2">
                  <DynamicSidebarContent />
                </div>
              </div>
            </SidebarBody>
          </Sidebar>
        </FadeInWrapper>
        
        {/* Main content container with rounded corners and fade-in */}
        <FadeInWrapper 
          delay={200} 
          direction="up" 
          className="flex-1 flex flex-col p-1 min-h-0"
        >
          <main className="flex-1 flex flex-col min-h-0">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm flex-1 p-6 overflow-auto min-h-0">
              {children}
            </div>
          </main>
        </FadeInWrapper>
      </div>
      
      {/* Bolt Badge */}
      <BoltNewBadge position="bottom-right" variant="auto" size="medium" />
    </div>
  );
}
