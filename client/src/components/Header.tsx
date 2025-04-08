import { useState } from "react";
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { balance } = useBalance();
  const { user, logoutMutation } = useAuth();
  const [_, setLocation] = useLocation();
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [paymentDetails, setPaymentDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleDeposit = async () => {
    if (!depositAmount || depositAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    if (!paymentDetails.trim()) {
      toast({
        title: "Missing payment details",
        description: "Please enter your payment details",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          amount: depositAmount,
          paymentDetails,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Deposit failed");
      }

      const result = await response.json();
      
      toast({
        title: "Deposit request submitted",
        description: "Your deposit is being processed and will be reviewed by an admin.",
      });

      // Close the dialog and reset form
      setIsDepositDialogOpen(false);
      setDepositAmount(100);
      setPaymentDetails("");
    } catch (error) {
      toast({
        title: "Deposit failed",
        description: error instanceof Error ? error.message : "Failed to process deposit",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          
          <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="default" className="rounded-full">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deposit Funds</DialogTitle>
                <DialogDescription>
                  Enter the amount you want to deposit and provide payment details for verification.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseInt(e.target.value))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payment-details" className="text-right">
                    Payment Details
                  </Label>
                  <Input
                    id="payment-details"
                    placeholder="UTR/Transaction ID/Screenshot link"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleDeposit} disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Deposit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
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
