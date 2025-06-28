import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";

export default function OTPVerificationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const pendingUserId = localStorage.getItem('pendingUserId');
    if (!pendingUserId) {
      setLocation("/");
      return;
    }
    setUserId(pendingUserId);
  }, [setLocation]);

  const verifyMutation = useMutation({
    mutationFn: async ({ userId, otp }: { userId: string; otp: string }) => {
      const response = await apiRequest("POST", "/api/verify-otp", {
        userId: parseInt(userId),
        otp,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Verified",
        description: "Welcome to SkyBook Pro!",
      });
      setUser({ ...data.user, isVerified: true });
      localStorage.removeItem('pendingUserId');
      setLocation("/services");
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", "/api/resend-otp", {
        userId: parseInt(userId),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "A new verification code has been sent to your email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Resend",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter all 6 digits.",
        variant: "destructive",
      });
      return;
    }

    if (userId) {
      verifyMutation.mutate({ userId, otp: otpString });
    }
  };

  const handleResend = () => {
    if (userId) {
      resendMutation.mutate(userId);
    }
  };

  const goBack = () => {
    localStorage.removeItem('pendingUserId');
    setLocation("/");
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="h-screen bg-white">
      <div className="p-8 h-full flex flex-col justify-center">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={goBack}
          className="absolute top-8 left-8 text-gray-600 hover:text-gray-800 p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Verify Your Email</h2>
          <p className="text-gray-600 mb-2">We've sent a verification code to your email</p>
        </div>
        
        {/* OTP Input */}
        <div className="space-y-6 animate-slide-up">
          <div className="flex space-x-3 justify-center">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                disabled={verifyMutation.isPending}
              />
            ))}
          </div>
          
          <Button
            onClick={handleVerify}
            className="w-full btn-premium text-white py-4 px-6 rounded-xl font-semibold text-lg"
            disabled={verifyMutation.isPending || otp.join('').length !== 6}
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-2">Didn't receive the code?</p>
            <Button
              variant="link"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="text-blue-600 font-semibold hover:text-blue-700"
            >
              {resendMutation.isPending ? "Sending..." : "Resend Code"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
