import { 
  users, type User, type InsertUser,
  trips, type Trip, type InsertTrip,
  pins, type Pin, type InsertPin
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDefaultUser(): Promise<User>;

  // Trip operations
  getTrips(): Promise<Trip[]>;
  getTripById(id: number): Promise<Trip | undefined>;
  getTripsByUserId(userId: number): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<Trip>): Promise<Trip | undefined>;
  deleteTrip(id: number): Promise<boolean>;
  getTrendingTrips(limit?: number): Promise<Trip[]>;
  getRecentTrips(limit?: number): Promise<Trip[]>;
  incrementTripViews(id: number): Promise<void>;
  likeTrip(id: number): Promise<void>;
  searchTrips(query: string, sortBy?: 'likes' | 'views' | 'date'): Promise<Trip[]>;

  // Pin operations
  getPinsByTripId(tripId: number): Promise<Pin[]>;
  createPin(pin: InsertPin): Promise<Pin>;
  updatePin(id: number, pin: Partial<Pin>): Promise<Pin | undefined>;
  deletePin(id: number): Promise<boolean>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private defaultUser: User | null = null;
  
  // Ensure default user exists
  private async ensureDefaultUser(): Promise<User> {
    if (this.defaultUser) return this.defaultUser;
    
    // Try to find default user
    const [existingUser] = await db.select().from(users).where(eq(users.username, "alexmorgan"));
    
    if (existingUser) {
      this.defaultUser = existingUser;
      return existingUser;
    }
    
    // Create default user if not exists
    const defaultUserData: InsertUser = {
      username: "alexmorgan",
      name: "Alex Morgan",
      bio: "Travel enthusiast and photographer. Exploring the world one trip at a time.",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100",
    };
    
    // Insert default user
    const [newUser] = await db.insert(users).values(defaultUserData).returning();
    this.defaultUser = newUser;
    
    return newUser;
  }
  
  // USER OPERATIONS
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getDefaultUser(): Promise<User> {
    return this.ensureDefaultUser();
  }
  
  // TRIP OPERATIONS
  async getTrips(): Promise<Trip[]> {
    return db.select().from(trips);
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getTripsByUserId(userId: number): Promise<Trip[]> {
    return db.select().from(trips).where(eq(trips.userId, userId));
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const [trip] = await db.insert(trips).values(insertTrip).returning();
    return trip;
  }

  async updateTrip(id: number, tripUpdate: Partial<Trip>): Promise<Trip | undefined> {
    const [updatedTrip] = await db
      .update(trips)
      .set(tripUpdate)
      .where(eq(trips.id, id))
      .returning();
    
    return updatedTrip;
  }

  async deleteTrip(id: number): Promise<boolean> {
    // Delete all associated pins first
    await db.delete(pins).where(eq(pins.tripId, id));
    
    // Delete the trip
    const result = await db.delete(trips).where(eq(trips.id, id)).returning();
    return result.length > 0;
  }

  async getTrendingTrips(limit: number = 6): Promise<Trip[]> {
    return db.select().from(trips).orderBy(trips.viewCount).limit(limit);
  }

  async getRecentTrips(limit: number = 8): Promise<Trip[]> {
    return db.select().from(trips).orderBy(trips.createdAt).limit(limit);
  }

  async incrementTripViews(id: number): Promise<void> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    
    if (trip) {
      await db
        .update(trips)
        .set({ viewCount: trip.viewCount + 1 })
        .where(eq(trips.id, id));
    }
  }

  async likeTrip(id: number): Promise<void> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    
    if (trip) {
      await db
        .update(trips)
        .set({ likeCount: trip.likeCount + 1 })
        .where(eq(trips.id, id));
    }
  }
  
  async searchTrips(query: string, sortBy: 'likes' | 'views' | 'date' = 'date'): Promise<Trip[]> {
    // Get all trips - we'll filter and sort in-memory for now
    // In a real production app, this would be done with proper SQL queries
    const allTrips = await this.getTrips();
    
    // If no query, return all trips sorted by the requested criteria
    if (!query) {
      return this.sortTrips(allTrips, sortBy);
    }
    
    // Normalize query for case-insensitive search
    const normalizedQuery = query.toLowerCase();
    const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);
    
    // Score and rank the trips for relevance
    const scoredTrips = allTrips.map(trip => {
      let score = 0;
      
      // Check title match (higher weight)
      if (trip.title.toLowerCase().includes(normalizedQuery)) {
        score += 10;
      }
      
      // Check for exact title matches of each term (higher relevance)
      for (const term of queryTerms) {
        if (trip.title.toLowerCase().includes(term)) {
          score += 5;
        }
      }
      
      // Check summary match
      if (trip.summary.toLowerCase().includes(normalizedQuery)) {
        score += 5;
      }
      
      // Check each query term in the summary
      for (const term of queryTerms) {
        if (trip.summary.toLowerCase().includes(term)) {
          score += 2;
        }
      }
      
      // Check categories (tags) match (highest relevance)
      if (trip.categories) {
        // Exact category match
        if (trip.categories.some(cat => cat.toLowerCase() === normalizedQuery)) {
          score += 15;
        }
        
        // Partial category match
        if (trip.categories.some(cat => cat.toLowerCase().includes(normalizedQuery))) {
          score += 10;
        }
        
        // Check each term against categories
        for (const term of queryTerms) {
          if (trip.categories.some(cat => cat.toLowerCase().includes(term))) {
            score += 5;
          }
        }
      }
      
      return { trip, score };
    });
    
    // Get pins for trips that have a non-zero score or if we have few matching trips
    const relevantTrips = scoredTrips.filter(item => item.score > 0);
    const tripIdsToCheck = relevantTrips.length < 5 
      ? allTrips.map(t => t.id) // Check all trips if few matches
      : relevantTrips.map(item => item.trip.id);
    
    // Get pins for relevant trips to check for matches in pin content
    const tripPinsMap = new Map<number, Pin[]>();
    const pinsPromises = tripIdsToCheck.map(async tripId => {
      const pins = await this.getPinsByTripId(tripId);
      tripPinsMap.set(tripId, pins);
    });
    
    await Promise.all(pinsPromises);
    
    // Update scores based on pin matches
    const tripScores = new Map(scoredTrips.map(item => [item.trip.id, item.score]));
    
    // Check pins for matches
    for (const [tripId, pins] of tripPinsMap.entries()) {
      let pinScore = 0;
      
      // Check for exact matches in pins
      for (const pin of pins) {
        // Check pin title
        if (pin.title.toLowerCase().includes(normalizedQuery)) {
          pinScore += 5;
        }
        
        // Check pin description
        if (pin.description && pin.description.toLowerCase().includes(normalizedQuery)) {
          pinScore += 3;
        }
        
        // Check pin activities
        if (pin.activities && pin.activities.some(activity => 
          activity.toLowerCase().includes(normalizedQuery))
        ) {
          pinScore += 8;
        }
        
        // Check individual terms in pin details
        for (const term of queryTerms) {
          if (pin.title.toLowerCase().includes(term)) {
            pinScore += 2;
          }
          
          if (pin.description && pin.description.toLowerCase().includes(term)) {
            pinScore += 1;
          }
          
          if (pin.activities && pin.activities.some(activity => 
            activity.toLowerCase().includes(term))
          ) {
            pinScore += 3;
          }
        }
      }
      
      // Update the trip's score with pin score
      const currentScore = tripScores.get(tripId) || 0;
      tripScores.set(tripId, currentScore + pinScore);
    }
    
    // Create final scored trips array with updated scores
    const finalScoredTrips = allTrips.map(trip => ({
      trip,
      score: tripScores.get(trip.id) || 0
    }));
    
    // Filter to only include trips with a score > 0
    const matchingTrips = finalScoredTrips
      .filter(item => item.score > 0)
      .map(item => item.trip);
    
    // If using relevance sorting (date is default), sort by score
    if (matchingTrips.length > 0 && sortBy === 'date') {
      // Sort by score in descending order
      return matchingTrips.sort((a, b) => {
        const scoreA = tripScores.get(a.id) || 0;
        const scoreB = tripScores.get(b.id) || 0;
        return scoreB - scoreA;
      });
    }
    
    // Otherwise, sort by the requested criteria
    return this.sortTrips(matchingTrips, sortBy);
  }
  
  private sortTrips(trips: Trip[], sortBy: 'likes' | 'views' | 'date'): Trip[] {
    switch (sortBy) {
      case 'likes':
        // Sort by like count from highest to lowest
        return [...trips].sort((a, b) => b.likeCount - a.likeCount);
      case 'views':
        // Sort by view count from highest to lowest
        return [...trips].sort((a, b) => b.viewCount - a.viewCount);
      case 'date':
      default:
        // Sort by creation date from newest to oldest
        return [...trips].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }

  // PIN OPERATIONS
  async getPinsByTripId(tripId: number): Promise<Pin[]> {
    return db
      .select()
      .from(pins)
      .where(eq(pins.tripId, tripId))
      .orderBy(pins.order);
  }

  async createPin(insertPin: InsertPin): Promise<Pin> {
    const [pin] = await db.insert(pins).values(insertPin).returning();
    return pin;
  }

  async updatePin(id: number, pinUpdate: Partial<Pin>): Promise<Pin | undefined> {
    const [updatedPin] = await db
      .update(pins)
      .set(pinUpdate)
      .where(eq(pins.id, id))
      .returning();
    
    return updatedPin;
  }

  async deletePin(id: number): Promise<boolean> {
    const result = await db.delete(pins).where(eq(pins.id, id)).returning();
    return result.length > 0;
  }
  
  // Method to seed initial data
  async seedInitialData(): Promise<void> {
    // Check if we have any trips
    const existingTrips = await db.select().from(trips);
    
    // If we already have data, no need to seed
    if (existingTrips.length > 0) {
      return;
    }
    
    // Get default user
    const user = await this.getDefaultUser();
    
    // Sample trips data
    const sampleTrips: InsertTrip[] = [
      {
        userId: user.id,
        title: "Swiss Alps Journey",
        summary: "Exploring the breathtaking mountain ranges and charming villages of Switzerland over two weeks.",
        startDate: new Date("2023-04-12"),
        endDate: new Date("2023-04-26"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500",
        categories: ["Mountains", "Hiking", "Nature"],
      },
      {
        userId: user.id,
        title: "Southeast Asia Backpacking",
        summary: "Three months exploring Thailand, Vietnam, Cambodia, and Indonesia. Best street foods and hidden beaches!",
        startDate: new Date("2023-01-05"),
        endDate: new Date("2023-03-25"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500",
        categories: ["Beach", "Food", "Culture"],
      },
      {
        userId: user.id,
        title: "American Southwest Road Trip",
        summary: "Two weeks driving through Arizona, Utah, and New Mexico. National parks, hiking trails, and amazing sunsets.",
        startDate: new Date("2023-05-08"),
        endDate: new Date("2023-05-22"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500",
        categories: ["Road Trip", "National Parks", "Desert"],
      },
      {
        userId: user.id,
        title: "Italian Coastal Dream",
        summary: "A stunning two-week journey through Italy's most beautiful coastal towns, from the colorful villages of Cinque Terre to the cliffside beauty of the Amalfi Coast.",
        startDate: new Date("2023-06-05"),
        endDate: new Date("2023-06-19"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1533575770077-052fa2c609fc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500",
        categories: ["Coastal", "Food & Wine", "Cultural", "Relaxation"],
      },
      {
        userId: user.id,
        title: "Island Hopping: Greek Isles",
        summary: "Exploring the beautiful islands of Greece, their beaches, cuisine, and architecture.",
        startDate: new Date("2023-07-10"),
        endDate: new Date("2023-07-20"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
        categories: ["Island", "Beach", "Culture"],
      },
      {
        userId: user.id,
        title: "Tokyo: Modern Meets Traditional",
        summary: "Exploring the contrast between modern technology and traditional culture in Tokyo.",
        startDate: new Date("2023-08-05"),
        endDate: new Date("2023-08-13"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
        categories: ["Urban", "Culture", "Food"],
      },
      {
        userId: user.id,
        title: "Pacific Northwest Trek",
        summary: "Hiking through the forests and mountains of the Pacific Northwest.",
        startDate: new Date("2023-09-01"),
        endDate: new Date("2023-09-07"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
        categories: ["Hiking", "Nature", "Photography"],
      },
      {
        userId: user.id,
        title: "Historic European Capitals",
        summary: "Traveling through the historic capitals of Europe, exploring architecture and history.",
        startDate: new Date("2023-10-01"),
        endDate: new Date("2023-10-15"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
        categories: ["Urban", "History", "Culture"],
      }
    ];
    
    // Insert trips
    for (const tripData of sampleTrips) {
      const trip = await this.createTrip({
        ...tripData,
        // Add random view and like counts
        viewCount: Math.floor(Math.random() * 5000),
        likeCount: Math.floor(Math.random() * 600),
      } as any); // Type assertion to include viewCount/likeCount
      
      // Special case: Add pins for Italian Coastal Dream
      if (trip.title === "Italian Coastal Dream") {
        // Add pins
        const pins: InsertPin[] = [
          {
            tripId: trip.id,
            title: "Cinque Terre",
            description: "Explored the colorful cliff-side villages of the Cinque Terre. Hiked between towns and took amazing coastal photos.",
            longitude: "9.7084",
            latitude: "44.1474",
            date: new Date("2023-06-05"),
            order: 1,
            activities: ["Hiking", "Photography"],
            photos: [
              "https://images.unsplash.com/photo-1499678329028-101435549a4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800", 
              "https://images.unsplash.com/photo-1533575770077-052fa2c609fc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800"
            ],
          },
          {
            tripId: trip.id,
            title: "Florence",
            description: "Visited world-class museums and enjoyed amazing Italian cuisine in this Renaissance city.",
            longitude: "11.2558",
            latitude: "43.7696",
            date: new Date("2023-06-09"),
            order: 2,
            activities: ["Museums", "Dining"],
            photos: [
              "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800", 
              "https://images.unsplash.com/photo-1534445867742-43195f401b6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800"
            ],
          },
          {
            tripId: trip.id,
            title: "Sorrento",
            description: "Relaxed in this beautiful coastal town with stunning views of the Bay of Naples.",
            longitude: "14.3757",
            latitude: "40.6263",
            date: new Date("2023-06-12"),
            order: 3,
            activities: ["Beaches", "Boat Tours"],
            photos: [
              "https://images.unsplash.com/photo-1564594822929-48e1bca6a95a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800", 
              "https://images.unsplash.com/photo-1559678478-1fa45c5dd7f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800"
            ],
          },
          {
            tripId: trip.id,
            title: "Amalfi Coast",
            description: "Drove along the stunning Amalfi Coast, stopping at picturesque towns like Positano and Amalfi.",
            longitude: "14.6027",
            latitude: "40.6340",
            date: new Date("2023-06-16"),
            order: 4,
            activities: ["Scenic Drives", "Relaxation"],
            photos: [
              "https://images.unsplash.com/photo-1533606797125-ff3f882f5282?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800", 
              "https://images.unsplash.com/photo-1560860446-c821e910a0a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800"
            ],
          },
        ];
        
        // Add each pin
        for (const pinData of pins) {
          await this.createPin(pinData);
        }
      }
    }
  }
}

export const storage = new DatabaseStorage();

// Seed initial data
async function initializeStorage() {
  try {
    await (storage as DatabaseStorage).seedInitialData();
    console.log("Database initialized with seed data");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Initialize on import
initializeStorage();