import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { formatCurrency, formatDate, formatTime, getStatusColor, getServiceColorClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, MapPin, Plus, ChevronRight } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import type { Booking } from "@shared/schema";

interface EnrichedBooking extends Booking {
  service: {
    name: string;
    description: string;
    icon: string;
    color: string;
  } | null;
}

export default function MyBookingsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "completed">("all");

  const { data: bookings, isLoading } = useQuery<EnrichedBooking[]>({
    queryKey: [`/api/bookings/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const filteredBookings = bookings?.filter(booking => {
    if (activeFilter === "all") return true;
    if (activeFilter === "upcoming") {
      const bookingDate = new Date(booking.date + " " + booking.time);
      return bookingDate > new Date() && booking.status === "confirmed";
    }
    if (activeFilter === "completed") {
      return booking.status === "completed";
    }
    return true;
  }) || [];

  const handleNewBooking = () => {
    setLocation("/services");
  };

  const handleViewDetails = (bookingId: number) => {
    // TODO: Implement booking details view
    console.log("View booking details:", bookingId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <Skeleton className="h-10 w-16 rounded-xl" />
          </div>
        </div>
        
        <div className="bg-white px-6 py-4 shadow-sm">
          <div className="flex space-x-4">
            {["All", "Upcoming", "Completed"].map((tab) => (
              <Skeleton key={tab} className="h-10 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Bookings</h1>
            <p className="text-blue-100 text-sm">{filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}</p>
          </div>
          <Button
            onClick={handleNewBooking}
            className="bg-white bg-opacity-20 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-opacity-30 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex space-x-4">
          {[
            { key: "all", label: "All" },
            { key: "upcoming", label: "Upcoming" },
            { key: "completed", label: "Completed" },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? "default" : "ghost"}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`px-4 py-2 rounded-lg ${
                activeFilter === filter.key
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Bookings List */}
      <div className="p-6 space-y-4 animate-fade-in">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-6">Start by booking your first drone service</p>
            <Button
              onClick={handleNewBooking}
              className="btn-premium text-white px-6 py-3 rounded-xl font-semibold"
            >
              Book Now
            </Button>
          </div>
        ) : (
          filteredBookings.map((booking, index) => {
            const isUpcoming = new Date(booking.date + " " + booking.time) > new Date();
            const borderColor = isUpcoming ? "border-emerald-500" : "border-gray-300";
            
            return (
              <Card
                key={booking.id}
                className={`card-premium border-l-4 ${borderColor} cursor-pointer hover:shadow-premium-hover transition-all duration-300`}
                onClick={() => handleViewDetails(booking.id)}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${getServiceColorClass(booking.service?.color || "")} rounded-xl flex items-center justify-center`}>
                        <i className={`${booking.service?.icon || "fas fa-cogs"} text-white`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{booking.service?.name || "Unknown Service"}</h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {booking.location}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status || "confirmed")}`}>
                      {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || "Confirmed"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Date & Time</p>
                        <p className="font-semibold">{formatDate(booking.date)} - {formatTime(booking.time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-semibold">{booking.duration} hour{booking.duration > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(parseFloat(booking.totalCost))}</p>
                    <Button variant="ghost" className="text-blue-600 font-semibold hover:text-blue-700 p-0">
                      View Details <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <BottomNavigation currentPage="bookings" />
    </div>
  );
}
