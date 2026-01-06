import { Link } from "react-router-dom";
import { Monitor, FileText, Box, GraduationCap, Film, ArrowRight } from "lucide-react";

const categories = [
  {
    name: "Windows",
    description: "Operating systems, utilities, and system tools",
    icon: Monitor,
    path: "/windows",
    count: "500+",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    name: "Office",
    description: "Productivity suites and office applications",
    icon: FileText,
    path: "/office",
    count: "200+",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  {
    name: "Software",
    description: "Design tools, development apps, and more",
    icon: Box,
    path: "/software",
    count: "1000+",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    name: "Courses",
    description: "Learn programming, design, and business skills",
    icon: GraduationCap,
    path: "/courses",
    count: "300+",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    name: "Movies",
    description: "Entertainment and educational videos",
    icon: Film,
    path: "/movies",
    count: "800+",
    gradient: "from-yellow-500/20 to-amber-500/20",
  },
];

export const CategorySection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Browse by <span className="gradient-text">Category</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our extensive library of premium digital content across multiple categories
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.path}
              to={category.path}
              className="group content-card relative overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <category.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="category-badge">{category.count} items</span>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {category.description}
                </p>
                
                <div className="flex items-center text-primary text-sm font-medium">
                  <span>Browse {category.name}</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
