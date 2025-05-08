import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTripSchema,
  insertPinSchema,
  type InsertTrip,
  type InsertPin,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix for all routes
  const apiPrefix = "/api";

  // Helper to create full API path
  const apiPath = (path: string) => `${apiPrefix}${path}`;

  // CURRENT USER ENDPOINT
  app.get(apiPath("/auth/me"), async (req: Request, res: Response) => {
    try {
      const user = await storage.getDefaultUser();
      return res.json(user);
    } catch (error) {
      console.error("Error getting current user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // TRIP ENDPOINTS
  // Get all trips
  app.get(apiPath("/trips"), async (req: Request, res: Response) => {
    try {
      const trips = await storage.getTrips();
      return res.json(trips);
    } catch (error) {
      console.error("Error getting trips:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get a specific trip by ID
  app.get(apiPath("/trips/:id"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }

      const trip = await storage.getTripById(id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // Increment view count
      await storage.incrementTripViews(id);

      return res.json(trip);
    } catch (error) {
      console.error("Error getting trip:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new trip
  app.post(apiPath("/trips"), async (req: Request, res: Response) => {
    try {
      // Validate request body
      const parsedBody = insertTripSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
          message: "Invalid trip data", 
          errors: parsedBody.error.format() 
        });
      }

      // Get default user
      const user = await storage.getDefaultUser();
      
      // Create trip with the default user ID
      const tripData: InsertTrip = {
        ...parsedBody.data,
        userId: user.id,
      };

      const trip = await storage.createTrip(tripData);
      return res.status(201).json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update a trip
  app.patch(apiPath("/trips/:id"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }

      const trip = await storage.getTripById(id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const updatedTrip = await storage.updateTrip(id, req.body);
      return res.json(updatedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete a trip
  app.delete(apiPath("/trips/:id"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }

      const trip = await storage.getTripById(id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      await storage.deleteTrip(id);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting trip:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get trips for the current user
  app.get(apiPath("/my-trips"), async (req: Request, res: Response) => {
    try {
      const user = await storage.getDefaultUser();
      const trips = await storage.getTripsByUserId(user.id);
      return res.json(trips);
    } catch (error) {
      console.error("Error getting user trips:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get trending trips
  app.get(apiPath("/trending"), async (req: Request, res: Response) => {
    try {
      const limitParam = req.query.limit;
      const limit = limitParam ? parseInt(limitParam as string) : 6;
      
      const trips = await storage.getTrendingTrips(limit);
      return res.json(trips);
    } catch (error) {
      console.error("Error getting trending trips:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get recent trips
  app.get(apiPath("/recent"), async (req: Request, res: Response) => {
    try {
      const limitParam = req.query.limit;
      const limit = limitParam ? parseInt(limitParam as string) : 8;
      
      const trips = await storage.getRecentTrips(limit);
      return res.json(trips);
    } catch (error) {
      console.error("Error getting recent trips:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Like a trip
  app.post(apiPath("/trips/:id/like"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }

      const trip = await storage.getTripById(id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      await storage.likeTrip(id);
      const updatedTrip = await storage.getTripById(id);
      return res.json(updatedTrip);
    } catch (error) {
      console.error("Error liking trip:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // PIN ENDPOINTS
  // Get pins for a trip
  app.get(apiPath("/trips/:tripId/pins"), async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      if (isNaN(tripId)) {
        return res.status(400).json({ message: "Invalid trip ID" });
      }

      const trip = await storage.getTripById(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const pins = await storage.getPinsByTripId(tripId);
      return res.json(pins);
    } catch (error) {
      console.error("Error getting pins:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new pin
  app.post(apiPath("/pins"), async (req: Request, res: Response) => {
    try {
      // Validate request body
      const parsedBody = insertPinSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
          message: "Invalid pin data", 
          errors: parsedBody.error.format() 
        });
      }

      const pin = await storage.createPin(parsedBody.data);
      return res.status(201).json(pin);
    } catch (error) {
      console.error("Error creating pin:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update a pin
  app.patch(apiPath("/pins/:id"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid pin ID" });
      }

      const pin = await storage.updatePin(id, req.body);
      if (!pin) {
        return res.status(404).json({ message: "Pin not found" });
      }

      return res.json(pin);
    } catch (error) {
      console.error("Error updating pin:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete a pin
  app.delete(apiPath("/pins/:id"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid pin ID" });
      }

      const deleted = await storage.deletePin(id);
      if (!deleted) {
        return res.status(404).json({ message: "Pin not found" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting pin:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
