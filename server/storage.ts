import { users, services, bookings, type User, type InsertUser, type Service, type InsertService, type Booking, type InsertBooking } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Service methods
  getAllServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, updates: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Booking methods
  getAllBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getUserBookings(userId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private bookings: Map<number, Booking>;
  private currentUserId: number;
  private currentServiceId: number;
  private currentBookingId: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.bookings = new Map();
    this.currentUserId = 1;
    this.currentServiceId = 1;
    this.currentBookingId = 1;

    // Initialize default services and demo user
    this.initializeServices();
    this.initializeDemoUser();
  }

  private initializeServices() {
    const defaultServices: InsertService[] = [
      {
        name: "Videography",
        description: "Professional aerial videos",
        pricePerHour: "150.00",
        icon: "fas fa-video",
        color: "from-red-500 to-pink-500",
        isActive: 1,
      },
      {
        name: "Photography",
        description: "High-resolution aerial photos",
        pricePerHour: "120.00",
        icon: "fas fa-camera",
        color: "from-blue-500 to-cyan-500",
        isActive: 1,
      },
      {
        name: "Agriculture",
        description: "Crop monitoring & analysis",
        pricePerHour: "200.00",
        icon: "fas fa-seedling",
        color: "from-green-500 to-emerald-500",
        isActive: 1,
      },
      {
        name: "Surveillance",
        description: "Security & monitoring",
        pricePerHour: "180.00",
        icon: "fas fa-eye",
        color: "from-purple-500 to-indigo-500",
        isActive: 1,
      },
      {
        name: "Inspection",
        description: "Infrastructure & building inspection",
        pricePerHour: "160.00",
        icon: "fas fa-search",
        color: "from-orange-500 to-red-500",
        isActive: 1,
      },
      {
        name: "Custom Service",
        description: "Specialized requirements",
        pricePerHour: "0.00",
        icon: "fas fa-cogs",
        color: "from-yellow-500 to-amber-500",
        isActive: 1,
      },
    ];

    defaultServices.forEach(service => this.createService(service));
  }

  private initializeDemoUser() {
    // Create demo user for testing
    const demoUser: User = {
      id: 1,
      fullName: "Demo User",
      email: "demo@skybook.pro",
      phone: "+1234567890",
      isVerified: 1,
      otp: null,
      otpExpires: null,
      createdAt: new Date()
    };
    
    this.users.set(1, demoUser);
    this.currentUserId = 2; // Start next user IDs from 2
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      isVerified: 0,
      otp: null,
      otpExpires: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Service methods
  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.isActive === 1);
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const service: Service = { 
      ...insertService, 
      id,
      isActive: insertService.isActive ?? 1
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: number, updates: Partial<Service>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updatedService = { ...service, ...updates };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Booking methods
  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const booking: Booking = { 
      ...insertBooking, 
      id,
      status: "confirmed",
      createdAt: new Date(),
      requirements: insertBooking.requirements ?? null,
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...updates };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
}

export const storage = new MemStorage();
