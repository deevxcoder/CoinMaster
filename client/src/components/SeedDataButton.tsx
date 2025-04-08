import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SeedDataButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const seedDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/seed-data");
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Data seeded successfully",
        description: `Created ${data.games} games and ${data.deposits} deposits for ${data.users} users`,
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to seed data",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Only show for admin users
  if (!user?.isAdmin) {
    return null;
  }
  
  return (
    <Button
      variant="outline"
      className="bg-gradient-to-r from-red-500 to-orange-500 text-white hover:text-white"
      onClick={() => seedDataMutation.mutate()}
      disabled={seedDataMutation.isPending}
    >
      {seedDataMutation.isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Seeding Data...
        </>
      ) : (
        "Generate Test Data"
      )}
    </Button>
  );
}