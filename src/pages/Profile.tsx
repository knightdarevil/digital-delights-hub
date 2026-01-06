import { useNavigate } from "react-router-dom";
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
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { VIP_LABELS } from "@/types/user";

const Profile = () => {
  const { userProfile, isVIP, remainingDownloads, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!userProfile) {
    navigate("/login");
    return null;
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  const getDaysUntilReset = () => {
    const weekStart = new Date(userProfile.weekStartDate);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - daysPassed);
  };

  const getVIPDaysRemaining = () => {
    if (!userProfile.vipExpiresAt) return null;
    const now = new Date();
    const days = Math.ceil((userProfile.vipExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

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
                <h1 className="text-2xl font-bold mb-2">{userProfile.displayName}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground text-sm">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{userProfile.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(userProfile.createdAt)}</span>
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
                <span className="font-semibold">{VIP_LABELS[userProfile.vipType]}</span>
              </div>
            </div>
          </div>

          {/* VIP Status */}
          {isVIP && userProfile.vipExpiresAt && (
            <div className="content-card p-6 mb-8 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="font-semibold text-yellow-500">VIP Active</p>
                  <p className="text-sm text-muted-foreground">
                    {getVIPDaysRemaining()} days remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">This Week</span>
              </div>
              <div className="text-3xl font-bold">
                {userProfile.downloadsThisWeek}
                {!isVIP && <span className="text-muted-foreground text-lg">/3</span>}
              </div>
              {!isVIP && (
                <div className="mt-2">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-primary rounded-full transition-all"
                      style={{ width: `${(userProfile.downloadsThisWeek / 3) * 100}%` }}
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
              <div className="text-3xl font-bold">{userProfile.totalDownloads}</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-sm">
                  {isVIP ? "VIP Status" : "Reset In"}
                </span>
              </div>
              <div className="text-3xl font-bold">
                {isVIP ? (userProfile.vipType === 'vip_lifetime' ? '∞' : `${getVIPDaysRemaining()} days`) : `${getDaysUntilReset()} days`}
              </div>
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

              {/* VIP Plans */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border text-center">
                  <h3 className="font-semibold mb-1">VIP 7 Days</h3>
                  <p className="text-2xl font-bold text-primary">50,000đ</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-primary/50 text-center relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                    Popular
                  </div>
                  <h3 className="font-semibold mb-1">VIP 30 Days</h3>
                  <p className="text-2xl font-bold text-primary">150,000đ</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border text-center">
                  <h3 className="font-semibold mb-1">VIP Lifetime</h3>
                  <p className="text-2xl font-bold text-primary">500,000đ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      Send it to: admin@downloadhub.com
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">3.</span>
                      Or contact us via Facebook
                    </li>
                  </ul>
                  <Button variant="glass" className="w-full" size="sm">
                    Contact Admin on Facebook
                  </Button>
                </div>
              </div>

              <p className="text-center text-muted-foreground text-sm mt-6">
                VIP status will be activated within 24 hours after verification
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
