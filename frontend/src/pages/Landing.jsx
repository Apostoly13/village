import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Moon, MessageCircle, Users, Shield, Heart, ArrowRight } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Seed data on first load
    fetch(`${API_URL}/api/seed`, { method: "POST" }).catch(() => {});
    
    // Check if already logged in
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const features = [
    {
      icon: Moon,
      title: "24/7 Live Chat Rooms",
      description: "Real-time conversations with parents who are awake right now. Perfect for those 2am feeds."
    },
    {
      icon: MessageCircle,
      title: "Discussion Forums",
      description: "Browse topics like sleep training, breastfeeding, and mental health. Post questions and share experiences."
    },
    {
      icon: Shield,
      title: "Anonymous Posting",
      description: "Share sensitive struggles without revealing your identity. A judgement-free space for hard conversations."
    },
    {
      icon: Users,
      title: "Private Messaging",
      description: "Found a parent going through the same thing? Connect one-on-one for deeper support."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="hero-gradient absolute inset-0"></div>
        
        {/* Navigation */}
        <nav className="relative z-10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦉</span>
            <span className="font-heading font-bold text-xl text-foreground">NightOwl Parents</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="nav-login-btn">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-[0_0_15px_rgba(245,197,66,0.3)]" data-testid="nav-register-btn">
                Join Free
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-6 pt-16 pb-24 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm text-muted-foreground">Parents online now</span>
              </div>
              
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                You're Not Alone at <span className="text-primary">2am</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                A warm, supportive community for mums and dads navigating the beautiful chaos of parenthood. Connect, share, and find your tribe.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button 
                    size="lg" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-14 text-lg shadow-[0_0_20px_rgba(245,197,66,0.3)] btn-shine group"
                    data-testid="hero-join-btn"
                  >
                    Join the Community
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="rounded-full px-8 h-14 text-lg border-border/50 hover:bg-secondary"
                    data-testid="hero-signin-btn"
                  >
                    I Have an Account
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
              <div className="rounded-3xl overflow-hidden border border-border/30 shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1715602109442-644d0f79d655?w=600&h=500&fit=crop" 
                  alt="Parent holding baby in soft light"
                  className="w-full h-[500px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl border border-border/50 shadow-lg z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Sarah just posted</p>
                    <p className="text-xs text-muted-foreground">"Finally got 4 hours of sleep! 🎉"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="px-6 py-24 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need, In One Place
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From quick chats to deep discussions, we've built the tools parents actually need at every hour of the day.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-all card-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Rooms Preview */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                Chat Rooms for Every Moment
              </h2>
              <p className="text-muted-foreground">
                From late-night feeds to morning coffee, find a room that fits your mood and schedule.
              </p>
              
              <div className="space-y-3">
                {[
                  { icon: "🦉", name: "Night Owl Parents", desc: "For those 2am moments" },
                  { icon: "☕", name: "Morning Coffee Chat", desc: "Start your day with friends" },
                  { icon: "💨", name: "Vent Room", desc: "Let it all out" },
                  { icon: "🎉", name: "Wins & Celebrations", desc: "Share your victories" }
                ].map((room, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                    <span className="text-2xl">{room.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{room.name}</p>
                      <p className="text-sm text-muted-foreground">{room.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden border border-border/30">
                <img 
                  src="https://images.unsplash.com/photo-1766393030567-2204662b0be2?w=600&h=450&fit=crop" 
                  alt="Cozy atmosphere"
                  className="w-full h-[450px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 bg-gradient-to-b from-card/50 to-background">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-5xl mb-6 block">🦉</span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Find Your Tribe?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of parents supporting each other through the ups and downs of parenthood.
          </p>
          <Link to="/register">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-12 h-14 text-lg shadow-[0_0_25px_rgba(245,197,66,0.4)] animate-pulse-glow"
              data-testid="cta-join-btn"
            >
              Join NightOwl Parents
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦉</span>
            <span className="font-heading font-bold text-foreground">NightOwl Parents</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Made with 💛 for parents everywhere
          </p>
        </div>
      </footer>
    </div>
  );
}
