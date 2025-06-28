import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertServiceSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@skybook.pro",
    to: email,
    subject: "SkyBook Pro - Email Verification",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #0ea5e9); color: white; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">SkyBook Pro</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Premium Drone Services</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1e3a8a; margin-bottom: 20px;">Verify Your Email</h2>
          <p style="color: #64748b; margin-bottom: 30px;">Your verification code is:</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 32px; font-weight: bold; color: #1e3a8a; letter-spacing: 4px;">${otp}</div>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #94a3b8; font-size: 12px;">© 2024 SkyBook Pro. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User registration
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Create user
      const user = await storage.createUser(userData);
      
      // Generate and send OTP
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.updateUser(user.id, { otp, otpExpires });
      
      const emailSent = await sendOTPEmail(user.email, otp);
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({ 
        message: "Registration successful. Please check your email for verification code.",
        userId: user.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Verify OTP
  app.post("/api/verify-otp", async (req, res) => {
    try {
      const { userId, otp } = req.body;
      
      if (!userId || !otp) {
        return res.status(400).json({ message: "User ID and OTP are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (user.otpExpires && new Date() > user.otpExpires) {
        return res.status(400).json({ message: "OTP has expired" });
      }

      // Verify user and clear OTP
      await storage.updateUser(userId, { 
        isVerified: 1, 
        otp: null, 
        otpExpires: null 
      });

      res.json({ 
        message: "Email verified successfully",
        user: { id: user.id, fullName: user.fullName, email: user.email }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Resend OTP
  app.post("/api/resend-otp", async (req, res) => {
    try {
      const { userId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      
      await storage.updateUser(userId, { otp, otpExpires });
      
      const emailSent = await sendOTPEmail(user.email, otp);
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Simple admin authentication (for demo purposes)
      if (email === "admin@skybook.pro" && password === "admin123") {
        const admin = {
          id: 999,
          name: "Admin",
          email: "admin@skybook.pro",
          role: "admin"
        };
        
        res.json({ 
          message: "Admin login successful",
          admin 
        });
      } else {
        res.status(401).json({ message: "Invalid admin credentials" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get service by ID
  app.get("/api/services/:id", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Verify user exists and is verified
      const user = await storage.getUser(bookingData.userId);
      if (!user || user.isVerified !== 1) {
        return res.status(400).json({ message: "User not found or not verified" });
      }

      // Verify service exists
      const service = await storage.getService(bookingData.serviceId);
      if (!service) {
        return res.status(400).json({ message: "Service not found" });
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user bookings
  app.get("/api/bookings/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const bookings = await storage.getUserBookings(userId);
      
      // Enrich bookings with service details
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const service = await storage.getService(booking.serviceId);
          return {
            ...booking,
            service: service ? {
              name: service.name,
              description: service.description,
              icon: service.icon,
              color: service.color
            } : null
          };
        })
      );

      res.json(enrichedBookings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Get all bookings
  app.get("/api/admin/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      
      // Enrich with user and service details
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const user = await storage.getUser(booking.userId);
          const service = await storage.getService(booking.serviceId);
          return {
            ...booking,
            user: user ? { fullName: user.fullName, email: user.email } : null,
            service: service ? { name: service.name } : null
          };
        })
      );

      res.json(enrichedBookings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Create service
  app.post("/api/admin/services", async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Update service
  app.put("/api/admin/services/:id", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const updates = req.body;
      
      const service = await storage.updateService(serviceId, updates);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Delete service
  app.delete("/api/admin/services/:id", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const success = await storage.deleteService(serviceId);
      
      if (!success) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Get stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const users = Array.from((storage as any).users.values());
      const bookings = await storage.getAllBookings();
      
      const totalUsers = users.length;
      const totalBookings = bookings.length;
      const revenue = bookings.reduce((sum, booking) => sum + parseFloat(booking.totalCost), 0);
      
      res.json({
        totalUsers,
        totalBookings,
        revenue: revenue.toFixed(2),
        growth: "+24%" // Static value for demo
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment Integration - Create payment intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, bookingId, paymentType, currency = "INR" } = req.body;
      
      // Simulate payment intent creation (In real app, use Razorpay)
      const clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;
      
      res.json({
        clientSecret,
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        paymentType,
        bookingId
      });
    } catch (error) {
      res.status(500).json({ message: "Payment initialization failed" });
    }
  });

  // Update booking status
  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const updates = req.body;
      
      const booking = await storage.updateBooking(bookingId, updates);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send booking notifications (SMS + Email)
  app.post("/api/send-booking-notification", async (req, res) => {
    try {
      const { bookingId, type, paymentType } = req.body;
      
      // Get booking details
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const user = await storage.getUser(booking.userId);
      const service = await storage.getService(booking.serviceId);
      
      if (!user || !service) {
        return res.status(404).json({ message: "User or service not found" });
      }

      // Email notification
      if (user.email) {
        const subject = type === "confirmation" ? "Booking Confirmed - SkyBook Pro" : "Booking Update - SkyBook Pro";
        const message = `
          Dear ${user.fullName},
          
          Your drone service booking has been ${type === "confirmation" ? "confirmed" : "updated"}.
          
          Service: ${service.name}
          Date & Time: ${booking.date} at ${booking.time}
          Duration: ${booking.duration} hour(s)
          Location: ${booking.location}
          Total Cost: ₹${booking.totalCost}
          Payment: ${paymentType === "full" ? "Full payment completed" : "30% advance paid"}
          
          Thank you for choosing SkyBook Pro!
          
          Best regards,
          SkyBook Pro Team
        `;
        
        await sendOTPEmail(user.email, "booking_confirmation");
      }

      // SMS notification (simulated)
      if (user.phone) {
        const smsMessage = `SkyBook Pro: Your ${service.name} booking for ${booking.date} at ${booking.time} is confirmed. Payment: ₹${paymentType === "full" ? booking.totalCost : (parseFloat(booking.totalCost) * 0.3).toFixed(2)} received.`;
        console.log(`SMS sent to ${user.phone}: ${smsMessage}`);
      }

      res.json({ message: "Notifications sent successfully" });
    } catch (error) {
      console.error("Notification error:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Simple admin check (in production, use proper authentication)
      if (email === "admin@skybook.pro" && password === "admin123") {
        res.json({
          admin: {
            id: 999,
            name: "Admin",
            email: "admin@skybook.pro",
            role: "admin"
          },
          message: "Admin login successful"
        });
      } else {
        res.status(401).json({ message: "Invalid admin credentials" });
      }
    } catch (error) {
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
