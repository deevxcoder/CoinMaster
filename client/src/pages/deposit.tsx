import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useBalance } from "@/hooks/use-balance";
import { useAuth } from "@/hooks/use-auth";
import { useDeposits } from "@/hooks/use-deposits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Deposit } from "@shared/schema";

// Define the form schema
const depositFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive").min(100, "Minimum deposit is 100"),
  method: z.enum(["upi", "bank_transfer", "cash"]),
  proofInfo: z.string().min(5, "Please provide transaction details").max(500, "Details too long"),
});

type DepositFormValues = z.infer<typeof depositFormSchema>;

export default function DepositPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance } = useBalance();
  const { deposits, isLoading: isLoadingDeposits, createDepositMutation } = useDeposits();
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("new");

  // Initialize form
  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: 100,
      method: "upi",
      proofInfo: "",
    },
  });

  // Handle form submission
  const onSubmit = (data: DepositFormValues) => {
    const depositData = {
      ...data,
      hasProofFile: fileUploaded
    };
    
    createDepositMutation.mutateAsync(depositData, {
      onSuccess: () => {
        toast({
          title: "Deposit Request Submitted",
          description: "Your deposit request has been sent for approval.",
        });
        
        // Reset form
        form.reset();
        setFileUploaded(false);
        setActiveTab("history");
      },
      onError: (error) => {
        toast({
          title: "Deposit Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real app, you would upload this file to a storage service
      // For now, just set a flag that a file was selected
      setFileUploaded(true);
      toast({
        title: "File Selected",
        description: "Your proof file has been selected.",
      });
    }
  };

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
  
  return (
    <div className="slide-up container mx-auto py-8 max-w-3xl">
      <Card className="bg-card gradient-border">
        <CardHeader>
          <CardTitle className="font-accent text-2xl flex items-center gap-2">
            Deposit Funds
          </CardTitle>
          <CardDescription>
            Add funds to your account. Deposits require admin approval.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold">{balance || 0}</p>
            </div>
            <div className="bg-muted-foreground/10 rounded-full p-3">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="new">New Deposit</TabsTrigger>
              <TabsTrigger value="history">Deposit History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter amount" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum deposit is 100 coins
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select how you made the payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proofInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter transaction details (UTR for UPI, Transaction ID for bank transfers, or other details)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide information to verify your payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel className="block mb-2">Upload Proof (Optional)</FormLabel>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('proof-upload')?.click()}
                        className="flex items-center gap-2"
                      >
                        {fileUploaded ? <CheckCircle className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                        {fileUploaded ? "File Selected" : "Select File"}
                      </Button>
                      <span className="text-sm text-gray-400">
                        {fileUploaded ? "Payment proof uploaded" : "Screenshot, receipt, or other proof"}
                      </span>
                    </div>
                    <input
                      id="proof-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createDepositMutation.isPending}
                  >
                    {createDepositMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Submit Deposit Request"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="history">
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Your Deposit History</h3>
                
                {isLoadingDeposits ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : deposits.length === 0 ? (
                  <div className="bg-muted rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">You haven't made any deposits yet.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab("new")}
                    >
                      Make Your First Deposit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deposits.map((deposit) => (
                      <Card key={deposit.id} className="overflow-hidden">
                        <div className="p-4 flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-bold">{deposit.amount} coins</p>
                                {getStatusBadge(deposit.status)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(deposit.createdAt), 'PPP p')}
                              </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 text-sm">
                              <div>
                                <p className="font-medium">Payment Method</p>
                                <p className="capitalize">{deposit.method}</p>
                              </div>
                              
                              <div className="flex-1">
                                <p className="font-medium">Transaction Details</p>
                                <p className="text-muted-foreground break-words">{deposit.proofInfo}</p>
                              </div>
                            </div>
                            
                            {deposit.adminNotes && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="font-medium text-sm">Admin Notes</p>
                                <p className="text-sm text-muted-foreground">{deposit.adminNotes}</p>
                              </div>
                            )}
                          </div>
                          
                          {deposit.hasProofFile && (
                            <div className="flex-shrink-0">
                              <p className="text-xs text-muted-foreground mb-1">Proof Document</p>
                              <div className="bg-muted rounded flex items-center justify-center w-16 h-16">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}