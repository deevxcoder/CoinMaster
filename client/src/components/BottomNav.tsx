import { Link, useLocation } from "wouter";
import { Home, Trophy, History, User, Wallet } from "lucide-react";

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
              <Home className="mx-auto h-5 w-5" />
              <p className="text-xs mt-1">Home</p>
            </button>
          </Link>
          
          <Link href="/deposit">
            <button className={`py-3 px-4 text-center focus:outline-none ${isActive('/deposit') ? 'text-primary' : ''}`}>
              <Wallet className="mx-auto h-5 w-5" />
              <p className="text-xs mt-1">Deposit</p>
            </button>
          </Link>
          
          <Link href="/">
            <button className={`py-3 px-4 text-center focus:outline-none ${isActive('/leaderboard') ? 'text-primary' : ''}`}>
              <Trophy className="mx-auto h-5 w-5" />
              <p className="text-xs mt-1">Leaderboard</p>
            </button>
          </Link>
          
          <Link href="/">
            <button className={`py-3 px-4 text-center focus:outline-none ${isActive('/history') ? 'text-primary' : ''}`}>
              <History className="mx-auto h-5 w-5" />
              <p className="text-xs mt-1">History</p>
            </button>
          </Link>
          
          <Link href="/">
            <button className={`py-3 px-4 text-center focus:outline-none ${isActive('/profile') ? 'text-primary' : ''}`}>
              <User className="mx-auto h-5 w-5" />
              <p className="text-xs mt-1">Profile</p>
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
