import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export function useBalance() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/balance'],
    queryFn: async () => {
      const res = await fetch('/api/balance', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await res.json();
      return data.balance;
    }
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest('POST', '/api/balance', { amount });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/balance'], data.balance);
    }
  });

  const updateBalance = (newBalance: number) => {
    const currentBalance = queryClient.getQueryData(['/api/balance']) as number;
    const change = newBalance - currentBalance;
    
    if (change !== 0) {
      queryClient.setQueryData(['/api/balance'], newBalance);
    }
  };

  return {
    balance: data,
    isLoading,
    updateBalance,
    addBalance: (amount: number) => updateBalanceMutation.mutateAsync(amount)
  };
}
