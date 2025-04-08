import { useState } from "react";
import { useDeposits, useUpdateDepositStatus } from "@/hooks/use-deposits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Clock, Upload, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Deposit } from "@shared/schema";

export default function AdminDepositPanel() {
  const { toast } = useToast();
  const { deposits, isLoading } = useDeposits();
  const updateStatusMutation = useUpdateDepositStatus();
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  
  // Filter for pending deposits first
  const pendingDeposits = deposits.filter(deposit => deposit.status === 'pending');
  const otherDeposits = deposits.filter(deposit => deposit.status !== 'pending');
  
  // Sorted deposits: pending first, then others by most recent
  const sortedDeposits = [...pendingDeposits, ...otherDeposits];

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
    }
  };

  const handleAdminNotesChange = (id: number, value: string) => {
    setAdminNotes(prev => ({ ...prev, [id]: value }));
  };

  const handleUpdateStatus = (id: number, status: 'approved' | 'rejected') => {
    updateStatusMutation.mutate({
      id,
      status,
      adminNotes: adminNotes[id]
    }, {
      onSuccess: () => {
        toast({
          title: `Deposit ${status === 'approved' ? 'Approved' : 'Rejected'}`,
          description: `The deposit request has been ${status}.`,
        });
        
        // Clear admin notes for this deposit
        setAdminNotes(prev => {
          const newNotes = { ...prev };
          delete newNotes[id];
          return newNotes;
        });
      },
      onError: (error) => {
        toast({
          title: "Action Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (deposits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deposit Requests</CardTitle>
          <CardDescription>No deposit requests found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">There are no deposit requests to process at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deposit Requests</CardTitle>
          <CardDescription>Manage user deposit requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedDeposits.map((deposit) => (
              <Card key={deposit.id} className={`overflow-hidden ${deposit.status === 'pending' ? 'border-yellow-500/50' : ''}`}>
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold">{deposit.amount} coins</p>
                      {getStatusBadge(deposit.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(deposit.createdAt), 'PPP p')}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="font-medium text-sm">User ID</p>
                      <p className="text-sm">{deposit.userId}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-sm">Payment Method</p>
                      <p className="text-sm capitalize">{deposit.method}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-sm">Has Proof File</p>
                      <p className="text-sm">{deposit.hasProofFile ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="font-medium text-sm">Transaction Details</p>
                    <p className="text-sm text-muted-foreground break-words">{deposit.proofInfo}</p>
                  </div>
                  
                  {deposit.adminNotes && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="font-medium text-sm">Admin Notes</p>
                      <p className="text-sm text-muted-foreground">{deposit.adminNotes}</p>
                    </div>
                  )}
                  
                  {deposit.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Textarea 
                        placeholder="Add admin notes (optional)" 
                        className="mb-4" 
                        value={adminNotes[deposit.id] || ''}
                        onChange={(e) => handleAdminNotesChange(deposit.id, e.target.value)}
                      />
                      
                      <div className="flex gap-2 justify-end">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUpdateStatus(deposit.id, 'rejected')}
                          disabled={updateStatusMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateStatus(deposit.id, 'approved')}
                          disabled={updateStatusMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" /> Approve
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}