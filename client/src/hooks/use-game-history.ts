import { useQuery } from "@tanstack/react-query";
import { Game, GameType } from "@shared/schema";

interface UseGameHistoryOptions {
  limit?: number;
  type?: GameType;
}

export function useGameHistory({ limit = 10, type }: UseGameHistoryOptions = {}) {
  return useQuery<Game[]>({
    queryKey: ['/api/games', { limit, type }],
    queryFn: async () => {
      let url = `/api/games?limit=${limit}`;
      if (type) {
        url += `&type=${type}`;
      }
      
      const res = await fetch(url, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch game history');
      }
      
      return res.json();
    }
  });
}
