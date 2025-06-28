import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { formatCurrency, getServiceIconClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Calendar, Clock, CreditCard, Loader2, CheckCircle } from "lucide-react";
import type { Service } from "@shared/schema";

interface BookingDetails {
  userId: number;
  serviceId: number;
  location: string;
  date: string;
  time: string;
  duration: number;
  requirements?: string;
  totalCost: number;
  service: Service;
}

export default function BillPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [paymentType, setPaymentType] = useState<"advance" | "full">("advance");
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    const storedBooking = localStorage.getItem('pendingBooking');
    if (storedBooking) {
      const booking = JSON.parse(storedBooking);
      setBookingDetails(booking);
      setPaymentAmount(booking.totalCost * 0.3); // Default to 30% advance
    } else {
      setLocation('/services');
    }
  }, [setLocation]);

  useEffect(() => {
    if (bookingDetails) {
      if (paymentType === "advance") {
        setPaymentAmount(bookingDetails.totalCost * 0.3);
      } else {
        setPaymentAmount(bookingDetails.totalCost);
      }
    }
  }, [paymentType, bookingDetails]);

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      // First create the booking
      const bookingResponse = await apiRequest("POST", "/api/bookings", {
        userId: bookingDetails!.userId,
        serviceId: bookingDetails!.serviceId,
        location: bookingDetails!.location,
        date: bookingDetails!.date,
        time: bookingDetails!.time,
        duration: bookingDetails!.duration,
        requirements: bookingDetails!.requirements,
        totalCost: bookingDetails!.totalCost.toFixed(2),
        status: paymentType === "full" ? "confirmed" : "advance_paid"
      });
      
      const booking = await bookingResponse.json();
      
      // Create payment intent
      const paymentResponse = await apiRequest("POST", "/api/create-payment-intent", {
        amount: paymentAmount,
        bookingId: booking.id,
        paymentType,
        currency: "INR"
      });
      
      return { booking, payment: await paymentResponse.json() };
    },
    onSuccess: async (data) => {
      // Simulate Razorpay payment
      try {
        // In real implementation, this would integrate with Razorpay
        await simulateRazorpayPayment(data.payment.clientSecret);
        
        // Update booking status
        await apiRequest("PATCH", `/api/bookings/${data.booking.id}`, {
          status: paymentType === "full" ? "confirmed" : "advance_paid",
          paymentStatus: "paid"
        });

        // Send notifications
        await apiRequest("POST", "/api/send-booking-notification", {
          bookingId: data.booking.id,
          type: "confirmation",
          paymentType
        });

        toast({
          title: "Payment Successful!",
          description: `Your booking has been confirmed. Payment of ${formatCurrency(paymentAmount)} completed.`,
        });

        // Clear stored booking
        localStorage.removeItem('pendingBooking');
        queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
        setLocation("/my-bookings");
        
      } catch (error) {
        toast({
          title: "Payment Failed",
          description: "Please try again or contact support.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const simulateRazorpayPayment = async (clientSecret: string): Promise<void> => {
    // Simulate payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  };

  const handlePayment = () => {
    if (!bookingDetails) return;
    paymentMutation.mutate({ amount: paymentAmount, type: paymentType });
  };

  const goBack = () => {
    setLocation(`/booking/${bookingDetails?.serviceId}`);
  };

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">No booking details found</p>
          <Button onClick={() => setLocation("/services")}>Go to Services</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center space-x-4 animate-slide-up">
        <Button variant="ghost" onClick={goBack} className="text-white hover:text-blue-200 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Order Summary</h1>
          <p className="text-blue-100 text-sm">Review and pay for your booking</p>
        </div>
      </div>

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Service Details */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <i className={`${getServiceIconClass(bookingDetails.service.icon)} text-blue-600 mr-3 text-xl`}></i>
              {bookingDetails.service.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{bookingDetails.location}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date(bookingDetails.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{bookingDetails.time} ({bookingDetails.duration} hour{bookingDetails.duration > 1 ? 's' : ''})</span>
            </div>
            {bookingDetails.requirements && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Special Requirements:</strong> {bookingDetails.requirements}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Service Rate ({bookingDetails.duration} hour{bookingDetails.duration > 1 ? 's' : ''})</span>
              <span>{formatCurrency(bookingDetails.service.pricePerHour)} × {bookingDetails.duration}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(bookingDetails.totalCost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount</span>
              <span>{formatCurrency(bookingDetails.totalCost)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Options */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentType} onValueChange={(value: "advance" | "full") => setPaymentType(value)}>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-blue-50 transition-colors">
                  <RadioGroupItem value="advance" id="advance" />
                  <Label htmlFor="advance" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Pay 30% Advance</p>
                        <p className="text-sm text-gray-600">Pay now and rest on completion</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{formatCurrency(bookingDetails.totalCost * 0.3)}</p>
                        <p className="text-xs text-gray-500">Now</p>
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-blue-50 transition-colors">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Pay Full Amount</p>
                        <p className="text-sm text-gray-600">Complete payment now</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(bookingDetails.totalCost)}</p>
                        <p className="text-xs text-green-500">5% discount applied</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Amount to Pay:</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(paymentAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={paymentMutation.isPending}
          className="w-full btn-premium text-white py-4 px-6 rounded-xl font-semibold text-lg"
        >
          {paymentMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay with Razorpay
            </>
          )}
        </Button>

        <p className="text-center text-gray-500 text-sm">
          Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
}