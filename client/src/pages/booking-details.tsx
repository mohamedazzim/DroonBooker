import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { formatCurrency, calculateBookingTotal, getServiceIconClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Calendar, Clock, DollarSign, Edit, Loader2 } from "lucide-react";
import type { z } from "zod";
import type { Service } from "@shared/schema";

type FormData = z.infer<typeof insertBookingSchema>;

export default function BookingDetailsPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: [`/api/services/${serviceId}`],
    enabled: !!serviceId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(insertBookingSchema),
    defaultValues: {
      userId: user?.id || 0,
      serviceId: parseInt(serviceId || "0"),
      duration: 1,
    },
  });

  const watchedDuration = watch("duration");

  useEffect(() => {
    if (service && watchedDuration) {
      const total = calculateBookingTotal(service.pricePerHour, watchedDuration);
      setCalculatedTotal(total);
      setValue("totalCost", total.toFixed(2));
    }
  }, [service, watchedDuration, setValue]);

  const bookingMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed",
        description: "Your drone service has been booked successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/user"] });
      setLocation("/my-bookings");
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Store booking details for bill page
    const bookingDetails = {
      ...data,
      service,
      totalCost: calculatedTotal
    };
    localStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
    setLocation('/bill');
  };

  const goBack = () => {
    setLocation("/services");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center space-x-4">
          <Button variant="ghost" onClick={goBack} className="text-white hover:text-blue-200 p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Book Service</h1>
            <p className="text-blue-100 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">Service not found</p>
          <Button onClick={goBack}>Go Back</Button>
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
          <h1 className="text-xl font-bold">Book Service</h1>
          <p className="text-blue-100 text-sm">{service.name}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 animate-fade-in">
        {/* Location Section */}
        <Card className="card-premium">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <MapPin className="text-blue-600 mr-3 h-5 w-5" />
              Location
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="location">Service Location</Label>
                <Input
                  {...register("location")}
                  id="location"
                  placeholder="Enter address or location details"
                  className="input-premium"
                  disabled={bookingMutation.isPending}
                />
                {errors.location && (
                  <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>
                )}
              </div>
              
              {/* Map placeholder */}
              <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p>Interactive Map Integration</p>
                  <p className="text-sm">Location services would be integrated here</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Date & Time Section */}
        <Card className="card-premium">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Calendar className="text-blue-600 mr-3 h-5 w-5" />
              Date & Time
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  {...register("date")}
                  id="date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="input-premium"
                  disabled={bookingMutation.isPending}
                />
                {errors.date && (
                  <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  {...register("time")}
                  id="time"
                  type="time"
                  className="input-premium"
                  disabled={bookingMutation.isPending}
                  onChange={(e) => {
                    const selectedDate = getValues("date");
                    const selectedTime = e.target.value;
                    
                    if (selectedDate && selectedTime) {
                      const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
                      const now = new Date();
                      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                      
                      if (selectedDateTime <= twentyFourHoursFromNow) {
                        toast({
                          title: "Invalid Time",
                          description: "Please select a time at least 24 hours from now.",
                          variant: "destructive",
                        });
                        e.target.value = "";
                        setValue("time", "");
                        return;
                      }
                    }
                    setValue("time", selectedTime);
                  }}
                />
                {errors.time && (
                  <p className="text-sm text-red-500 mt-1">{errors.time.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Please select a time at least 24 hours from now
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Duration & Pricing Section */}
        <Card className="card-premium">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Clock className="text-blue-600 mr-3 h-5 w-5" />
              Duration & Pricing
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Select
                  onValueChange={(value) => setValue("duration", parseInt(value))}
                  defaultValue="1"
                  disabled={bookingMutation.isPending}
                >
                  <SelectTrigger className="input-premium">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Hour</SelectItem>
                    <SelectItem value="2">2 Hours</SelectItem>
                    <SelectItem value="3">3 Hours</SelectItem>
                    <SelectItem value="4">4 Hours</SelectItem>
                    <SelectItem value="6">6 Hours</SelectItem>
                    <SelectItem value="8">8 Hours</SelectItem>
                  </SelectContent>
                </Select>
                {errors.duration && (
                  <p className="text-sm text-red-500 mt-1">{errors.duration.message}</p>
                )}
              </div>
              
              {/* Pricing Breakdown */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rate per hour:</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(service.pricePerHour))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{watchedDuration || 1} hour{(watchedDuration || 1) > 1 ? 's' : ''}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-bold text-blue-600">
                  <span>Total:</span>
                  <span>{formatCurrency(calculatedTotal)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Special Requirements */}
        <Card className="card-premium">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Edit className="text-blue-600 mr-3 h-5 w-5" />
              Special Requirements
            </h3>
            <Textarea
              {...register("requirements")}
              placeholder="Describe any special requirements or notes..."
              className="input-premium h-24 resize-none"
              disabled={bookingMutation.isPending}
            />
          </CardContent>
        </Card>
        
        {/* Confirm Booking Button */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          disabled={bookingMutation.isPending}
        >
          {bookingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming Booking...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </form>
    </div>
  );
}
