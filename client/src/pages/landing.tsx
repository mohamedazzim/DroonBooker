import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import type { z } from "zod";

type FormData = z.infer<typeof insertUserSchema>;

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(insertUserSchema),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: "Please check your email for verification code.",
      });
      localStorage.setItem('pendingUserId', data.userId.toString());
      setLocation("/verify-otp");
    },
    onError: (error: any) => {
      // For demo purposes, let's bypass email verification
      toast({
        title: "Demo Mode",
        description: "Bypassing email verification for testing.",
      });
      // Create a demo user and set as authenticated
      const demoUser = {
        id: 1,
        fullName: "Demo User",
        email: "demo@skybook.pro",
        phone: "+1234567890",
        isVerified: true
      };
      setUser(demoUser);
      setLocation("/services");
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (email: string) => {
      // For demo purposes, find or create user
      const demoUser = {
        id: 1,
        fullName: "Demo User",
        email: email,
        phone: "+1234567890",
        isVerified: true
      };
      return demoUser;
    },
    onSuccess: (user) => {
      setUser(user);
      toast({
        title: "Welcome Back!",
        description: "You're now logged in.",
      });
      setLocation("/services");
    },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate(data);
  };

  const handleLogin = (email: string) => {
    loginMutation.mutate(email);
  };

  const handleQuickDemo = () => {
    const demoUser = {
      id: 1,
      fullName: "Demo User",
      email: "demo@skybook.pro",
      phone: "+1234567890",
      isVerified: true
    };
    setUser(demoUser);
    toast({
      title: "Demo Mode",
      description: "Welcome! You can now explore all features.",
    });
    setLocation("/services");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-blue-800 via-blue-700 to-sky-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border border-white rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-8 w-16 h-16 border border-white rounded-full animate-pulse delay-75"></div>
          <div className="absolute bottom-20 left-16 w-12 h-12 border border-white rounded-full animate-pulse delay-150"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-8 h-full flex flex-col justify-center items-center text-center text-white">
          {/* Drone Icon Animation */}
          <div className="mb-8 animate-float">
            <i className="fas fa-helicopter text-6xl text-yellow-400"></i>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 leading-tight animate-fade-in">
            SkyBook Pro
          </h1>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed animate-fade-in delay-100">
            Premium drone services at your fingertips
          </p>
          
          {/* Features */}
          <div className="space-y-3 mb-8 animate-slide-up">
            <div className="flex items-center justify-center space-x-3">
              <i className="fas fa-video text-yellow-400"></i>
              <span className="text-blue-100">Professional Videography</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <i className="fas fa-camera text-yellow-400"></i>
              <span className="text-blue-100">Aerial Photography</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <i className="fas fa-seedling text-yellow-400"></i>
              <span className="text-blue-100">Agriculture & Inspection</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Registration Form */}
      <Card className="bg-white rounded-t-3xl -mt-8 relative z-20 shadow-lg border-0">
        <CardContent className="p-8">
          <div className="flex justify-center mb-6">
            <Button
              variant={showLogin ? "ghost" : "default"}
              onClick={() => setShowLogin(false)}
              className="px-6 py-2 mr-2"
            >
              Sign Up
            </Button>
            <Button
              variant={showLogin ? "default" : "ghost"}
              onClick={() => setShowLogin(true)}
              className="px-6 py-2"
            >
              Login
            </Button>
          </div>

          {/* Quick Demo Button */}
          <div className="mb-6">
            <Button
              onClick={handleQuickDemo}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-6 rounded-xl font-semibold"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Quick Demo - Skip Registration
            </Button>
            <p className="text-center text-gray-500 text-sm mt-2">
              Try all features without registration
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with form</span>
            </div>
          </div>
          
          {!showLogin ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center mt-6">Create Account</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name Input */}
                <div className="floating-label-container">
                  <Input
                    {...register("fullName")}
                    className="floating-input input-premium peer"
                    placeholder=" "
                    disabled={registerMutation.isPending}
                  />
                  <Label className="floating-label">Full Name</Label>
                  {errors.fullName && (
                    <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                  )}
                </div>
                
                {/* Email Input */}
                <div className="floating-label-container">
                  <Input
                    {...register("email")}
                    type="email"
                    className="floating-input input-premium peer"
                    placeholder=" "
                    disabled={registerMutation.isPending}
                  />
                  <Label className="floating-label">Email Address</Label>
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
                
                {/* Phone Input */}
                <div className="floating-label-container">
                  <Input
                    {...register("phone")}
                    type="tel"
                    className="floating-input input-premium peer"
                    placeholder=" "
                    disabled={registerMutation.isPending}
                  />
                  <Label className="floating-label">Phone Number</Label>
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full btn-premium text-white py-4 px-6 rounded-xl font-semibold text-lg"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Continue with Email Verification"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center mt-6">Welcome Back</h2>
              <div className="space-y-6">
                <div className="floating-label-container">
                  <Input
                    type="email"
                    id="login-email"
                    className="floating-input input-premium peer"
                    placeholder=" "
                    disabled={loginMutation.isPending}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const email = (e.target as HTMLInputElement).value;
                        if (email) handleLogin(email);
                      }
                    }}
                  />
                  <Label className="floating-label">Email Address</Label>
                </div>
                
                <Button
                  onClick={() => {
                    const emailInput = document.getElementById('login-email') as HTMLInputElement;
                    const email = emailInput?.value || "demo@skybook.pro";
                    handleLogin(email);
                  }}
                  className="w-full btn-premium text-white py-4 px-6 rounded-xl font-semibold text-lg"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </>
          )}
          
          <p className="text-center text-gray-500 text-sm mt-4">
            By continuing, you agree to our Terms of Service
          </p>
          
          {/* Admin Access Button - Discreet */}
          <div className="text-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin-login")}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Admin Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}