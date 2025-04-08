import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Deposit, InsertDeposit } from '@shared/schema';

export function useDeposits() {
  // Get all deposits for the current user
  const { data: deposits = [], isLoading, error } = useQuery<Deposit[]>({
    queryKey: ['/api/deposits'],
  });

  // Create a new deposit
  const createDepositMutation = useMutation({
    mutationFn: async (depositData: Omit<InsertDeposit, 'userId'>) => {
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(depositData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create deposit');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the deposits query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/deposits'] });
    },
  });

  return {
    deposits,
    isLoading,
    error,
    createDepositMutation,
  };
}

// Hook to fetch a specific deposit by ID
export function useDeposit(id: number) {
  return useQuery<Deposit>({
    queryKey: ['/api/deposits', id],
    enabled: !!id, // Only run the query if id is provided
  });
}

// Hook for admin users to update deposit status
export function useUpdateDepositStatus() {
  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminNotes,
    }: {
      id: number;
      status: 'approved' | 'rejected' | 'pending';
      adminNotes?: string;
    }) => {
      const response = await fetch(`/api/deposits/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update deposit status');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list query and the specific deposit query
      queryClient.invalidateQueries({ queryKey: ['/api/deposits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deposits', variables.id] });
      // Also invalidate the user's balance
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
    },
  });
}