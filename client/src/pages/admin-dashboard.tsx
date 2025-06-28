import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  CalendarCheck, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2,
  LogOut,
  Loader2
} from "lucide-react";
import type { z } from "zod";
import type { Service, Booking } from "@shared/schema";

type ServiceFormData = z.infer<typeof insertServiceSchema>;

interface AdminStats {
  totalUsers: number;
  totalBookings: number;
  revenue: string;
  growth: string;
}

interface EnrichedBooking extends Booking {
  user: { fullName: string; email: string } | null;
  service: { name: string } | null;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("services");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<EnrichedBooking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(insertServiceSchema),
    defaultValues: {
      isActive: 1,
    },
  });

  // Mutations
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const response = await apiRequest("POST", "/api/admin/services", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Service Created", description: "Service has been created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      reset();
      setIsServiceDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Service> }) => {
      const response = await apiRequest("PUT", `/api/admin/services/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Service Updated", description: "Service has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setEditingService(null);
      setIsServiceDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/services/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Service Deleted", description: "Service has been deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setValue("name", service.name);
    setValue("description", service.description);
    setValue("pricePerHour", service.pricePerHour);
    setValue("icon", service.icon);
    setValue("color", service.color);
    setValue("isActive", service.isActive || 1);
    setIsServiceDialogOpen(true);
  };

  const handleDeleteService = (id: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteServiceMutation.mutate(id);
    }
  };

  const handleNewService = () => {
    setEditingService(null);
    reset();
    setIsServiceDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SkyBook Pro Admin</h1>
            <p className="text-slate-300">Dashboard Overview</p>
          </div>
          <Button className="bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))
        ) : (
          <>
            <Card className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800">{stats?.totalUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CalendarCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-800">{stats?.totalBookings || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Revenue</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(parseFloat(stats?.revenue || "0"))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-premium">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Growth</p>
                    <p className="text-2xl font-bold text-gray-800">{stats?.growth || "+0%"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Admin Content */}
      <div className="px-6 pb-6">
        <Card className="card-premium overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200 px-6">
              <TabsList className="flex">
                <TabsTrigger value="services" className="px-6 py-4">Services</TabsTrigger>
                <TabsTrigger value="bookings" className="px-6 py-4">Bookings</TabsTrigger>
                <TabsTrigger value="users" className="px-6 py-4">Users</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Services Tab */}
            <TabsContent value="services" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Service Management</h2>
                <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewService} className="btn-premium text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingService ? "Edit Service" : "Add New Service"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Service Name</Label>
                        <Input {...register("name")} id="name" />
                        {errors.name && (
                          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea {...register("description")} id="description" />
                        {errors.description && (
                          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="pricePerHour">Price per Hour</Label>
                        <Input {...register("pricePerHour")} id="pricePerHour" type="number" step="0.01" />
                        {errors.pricePerHour && (
                          <p className="text-sm text-red-500 mt-1">{errors.pricePerHour.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="icon">Icon Class</Label>
                        <Input {...register("icon")} id="icon" placeholder="e.g., fas fa-video" />
                        {errors.icon && (
                          <p className="text-sm text-red-500 mt-1">{errors.icon.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="color">Color Class</Label>
                        <Input {...register("color")} id="color" placeholder="e.g., from-red-500 to-pink-500" />
                        {errors.color && (
                          <p className="text-sm text-red-500 mt-1">{errors.color.message}</p>
                        )}
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full btn-premium text-white"
                        disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                      >
                        {(createServiceMutation.isPending || updateServiceMutation.isPending) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingService ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          editingService ? "Update Service" : "Create Service"
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {servicesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Price/Hour</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services?.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 bg-gradient-to-r ${service.color} rounded-lg flex items-center justify-center`}>
                                <i className={`${service.icon} text-white`} />
                              </div>
                              <div>
                                <p className="font-medium">{service.name}</p>
                                <p className="text-sm text-gray-500">{service.description}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-blue-600">
                            {formatCurrency(parseFloat(service.pricePerHour))}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {service.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditService(service)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteService(service.id)}
                                className="text-red-600 hover:text-red-800"
                                disabled={deleteServiceMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            {/* Bookings Tab */}
            <TabsContent value="bookings" className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">All Bookings</h2>
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings?.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.user?.fullName || "Unknown"}</p>
                              <p className="text-sm text-gray-500">{booking.user?.email || "No email"}</p>
                            </div>
                          </TableCell>
                          <TableCell>{booking.service?.name || "Unknown Service"}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.date}</p>
                              <p className="text-sm text-gray-500">{booking.time}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{booking.location}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(parseFloat(booking.totalCost))}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status || "confirmed")}`}>
                              {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || "Confirmed"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            {/* Users Tab */}
            <TabsContent value="users" className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">User Management</h2>
              <div className="text-center text-gray-500 py-12">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>User management features would be implemented here</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
