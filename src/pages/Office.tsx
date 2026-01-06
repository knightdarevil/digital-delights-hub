import { Layout } from "@/components/layout/Layout";
import { ContentGrid } from "@/components/content/ContentGrid";

const sampleItems = [
  {
    id: "1",
    title: "Microsoft Office 2024 Pro Plus",
    description: "Complete Office suite with Word, Excel, PowerPoint, Outlook and more",
    category: "Office Suite",
    size: "4.5 GB",
    date: "Dec 2024",
  },
  {
    id: "2",
    title: "Microsoft 365 Apps",
    description: "Cloud-connected Office apps with latest features and updates",
    category: "Office Suite",
    size: "3.8 GB",
    date: "Dec 2024",
  },
  {
    id: "3",
    title: "Microsoft Visio 2024",
    description: "Professional diagramming and flowchart creation tool",
    category: "Productivity",
    size: "1.2 GB",
    date: "Nov 2024",
  },
  {
    id: "4",
    title: "Microsoft Project 2024",
    description: "Project management software for planning and tracking projects",
    category: "Productivity",
    size: "1.5 GB",
    date: "Nov 2024",
  },
  {
    id: "5",
    title: "LibreOffice 24.2",
    description: "Free and open-source office suite alternative",
    category: "Office Suite",
    size: "350 MB",
    date: "Dec 2024",
  },
  {
    id: "6",
    title: "WPS Office 2024",
    description: "Lightweight office suite compatible with Microsoft formats",
    category: "Office Suite",
    size: "450 MB",
    date: "Dec 2024",
  },
];

const Office = () => {
  return (
    <Layout>
      <div className="pt-8">
        <ContentGrid
          title="Office"
          description="Productivity suites and office applications for work and study"
          items={sampleItems}
        />
      </div>
    </Layout>
  );
};

export default Office;
