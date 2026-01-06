import { Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentCardProps {
  title: string;
  description: string;
  category: string;
  size: string;
  date: string;
  imageUrl?: string;
}

export const ContentCard = ({
  title,
  description,
  category,
  size,
  date,
  imageUrl,
}: ContentCardProps) => {
  return (
    <div className="content-card group">
      {/* Image/Preview */}
      <div className="relative h-40 rounded-lg bg-secondary mb-4 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Download className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="category-badge">{category}</span>
        </div>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
        {description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{size}</span>
        </div>
      </div>

      {/* Download Button */}
      <Button variant="default" className="w-full" size="sm">
        <Download className="w-4 h-4" />
        Download
      </Button>
    </div>
  );
};
