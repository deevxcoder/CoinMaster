import { useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import AdminDepositPanel from "@/components/AdminDepositPanel";
import SeedDataButton from "@/components/SeedDataButton";
import UsersList from "@/components/UsersList";
import RiskManagementPanel from "@/components/RiskManagementPanel";
import GameManagementPanel from "@/components/GameManagementPanel";
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
        <TabsList className="mb-6 flex flex-wrap gap-2">
          <TabsTrigger value="deposits">Deposit Requests</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="risk">Risk Management</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="games">Game Management</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
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
              <UsersList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="risk">
          <RiskManagementPanel />
        </TabsContent>
        
        <TabsContent value="fraud">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection</CardTitle>
              <CardDescription>Monitor and manage suspicious activities</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Fraud detection panel is currently under development.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View platform metrics and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Analytics panel is currently under development.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="games">
          <GameManagementPanel />
        </TabsContent>
        
        <TabsContent value="tools">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Demo Data</CardTitle>
                <CardDescription>Generate sample data for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <SeedDataButton />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Database Sync</CardTitle>
                <CardDescription>Apply schema changes to database</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Note: Database migrations are handled automatically when you restart the server.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}