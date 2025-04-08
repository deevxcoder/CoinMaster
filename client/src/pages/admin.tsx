import { useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import AdminDepositPanel from "@/components/AdminDepositPanel";
import SeedDataButton from "@/components/SeedDataButton";
import { useAuth } from "@/hooks/use-auth";

export default function AdminPage() {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Check if the user has admin privileges
  const isAdmin = user?.isAdmin;
  
  useEffect(() => {
    // If user is not loading and either not logged in or not admin, redirect to home
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isLoading, navigate, isAdmin]);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !isAdmin) {
    return null; // Will redirect in the useEffect
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="deposits" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="deposits">Deposit Requests</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deposits">
          <AdminDepositPanel />
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">User management functionality will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
                <CardDescription>View key metrics and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Statistics dashboard will be implemented in a future update.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Demo Data</CardTitle>
                <CardDescription>Generate sample data for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <SeedDataButton />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}