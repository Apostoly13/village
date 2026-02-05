import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import Navigation from "../components/Navigation";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Forums({ user }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/forums/categories`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const topicCategories = categories.filter(c => c.category_type === 'topic');
  const ageCategories = categories.filter(c => c.category_type === 'age_group');

  const CategoryCard = ({ category, index }) => (
    <Link 
      to={`/forums/${category.category_id}`}
      className="block"
      data-testid={`category-card-${index}`}
    >
      <div className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all card-hover h-full">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{category.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-lg text-foreground mb-1">{category.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{category.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-full bg-secondary">{category.post_count || 0} posts</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto px-4 pt-20 lg:pt-24">
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">Forums</h1>
          <p className="text-muted-foreground">Find discussions by topic or your child's age</p>
        </div>

        <Tabs defaultValue="topics" className="w-full">
          <TabsList className="w-full bg-card border border-border/50 rounded-xl p-1 mb-6">
            <TabsTrigger 
              value="topics" 
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-topics"
            >
              By Topic
            </TabsTrigger>
            <TabsTrigger 
              value="age" 
              className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-age"
            >
              By Age Group
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topics" className="mt-0">
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-5 bg-muted rounded"></div>
                        <div className="w-full h-4 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topicCategories.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-5xl mb-4 block">📁</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">No categories yet</h3>
                <p className="text-muted-foreground">Check back soon!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {topicCategories.map((category, idx) => (
                  <CategoryCard key={category.category_id} category={category} index={idx} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="age" className="mt-0">
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-5 bg-muted rounded"></div>
                        <div className="w-full h-4 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : ageCategories.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <span className="text-5xl mb-4 block">👶</span>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">No age groups yet</h3>
                <p className="text-muted-foreground">Check back soon!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {ageCategories.map((category, idx) => (
                  <CategoryCard key={category.category_id} category={category} index={idx} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
