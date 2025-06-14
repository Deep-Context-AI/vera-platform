import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Users, FileCheck, BarChart3 } from "lucide-react";

const links = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Practitioners",
    href: "/practitioners",
    icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Verifications",
    href: "/verifications",
    icon: <FileCheck className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex">
      <Sidebar>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Settings",
                href: "/settings",
                icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to the Dashboard</h1>
        <p className="mt-4 text-gray-600">Select an option from the sidebar to get started.</p>
      </div>
    </div>
  );
}
