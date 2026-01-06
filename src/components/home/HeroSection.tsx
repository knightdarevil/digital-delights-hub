import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Star, Users, Shield } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Premium Digital Content Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Download Premium
            <span className="block gradient-text mt-2">Software & Content</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Access thousands of Windows apps, Office tools, courses, and movies. 
            Free users get 3 downloads per week. Upgrade to VIP for unlimited access.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/register">
              <Button variant="hero" size="xl">
                <Download className="w-5 h-5" />
                Start Downloading
              </Button>
            </Link>
            <Link to="/software">
              <Button variant="glass" size="xl">
                Browse Content
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="stat-card text-center">
              <div className="flex items-center justify-center mb-2">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold gradient-text">10K+</div>
              <div className="text-sm text-muted-foreground">Downloads</div>
            </div>
            <div className="stat-card text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold gradient-text">5K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="stat-card text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold gradient-text">100%</div>
              <div className="text-sm text-muted-foreground">Verified Safe</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
