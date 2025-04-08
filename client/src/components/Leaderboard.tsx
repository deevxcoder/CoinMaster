import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardUser {
  id: number;
  username: string;
  balance: number;
}

export default function Leaderboard() {
  const { data: leaderboardData, isLoading, error } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch leaderboard");
      }
      return res.json();
    },
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="w-5 h-5 inline-flex items-center justify-center font-bold">{index + 1}</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> 
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-destructive">Failed to load leaderboard</p>
        ) : leaderboardData?.length === 0 ? (
          <p className="text-center text-muted-foreground">No data available</p>
        ) : (
          <div className="space-y-2">
            {leaderboardData?.map((user, index) => (
              <div 
                key={user.id} 
                className={`flex items-center justify-between p-2 rounded-lg ${
                  index < 3 ? "bg-muted/50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>
                  <span className="font-medium">{user.username}</span>
                </div>
                <div className="font-semibold">
                  {user.balance.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}