import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Calendar, 
  Download, 
  Star, 
  Crown, 
  QrCode, 
  CreditCard,
  Facebook,
  Clock
} from "lucide-react";

const Profile = () => {
  // Mock user data - will be replaced with real data from Supabase
  const user = {
    name: "John Doe",
    email: "john@example.com",
    joinedDate: "January 2024",
    plan: "Free",
    downloadsThisWeek: 1,
    maxDownloads: 3,
    totalDownloads: 15,
  };

  const isVIP = user.plan === "VIP";

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Profile Header */}
          <div className="content-card p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-12 h-12 text-primary-foreground" />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold mb-2">{user.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {user.joinedDate}</span>
                  </div>
                </div>
              </div>

              {/* Plan Badge */}
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                isVIP 
                  ? "gradient-accent text-accent-foreground" 
                  : "bg-secondary text-secondary-foreground"
              }`}>
                {isVIP ? <Crown className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                <span className="font-semibold">{user.plan} Plan</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">This Week</span>
              </div>
              <div className="text-3xl font-bold">
                {user.downloadsThisWeek}
                <span className="text-muted-foreground text-lg">/{user.maxDownloads}</span>
              </div>
              {!isVIP && (
                <div className="mt-2">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-primary rounded-full transition-all"
                      style={{ width: `${(user.downloadsThisWeek / user.maxDownloads) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">Total Downloads</span>
              </div>
              <div className="text-3xl font-bold">{user.totalDownloads}</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">Reset In</span>
              </div>
              <div className="text-3xl font-bold">5 days</div>
            </div>
          </div>

          {/* Upgrade to VIP Section */}
          {!isVIP && (
            <div className="content-card p-8 mb-8 border-primary/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                  <Crown className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Upgrade to VIP</h2>
                  <p className="text-muted-foreground text-sm">Unlock unlimited downloads</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* QR Code Option */}
                <div className="p-6 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <QrCode className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold">Scan QR Code</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Scan the QR code to make a direct payment via bank transfer or mobile wallet.
                  </p>
                  <div className="w-32 h-32 mx-auto bg-foreground rounded-lg flex items-center justify-center">
                    <span className="text-background text-xs">QR Code</span>
                  </div>
                </div>

                {/* Transfer Option */}
                <div className="p-6 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold">Bank Transfer</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Transfer directly to our bank account. After payment:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">1.</span>
                      Take a screenshot of your receipt
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">2.</span>
                      Send it to our registered email
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">3.</span>
                      Or contact us via Facebook
                    </li>
                  </ul>
                  <Button variant="glass" className="w-full" size="sm">
                    <Facebook className="w-4 h-4" />
                    Contact Admin on Facebook
                  </Button>
                </div>
              </div>

              <p className="text-center text-muted-foreground text-sm mt-6">
                VIP status will be activated within 24 hours after verification
              </p>
            </div>
          )}

          {/* Recent Downloads */}
          <div className="content-card p-8">
            <h2 className="text-xl font-bold mb-6">Recent Downloads</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Sample Download {i}</p>
                      <p className="text-sm text-muted-foreground">Downloaded 2 days ago</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">1.2 GB</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
