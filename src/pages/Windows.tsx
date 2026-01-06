import { Layout } from "@/components/layout/Layout";
import { ContentGrid } from "@/components/content/ContentGrid";

const sampleItems = [
  {
    id: "1",
    title: "Windows 11 Pro 23H2",
    description: "Latest Windows 11 Pro edition with all security updates and new features",
    category: "Operating System",
    size: "5.2 GB",
    date: "Dec 2024",
  },
  {
    id: "2",
    title: "Windows 10 Enterprise LTSC",
    description: "Long-term servicing channel version for enterprise environments",
    category: "Operating System",
    size: "4.8 GB",
    date: "Nov 2024",
  },
  {
    id: "3",
    title: "Windows Server 2022",
    description: "Server operating system with enhanced security and hybrid capabilities",
    category: "Server OS",
    size: "6.1 GB",
    date: "Oct 2024",
  },
  {
    id: "4",
    title: "Windows 11 Lite Edition",
    description: "Lightweight version optimized for older hardware and better performance",
    category: "Operating System",
    size: "3.2 GB",
    date: "Dec 2024",
  },
  {
    id: "5",
    title: "Windows Tools Collection",
    description: "Essential system utilities and administration tools for Windows",
    category: "Utilities",
    size: "850 MB",
    date: "Dec 2024",
  },
  {
    id: "6",
    title: "Windows Recovery Tools",
    description: "Complete toolkit for system recovery and repair operations",
    category: "Utilities",
    size: "1.2 GB",
    date: "Nov 2024",
  },
];

const Windows = () => {
  return (
    <Layout>
      <div className="pt-8">
        <ContentGrid
          title="Windows"
          description="Download Windows operating systems, utilities, and system tools"
          items={sampleItems}
        />
      </div>
    </Layout>
  );
};

export default Windows;
