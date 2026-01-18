import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminKeys } from "@/components/admin/AdminKeys";

type AdminTab = "stats" | "users" | "content" | "keys";

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="lg:col-span-4">
              {activeTab === "stats" && <AdminStats />}
              {activeTab === "users" && <AdminUsers />}
              {activeTab === "content" && <AdminContent />}
              {activeTab === "keys" && <AdminKeys />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
