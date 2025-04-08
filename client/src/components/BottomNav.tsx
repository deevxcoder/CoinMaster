import { Link, useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-card border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-around">
          <Link href="/">
            <button className={`py-3 px-4 text-center focus:outline-none ${isActive('/') ? 'text-primary' : ''}`}>
              <i className="fas fa-home text-lg"></i>
              <p className="text-xs mt-1">Home</p>
            </button>
          </Link>
          <button className="py-3 px-4 text-center focus:outline-none">
            <i className="fas fa-trophy text-lg"></i>
            <p className="text-xs mt-1">Leaderboard</p>
          </button>
          <button className="py-3 px-4 text-center focus:outline-none">
            <i className="fas fa-history text-lg"></i>
            <p className="text-xs mt-1">History</p>
          </button>
          <button className="py-3 px-4 text-center focus:outline-none">
            <i className="fas fa-user text-lg"></i>
            <p className="text-xs mt-1">Profile</p>
          </button>
        </div>
      </div>
    </nav>
  );
}
