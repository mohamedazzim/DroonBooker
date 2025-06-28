import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Calendar, User } from "lucide-react";

interface BottomNavigationProps {
  currentPage: "services" | "bookings" | "profile";
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const navItems = [
    {
      key: "services",
      label: "Services",
      icon: Home,
      path: "/services",
    },
    {
      key: "bookings", 
      label: "Bookings",
      icon: Calendar,
      path: "/my-bookings",
    },
    {
      key: "profile",
      label: "Profile", 
      icon: User,
      path: "/my-bookings", // For now, profile goes to bookings
    },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.key;
          
          return (
            <Button
              key={item.key}
              variant="ghost"
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center space-y-1 px-6 py-2 transition-colors ${
                isActive 
                  ? "text-blue-600" 
                  : "text-gray-400 hover:text-blue-600"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-semibold">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
