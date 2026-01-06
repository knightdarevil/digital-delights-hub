import { Layout } from "@/components/layout/Layout";
import { ContentGrid } from "@/components/content/ContentGrid";

const sampleItems = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    description: "Learn HTML, CSS, JavaScript, React, Node.js and become a full-stack developer",
    category: "Programming",
    size: "45 GB",
    date: "Dec 2024",
  },
  {
    id: "2",
    title: "Python for Data Science & ML",
    description: "Master Python, Pandas, NumPy, and Machine Learning algorithms",
    category: "Data Science",
    size: "32 GB",
    date: "Nov 2024",
  },
  {
    id: "3",
    title: "UI/UX Design Masterclass",
    description: "Learn Figma, design principles, and create stunning user interfaces",
    category: "Design",
    size: "28 GB",
    date: "Dec 2024",
  },
  {
    id: "4",
    title: "AWS Cloud Practitioner Course",
    description: "Prepare for AWS certification with hands-on projects",
    category: "Cloud",
    size: "18 GB",
    date: "Nov 2024",
  },
  {
    id: "5",
    title: "Digital Marketing Complete Guide",
    description: "SEO, Social Media, Google Ads, and content marketing strategies",
    category: "Marketing",
    size: "22 GB",
    date: "Oct 2024",
  },
  {
    id: "6",
    title: "Cybersecurity Fundamentals",
    description: "Learn ethical hacking, penetration testing, and security best practices",
    category: "Security",
    size: "35 GB",
    date: "Dec 2024",
  },
  {
    id: "7",
    title: "Mobile App Development with Flutter",
    description: "Build cross-platform iOS and Android apps with Dart and Flutter",
    category: "Programming",
    size: "25 GB",
    date: "Nov 2024",
  },
  {
    id: "8",
    title: "Business & Entrepreneurship",
    description: "Start and grow your business with proven strategies",
    category: "Business",
    size: "15 GB",
    date: "Dec 2024",
  },
];

const Courses = () => {
  return (
    <Layout>
      <div className="pt-8">
        <ContentGrid
          title="Courses"
          description="Learn programming, design, business, and other valuable skills"
          items={sampleItems}
        />
      </div>
    </Layout>
  );
};

export default Courses;
