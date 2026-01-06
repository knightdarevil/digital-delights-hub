import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ContentGrid } from "@/components/content/ContentGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon } from "lucide-react";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);

  // Mock search results - will be replaced with Firebase search
  const searchResults = [
    {
      id: "1",
      title: "Windows 11 Pro",
      description: "Latest Windows 11 Professional Edition",
      category: "windows" as const,
      size: "5.2 GB",
      date: "2024-01-10",
      views: 15000,
      downloads: 8500,
      type: "free" as const,
    },
    {
      id: "2",
      title: "Microsoft Office 2024",
      description: "Complete Office Suite with Word, Excel, PowerPoint",
      category: "software" as const,
      size: "3.8 GB",
      date: "2024-01-08",
      views: 12000,
      downloads: 6200,
      type: "vip" as const,
    },
  ].filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchInput });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Search Content</h1>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, type, or description..."
                className="pl-10"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Button variant="hero" type="submit">
              Search
            </Button>
          </form>
        </div>

        {query && (
          <>
            <p className="text-muted-foreground mb-6">
              Found {searchResults.length} results for "{query}"
            </p>
            
            {searchResults.length > 0 ? (
              <ContentGrid
                title="Search Results"
                items={searchResults}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  No results found. Try different keywords.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Search;
