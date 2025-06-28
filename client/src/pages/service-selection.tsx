import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { formatCurrency, getServiceIconClass, getServiceColorClass } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ChevronRight } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import type { Service } from "@shared/schema";

export default function ServiceSelectionPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // High-quality cinematic drone images for each service category
  const getDroneImageForService = (serviceName: string): string => {
    const droneImages = {
      "Videography": "url('https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80')",
      "Photoshoot": "url('https://images.unsplash.com/photo-1508614999368-9260051292e5?w=800&q=80')",
      "Agriculture": "url('https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80')",
      "Surveillance": "url('https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&q=80')",
      "Inspection": "url('https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&q=80')",
      "Custom Service": "url('https://images.unsplash.com/photo-1551808525-51a94da548ce?w=800&q=80')"
    };
    
    return droneImages[serviceName as keyof typeof droneImages] || droneImages["Custom Service"];
  };

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const handleServiceSelect = (serviceId: number) => {
    setLocation(`/booking/${serviceId}`);
  };

  const handleProfileClick = () => {
    setLocation("/my-bookings");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Choose Service</h1>
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
          <p className="text-blue-100">Select the drone service you need</p>
        </div>
        
        <div className="p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-b-3xl shadow-lg animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Choose Service</h1>
            <p className="text-blue-100 text-sm">Welcome back, {user?.fullName?.split(' ')[0]}</p>
          </div>
          <Button
            variant="ghost"
            onClick={handleProfileClick}
            className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-blue-100">Select the drone service you need</p>
      </div>
      
      {/* Service Cards */}
      <div className="p-6 space-y-4 animate-fade-in">
        {services?.map((service, index) => (
          <Card
            key={service.id}
            className="card-premium cursor-pointer hover:shadow-premium-hover transition-all duration-300"
            onClick={() => handleServiceSelect(service.id)}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <CardContent className="p-0">
              {/* High-Quality Drone Image */}
              <div className="h-48 relative overflow-hidden rounded-t-2xl">
                <div 
                  className="w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: getDroneImageForService(service.name)
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute top-4 right-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getServiceColorClass(service.color)} rounded-xl flex items-center justify-center shadow-lg`}>
                      <i className={`${getServiceIconClass(service.icon)} text-white text-xl`} />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{service.name}</h3>
                    <p className="text-sm text-gray-200">{service.description}</p>
                  </div>
                </div>
              </div>
              
              {/* Price and Action */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {service.name === "Custom Service" ? (
                        "Quote based"
                      ) : (
                        <>
                          {formatCurrency(parseFloat(service.pricePerHour))}
                          <span className="text-sm text-gray-500">/hour</span>
                        </>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">Professional service</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BottomNavigation currentPage="services" />
    </div>
  );
}
