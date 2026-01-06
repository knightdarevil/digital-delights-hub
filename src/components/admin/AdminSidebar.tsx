import { Button } from "@/components/ui/button";
import { BarChart3, Users, FileText } from "lucide-react";

type AdminTab = "stats" | "users" | "content";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const tabs = [
    { id: "stats" as AdminTab, label: "Statistics", icon: BarChart3 },
    { id: "users" as AdminTab, label: "Users", icon: Users },
    { id: "content" as AdminTab, label: "Content", icon: FileText },
  ];

  return (
    <div className="content-card p-4 h-fit">
      <nav className="space-y-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onTabChange(tab.id)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </nav>
    </div>
  );
};
