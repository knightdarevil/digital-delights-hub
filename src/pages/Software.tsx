import { Layout } from "@/components/layout/Layout";
import { ContentGrid } from "@/components/content/ContentGrid";

const sampleItems = [
  {
    id: "1",
    title: "Adobe Creative Cloud 2024",
    description: "Complete creative suite including Photoshop, Illustrator, and Premiere Pro",
    category: "Design",
    size: "12.5 GB",
    date: "Dec 2024",
  },
  {
    id: "2",
    title: "AutoCAD 2024",
    description: "Professional 2D and 3D CAD design and drafting software",
    category: "CAD",
    size: "5.2 GB",
    date: "Nov 2024",
  },
  {
    id: "3",
    title: "Visual Studio 2024",
    description: "Complete IDE for developers with AI-powered features",
    category: "Development",
    size: "8.5 GB",
    date: "Dec 2024",
  },
  {
    id: "4",
    title: "JetBrains All Products Pack",
    description: "All JetBrains IDEs including IntelliJ, WebStorm, and PyCharm",
    category: "Development",
    size: "6.8 GB",
    date: "Dec 2024",
  },
  {
    id: "5",
    title: "VMware Workstation Pro",
    description: "Desktop virtualization software for running multiple OS",
    category: "Virtualization",
    size: "650 MB",
    date: "Nov 2024",
  },
  {
    id: "6",
    title: "3ds Max 2024",
    description: "3D modeling, animation, and rendering software",
    category: "3D Design",
    size: "7.2 GB",
    date: "Oct 2024",
  },
  {
    id: "7",
    title: "Blender 4.0",
    description: "Free and open-source 3D creation suite",
    category: "3D Design",
    size: "450 MB",
    date: "Dec 2024",
  },
  {
    id: "8",
    title: "DaVinci Resolve Studio",
    description: "Professional video editing and color grading software",
    category: "Video Editing",
    size: "3.5 GB",
    date: "Dec 2024",
  },
];

const Software = () => {
  return (
    <Layout>
      <div className="pt-8">
        <ContentGrid
          title="Software"
          description="Design tools, development applications, and professional software"
          items={sampleItems}
        />
      </div>
    </Layout>
  );
};

export default Software;
