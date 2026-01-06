import { Layout } from "@/components/layout/Layout";
import { ContentGrid } from "@/components/content/ContentGrid";
import { ContentPagination } from "@/components/content/ContentPagination";
import { useState } from "react";

// Sample data - will be replaced with Firebase data
const driverItems = [
  {
    id: "1",
    title: "NVIDIA GeForce Driver 560.81",
    description: "Latest NVIDIA graphics driver for GeForce RTX series",
    category: "driver" as const,
    size: "750 MB",
    date: "2024-01-10",
    views: 15420,
    downloads: 8234,
    type: "free" as const,
  },
  {
    id: "2",
    title: "AMD Radeon Adrenalin 24.1",
    description: "AMD graphics driver with Radeon Super Resolution",
    category: "driver" as const,
    size: "680 MB",
    date: "2024-01-09",
    views: 12350,
    downloads: 6120,
    type: "free" as const,
  },
  {
    id: "3",
    title: "Intel Graphics Driver 31.0",
    description: "Intel Arc & Iris Xe graphics driver pack",
    category: "driver" as const,
    size: "520 MB",
    date: "2024-01-08",
    views: 8920,
    downloads: 4560,
    type: "free" as const,
  },
  {
    id: "4",
    title: "Realtek Audio Driver Pack",
    description: "Complete audio driver solution for all Realtek chipsets",
    category: "driver" as const,
    size: "320 MB",
    date: "2024-01-07",
    views: 21500,
    downloads: 15680,
    type: "free" as const,
  },
  {
    id: "5",
    title: "DriverPack Solution VIP",
    description: "All-in-one driver pack for Windows 10/11 - Auto detect & install",
    category: "driver" as const,
    size: "2.5 GB",
    date: "2024-01-06",
    views: 45200,
    downloads: 22100,
    type: "vip" as const,
  },
  {
    id: "6",
    title: "Snappy Driver Installer Origin",
    description: "Portable driver installer with offline database",
    category: "driver" as const,
    size: "1.8 GB",
    date: "2024-01-05",
    views: 18900,
    downloads: 9450,
    type: "free" as const,
  },
  {
    id: "7",
    title: "USB 3.0 Driver Pack",
    description: "Universal USB 3.0 drivers for all motherboards",
    category: "driver" as const,
    size: "85 MB",
    date: "2024-01-04",
    views: 7650,
    downloads: 3820,
    type: "free" as const,
  },
  {
    id: "8",
    title: "Network Adapter Drivers",
    description: "LAN & WiFi drivers collection for Intel, Realtek, Broadcom",
    category: "driver" as const,
    size: "450 MB",
    date: "2024-01-03",
    views: 14200,
    downloads: 7100,
    type: "free" as const,
  },
  {
    id: "9",
    title: "Chipset Drivers Collection",
    description: "AMD & Intel chipset drivers pack for motherboards",
    category: "driver" as const,
    size: "380 MB",
    date: "2024-01-02",
    views: 11300,
    downloads: 5650,
    type: "free" as const,
  },
  {
    id: "10",
    title: "Complete Driver Pack 2024 VIP",
    description: "Ultimate driver collection for Windows 7/8/10/11 - VIP exclusive",
    category: "driver" as const,
    size: "18 GB",
    date: "2024-01-01",
    views: 78500,
    downloads: 35200,
    type: "vip" as const,
  },
];

const ITEMS_PER_PAGE = 10;

const Driver = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(driverItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = driverItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ContentGrid
          title="Driver Downloads"
          description="Latest drivers for graphics, audio, network, and more"
          items={currentItems}
        />
        
        {totalPages > 1 && (
          <ContentPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </Layout>
  );
};

export default Driver;
