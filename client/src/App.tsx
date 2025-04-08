import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CoinToss from "@/pages/CoinToss";
import OddEven from "@/pages/OddEven";
import AuthPage from "@/pages/auth-page";
import DepositPage from "@/pages/deposit";
import AdminPage from "@/pages/admin";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="*">
        {() => (
          <div className="flex flex-col h-screen overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto hide-scrollbar">
              <div className="container mx-auto p-4">
                <Switch>
                  <ProtectedRoute path="/" component={Home} />
                  <ProtectedRoute path="/coin-toss" component={CoinToss} />
                  <ProtectedRoute path="/odd-even" component={OddEven} />
                  <ProtectedRoute path="/deposit" component={DepositPage} />
                  <AdminProtectedRoute path="/admin" component={AdminPage} />
                  <Route component={NotFound} />
                </Switch>
              </div>
            </main>
            <BottomNav />
          </div>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
