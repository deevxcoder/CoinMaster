import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export function useBalance() {
  const { user } = useAuth();

  // For backward compatibility - still query the balance endpoint
  // but primarily use the user data from auth context
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
    },
    enabled: !!user // Only fetch if user is logged in
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest('POST', '/api/balance', { amount });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/balance'], data.balance);
      // Also update the user data in the auth context
      if (user) {
        const updatedUser = { ...user, balance: data.balance };
        queryClient.setQueryData(['/api/user'], updatedUser);
      }
    }
  });

  const updateBalance = (newBalance: number) => {
    if (!user) return;
    
    const currentBalance = user.balance;
    const change = newBalance - currentBalance;
    
    if (change !== 0) {
      // Update both balance and user data
      queryClient.setQueryData(['/api/balance'], newBalance);
      const updatedUser = { ...user, balance: newBalance };
      queryClient.setQueryData(['/api/user'], updatedUser);
    }
  };

  return {
    // Prefer user.balance from auth context, fallback to data from /api/balance
    balance: user?.balance ?? data ?? 0,
    isLoading,
    updateBalance,
    addBalance: (amount: number) => updateBalanceMutation.mutateAsync(amount)
  };
}
