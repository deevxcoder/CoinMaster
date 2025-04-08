import { useBalance } from "@/hooks/use-balance";

export default function Header() {
  const { balance } = useBalance();

  return (
    <header className="bg-card shadow-lg relative z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="font-accent font-bold text-lg">CG</span>
          </div>
          <h1 className="font-accent font-bold text-xl">Casino Games</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 rounded-full bg-muted flex items-center space-x-2">
            <i className="fas fa-coins text-amber-400"></i>
            <span className="font-semibold">{balance?.toLocaleString() ?? 0}</span>
          </div>
          <button className="p-2 rounded-full bg-primary hover:bg-opacity-80 transition-all">
            <i className="fas fa-plus"></i>
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
            <svg 
              className="w-full h-full text-gray-300"
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                fill="currentColor"
              />
              <path
                d="M12 12C8.13401 12 5 15.134 5 19V21H19V19C19 15.134 15.866 12 12 12Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
