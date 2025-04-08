import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CoinToss from "@/pages/CoinToss";
import OddEven from "@/pages/OddEven";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

function Router() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="container mx-auto p-4">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/coin-toss" component={CoinToss} />
            <Route path="/odd-even" component={OddEven} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
