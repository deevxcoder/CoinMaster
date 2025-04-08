import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

type GameCardProps = {
  title: string;
  description: string;
  path: string;
  badgeText: string;
  badgeColor: string;
  gradientFrom: string;
  gradientTo: string;
};

export default function GameCard({
  title,
  description,
  path,
  badgeText,
  badgeColor,
  gradientFrom,
  gradientTo
}: GameCardProps) {
  return (
    <Link href={path}>
      <Card className="rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-300 gradient-border h-64 relative group cursor-pointer">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-50`}></div>
        
        <div className="absolute inset-0">
          <motion.svg
            className="w-full h-full opacity-60 group-hover:opacity-40 transition-opacity"
            viewBox="0 0 800 600"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(108, 99, 255, 0.5)" />
                <stop offset="100%" stopColor="rgba(255, 107, 107, 0.5)" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 209, 102, 0.5)" />
                <stop offset="100%" stopColor="rgba(255, 107, 107, 0.5)" />
              </linearGradient>
            </defs>
            {path === "/coin-toss" ? (
              <>
                <circle cx="400" cy="300" r="150" fill="url(#grad1)" opacity="0.7" />
                <circle cx="300" cy="200" r="80" fill="url(#grad1)" opacity="0.5" />
                <circle cx="500" cy="400" r="100" fill="url(#grad1)" opacity="0.3" />
              </>
            ) : (
              <>
                <rect x="250" y="150" width="300" height="300" rx="20" fill="url(#grad2)" opacity="0.7" />
                <rect x="150" y="100" width="150" height="150" rx="10" fill="url(#grad2)" opacity="0.5" />
                <rect x="450" y="350" width="200" height="200" rx="15" fill="url(#grad2)" opacity="0.3" />
              </>
            )}
          </motion.svg>
        </div>

        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          <div>
            <span className={`px-3 py-1 ${badgeColor} rounded-full text-sm font-semibold`}>{badgeText}</span>
          </div>
          <div>
            <h3 className="font-accent font-bold text-2xl mb-2 group-hover:text-amber-400 transition-colors">{title}</h3>
            <p className="text-gray-300 mb-3">{description}</p>
            <motion.button 
              className="px-4 py-2 bg-amber-400 text-black rounded-full font-semibold"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Play Now
            </motion.button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
