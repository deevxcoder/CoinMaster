import { useBalance } from "@/hooks/use-balance";
import { useAuth } from "@/hooks/use-auth";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Plus, CreditCard, ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { balance } = useBalance();
  const { user, logoutMutation } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if the user has admin privileges
  const isAdmin = user?.isAdmin === true;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      }
    });
  };

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
            <span className="font-semibold">{user?.balance?.toLocaleString() ?? 0}</span>
          </div>
          
          <Button 
            size="icon" 
            variant="default" 
            className="rounded-full"
            onClick={() => setLocation("/deposit")}
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user ? `Hi, ${user.username}` : 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem onClick={() => setLocation("/admin")}>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  <span>Admin Panel</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setLocation("/deposit")}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Deposit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
