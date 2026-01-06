import { Layout } from "@/components/layout/Layout";
import { ContentGrid } from "@/components/content/ContentGrid";

const sampleItems = [
  {
    id: "1",
    title: "Documentary Collection 2024",
    description: "Award-winning documentaries covering science, nature, and history",
    category: "Documentary",
    size: "25 GB",
    date: "Dec 2024",
  },
  {
    id: "2",
    title: "Tech Conference Talks",
    description: "Best talks from Google I/O, WWDC, and tech conferences",
    category: "Educational",
    size: "18 GB",
    date: "Nov 2024",
  },
  {
    id: "3",
    title: "Animation Masterpieces",
    description: "Collection of acclaimed animated films and short films",
    category: "Animation",
    size: "35 GB",
    date: "Dec 2024",
  },
  {
    id: "4",
    title: "Indie Film Festival Winners",
    description: "Award-winning independent films from around the world",
    category: "Indie",
    size: "28 GB",
    date: "Oct 2024",
  },
  {
    id: "5",
    title: "Science Explained Series",
    description: "Educational videos explaining complex scientific concepts",
    category: "Educational",
    size: "12 GB",
    date: "Nov 2024",
  },
  {
    id: "6",
    title: "Travel & Adventure",
    description: "Stunning travel documentaries and adventure films",
    category: "Documentary",
    size: "22 GB",
    date: "Dec 2024",
  },
];

const Movies = () => {
  return (
    <Layout>
      <div className="pt-8">
        <ContentGrid
          title="Movies"
          description="Documentaries, educational content, and entertainment videos"
          items={sampleItems}
        />
      </div>
    </Layout>
  );
};

export default Movies;
