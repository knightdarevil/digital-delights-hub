import { ContentCard } from "./ContentCard";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  size: string;
  date: string;
  imageUrl?: string;
}

interface ContentGridProps {
  items: ContentItem[];
  title: string;
  description?: string;
}

export const ContentGrid = ({ items, title, description }: ContentGridProps) => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ContentCard {...item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 content-card">
            <p className="text-muted-foreground">No content available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
};
