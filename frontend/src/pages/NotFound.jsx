import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <div className="text-6xl mb-6">🏡</div>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-3">
          Page not found
        </h1>
        <p className="text-muted-foreground mb-8">
          This corner of the village doesn't exist — or it may have moved. Let's get you back somewhere familiar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="rounded-xl h-11"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </Button>
          <Button
            asChild
            className="rounded-xl h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link to="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap gap-3 justify-center text-sm">
          <Link to="/forums" className="text-muted-foreground hover:text-foreground transition-colors">
            Spaces
          </Link>
          <span className="text-border">·</span>
          <Link to="/events" className="text-muted-foreground hover:text-foreground transition-colors">
            Events
          </Link>
          <span className="text-border">·</span>
          <Link to="/friends" className="text-muted-foreground hover:text-foreground transition-colors">
            Friends
          </Link>
          <span className="text-border">·</span>
          <Link to="/saved" className="text-muted-foreground hover:text-foreground transition-colors">
            Saved
          </Link>
        </div>
      </div>
    </div>
  );
}
