import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./lib/auth";
import LandingPage from "./pages/landing";
import OTPVerificationPage from "./pages/otp-verification";
import ServiceSelectionPage from "./pages/service-selection";
import BookingDetailsPage from "./pages/booking-details";
import BillPage from "./pages/bill";
import MyBookingsPage from "./pages/my-bookings";
import AdminDashboardPage from "./pages/admin-dashboard";
import AdminLoginPage from "./pages/admin-login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/verify-otp" component={OTPVerificationPage} />
      <Route path="/admin-login" component={AdminLoginPage} />
      
      {/* Protected routes */}
      {isAuthenticated ? (
        <>
          <Route path="/services" component={ServiceSelectionPage} />
          <Route path="/booking/:serviceId" component={BookingDetailsPage} />
          <Route path="/bill" component={BillPage} />
          <Route path="/my-bookings" component={MyBookingsPage} />
          <Route path="/admin" component={AdminDashboardPage} />
        </>
      ) : (
        <Route path="/services" component={LandingPage} />
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen relative overflow-hidden">
            <Toaster />
            <Router />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
