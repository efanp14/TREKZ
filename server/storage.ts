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
    // Delete existing data first
    await db.delete(pins);
    await db.delete(trips);
    await db.delete(users);
    
    // Log that we're starting to seed data
    console.log("Seeding comprehensive data for TripTales...");
    
    // Create mock users
    const mockUsers: InsertUser[] = [
      {
        username: "alexmorgan",
        name: "Alex Morgan",
        bio: "Travel enthusiast and photographer. Exploring the world one trip at a time.",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100",
      },
      {
        username: "emilyjohnson",
        name: "Emily Johnson",
        bio: "Adventure seeker and foodie. Always planning my next trip.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100",
      },
      {
        username: "michaelwilson",
        name: "Michael Wilson",
        bio: "Hiking enthusiast and nature photographer. Finding beauty in remote places.",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100",
      },
      {
        username: "sophiabrown",
        name: "Sophia Brown",
        bio: "Digital nomad and travel blogger. Living out of a suitcase since 2019.",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100",
      },
      {
        username: "danielgarcia",
        name: "Daniel Garcia",
        bio: "Urban explorer and street photographer. Finding the soul of cities around the world.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100",
      },
      {
        username: "oliviamartinez",
        name: "Olivia Martinez",
        bio: "Culinary traveler and food critic. Tasting the world one meal at a time.",
        avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100",
      },
    ];
    
    // Insert all users
    const createdUsers: User[] = [];
    for (const userData of mockUsers) {
      const user = await this.createUser(userData);
      createdUsers.push(user);
    }
    
    // Function to create trips and pins
    const createTripsForUser = async (userId: number, numTrips: number) => {
      // Travel regions with coordinates, descriptions, and activities
      const regions = [
        {
          name: "Swiss Alps",
          description: "Breathtaking mountain ranges and charming alpine villages of Switzerland",
          coordinates: [
            { title: "Zermatt", lon: "7.7457", lat: "46.0207" },
            { title: "Interlaken", lon: "7.8632", lat: "46.6863" },
            { title: "Lucerne", lon: "8.3093", lat: "47.0502" },
            { title: "St. Moritz", lon: "9.8345", lat: "46.4908" },
            { title: "Grindelwald", lon: "8.0325", lat: "46.6249" },
            { title: "Lauterbrunnen", lon: "7.9084", lat: "46.5936" },
            { title: "Montreux", lon: "6.9106", lat: "46.4312" }
          ],
          activities: ["Hiking", "Skiing", "Photography", "Mountain Biking", "Cable Cars", "Village Tours"],
          coverImages: [
            "https://images.unsplash.com/photo-1531210483974-4f8c1f33fd35?auto=format&fit=crop&w=800&h=500",
            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&h=500"
          ],
          categories: ["Mountains", "Hiking", "Nature", "Adventure"]
        },
        {
          name: "Southeast Asia",
          description: "Vibrant cultures, ancient temples, bustling street food scenes, and tropical beaches",
          coordinates: [
            { title: "Bangkok", lon: "100.5018", lat: "13.7563" },
            { title: "Chiang Mai", lon: "98.9873", lat: "18.7883" },
            { title: "Hanoi", lon: "105.8342", lat: "21.0278" },
            { title: "Ha Long Bay", lon: "107.0227", lat: "20.9101" },
            { title: "Siem Reap", lon: "103.8601", lat: "13.3633" },
            { title: "Bali", lon: "115.1889", lat: "-8.4095" },
            { title: "Phuket", lon: "98.3380", lat: "7.9519" }
          ],
          activities: ["Temple Visits", "Street Food", "Beach Time", "Cooking Classes", "Boat Tours", "Elephant Sanctuaries"],
          coverImages: [
            "https://images.unsplash.com/photo-1512291313931-d4291048e7b6?auto=format&fit=crop&w=800&h=500",
            "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=800&h=500"
          ],
          categories: ["Beach", "Food", "Culture", "Temples", "Adventure"]
        },
        {
          name: "American Southwest",
          description: "Stunning red rock formations, vast desert landscapes, and iconic national parks",
          coordinates: [
            { title: "Grand Canyon", lon: "-112.1124", lat: "36.0544" },
            { title: "Zion National Park", lon: "-113.0263", lat: "37.2982" },
            { title: "Bryce Canyon", lon: "-112.1871", lat: "37.6283" },
            { title: "Arches National Park", lon: "-109.5861", lat: "38.7331" },
            { title: "Monument Valley", lon: "-110.1734", lat: "36.9838" },
            { title: "Sedona", lon: "-111.7603", lat: "34.8697" },
            { title: "Antelope Canyon", lon: "-111.3743", lat: "36.8619" }
          ],
          activities: ["Hiking", "Photography", "Star Gazing", "Jeep Tours", "River Rafting", "Ranger Programs"],
          coverImages: [
            "https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?auto=format&fit=crop&w=800&h=500",
            "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&h=500"
          ],
          categories: ["National Parks", "Desert", "Road Trip", "Hiking", "Nature"]
        },
        {
          name: "Italian Coast",
          description: "Beautiful coastal towns, crystal-clear Mediterranean waters, and delicious cuisine",
          coordinates: [
            { title: "Cinque Terre", lon: "9.7084", lat: "44.1474" },
            { title: "Florence", lon: "11.2558", lat: "43.7696" },
            { title: "Sorrento", lon: "14.3757", lat: "40.6263" },
            { title: "Amalfi", lon: "14.6025", lat: "40.6340" },
            { title: "Positano", lon: "14.4833", lat: "40.6281" },
            { title: "Capri", lon: "14.2401", lat: "40.5532" },
            { title: "Portofino", lon: "9.2094", lat: "44.3032" }
          ],
          activities: ["Beach Time", "Boat Tours", "Wine Tasting", "Italian Cooking", "Shopping", "Historical Sites"],
          coverImages: [
            "https://images.unsplash.com/photo-1533575770077-052fa2c609fc?auto=format&fit=crop&w=800&h=500",
            "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&h=500"
          ],
          categories: ["Coastal", "Food & Wine", "Cultural", "Relaxation", "Mediterranean"]
        },
        {
          name: "Greek Islands",
          description: "Idyllic white-washed villages, crystal-clear blue waters, and ancient ruins",
          coordinates: [
            { title: "Santorini", lon: "25.4615", lat: "36.3932" },
            { title: "Mykonos", lon: "25.3291", lat: "37.4467" },
            { title: "Crete", lon: "24.8093", lat: "35.2401" },
            { title: "Rhodes", lon: "28.2208", lat: "36.4344" },
            { title: "Naxos", lon: "25.3758", lat: "37.1036" },
            { title: "Paros", lon: "25.1442", lat: "37.0856" },
            { title: "Athens", lon: "23.7275", lat: "37.9838" }
          ],
          activities: ["Island Hopping", "Beach Days", "Greek Cuisine", "Ancient Sites", "Boat Tours", "Water Sports"],
          coverImages: [
            "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=800&h=600",
            "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&h=600"
          ],
          categories: ["Island", "Beach", "Culture", "Ancient History", "Mediterranean"]
        },
        {
          name: "Japan",
          description: "A fascinating blend of ancient traditions and cutting-edge technology, with beautiful natural landscapes",
          coordinates: [
            { title: "Tokyo", lon: "139.6503", lat: "35.6762" },
            { title: "Kyoto", lon: "135.7681", lat: "35.0116" },
            { title: "Osaka", lon: "135.5023", lat: "34.6937" },
            { title: "Nara", lon: "135.8048", lat: "34.6851" },
            { title: "Hakone", lon: "139.1069", lat: "35.2324" },
            { title: "Hiroshima", lon: "132.4553", lat: "34.3853" },
            { title: "Mount Fuji", lon: "138.7274", lat: "35.3606" }
          ],
          activities: ["Temple Visits", "Cherry Blossom Viewing", "Bullet Train Travel", "Traditional Tea Ceremonies", "Food Tours", "Hot Springs"],
          coverImages: [
            "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&h=600",
            "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=800&h=600"
          ],
          categories: ["Urban", "Culture", "Food", "Technology", "Tradition"]
        },
        {
          name: "Pacific Northwest",
          description: "Rugged coastlines, lush rainforests, dramatic mountains, and vibrant cities",
          coordinates: [
            { title: "Seattle", lon: "-122.3321", lat: "47.6062" },
            { title: "Portland", lon: "-122.6795", lat: "45.5152" },
            { title: "Olympic National Park", lon: "-123.6683", lat: "47.8021" },
            { title: "Mount Rainier", lon: "-121.7603", lat: "46.8800" },
            { title: "Crater Lake", lon: "-122.1684", lat: "42.9446" },
            { title: "Columbia River Gorge", lon: "-121.9785", lat: "45.7253" },
            { title: "Vancouver", lon: "-123.1207", lat: "49.2827" }
          ],
          activities: ["Hiking", "Photography", "Coffee Culture", "Whale Watching", "Craft Beer Tasting", "Kayaking"],
          coverImages: [
            "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=800&h=600",
            "https://images.unsplash.com/photo-1506710507565-203b9f24669b?auto=format&fit=crop&w=800&h=600"
          ],
          categories: ["Hiking", "Nature", "Photography", "Outdoors", "Urban Exploration"]
        },
        {
          name: "Northern Europe",
          description: "Historic cities, stunning architecture, vibrant cultural scenes, and picturesque countryside",
          coordinates: [
            { title: "Copenhagen", lon: "12.5683", lat: "55.6761" },
            { title: "Stockholm", lon: "18.0686", lat: "59.3293" },
            { title: "Oslo", lon: "10.7522", lat: "59.9139" },
            { title: "Helsinki", lon: "24.9384", lat: "60.1695" },
            { title: "Bergen", lon: "5.3221", lat: "60.3913" },
            { title: "Reykjavik", lon: "-21.9426", lat: "64.1466" },
            { title: "Tallinn", lon: "24.7536", lat: "59.4370" }
          ],
          activities: ["City Tours", "Museum Visits", "Northern Lights", "Fjord Cruises", "Design Exploration", "Local Cuisine"],
          coverImages: [
            "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=800&h=600",
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&h=600"
          ],
          categories: ["Urban", "History", "Design", "Nature", "Architecture"]
        },
        {
          name: "South America",
          description: "Stunning landscapes, vibrant cultures, ancient ruins, and diverse ecosystems",
          coordinates: [
            { title: "Machu Picchu", lon: "-77.0365", lat: "-13.1631" },
            { title: "Rio de Janeiro", lon: "-43.1729", lat: "-22.9068" },
            { title: "Buenos Aires", lon: "-58.3816", lat: "-34.6037" },
            { title: "Cusco", lon: "-71.9675", lat: "-13.5320" },
            { title: "Galapagos Islands", lon: "-91.0839", lat: "-0.8295" },
            { title: "Amazon Rainforest", lon: "-60.0000", lat: "-3.0000" },
            { title: "Iguazu Falls", lon: "-54.4380", lat: "-25.6953" }
          ],
          activities: ["Hiking", "Wildlife Watching", "Cultural Immersion", "Tango Dancing", "Boat Tours", "Samba Lessons"],
          coverImages: [
            "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&h=600",
            "https://images.unsplash.com/photo-1460306855393-0410f61241c7?auto=format&fit=crop&w=800&h=600"
          ],
          categories: ["Nature", "Adventure", "Culture", "Rainforest", "Historic Sites"]
        },
        {
          name: "Australia & New Zealand",
          description: "Breathtaking landscapes, unique wildlife, vibrant cities, and incredible outdoor adventures",
          coordinates: [
            { title: "Sydney", lon: "151.2093", lat: "-33.8688" },
            { title: "Great Barrier Reef", lon: "145.7000", lat: "-16.2864" },
            { title: "Uluru", lon: "131.0369", lat: "-25.3444" },
            { title: "Auckland", lon: "174.7633", lat: "-36.8485" },
            { title: "Queenstown", lon: "168.6626", lat: "-45.0312" },
            { title: "Melbourne", lon: "144.9631", lat: "-37.8136" },
            { title: "Milford Sound", lon: "167.9256", lat: "-44.6414" }
          ],
          activities: ["Snorkeling", "Hiking", "Wildlife Spotting", "Adventure Sports", "Wine Tasting", "Indigenous Culture"],
          coverImages: [
            "https://images.unsplash.com/photo-1530786948735-8ad957dfe6ff?auto=format&fit=crop&w=800&h=600",
            "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?auto=format&fit=crop&w=800&h=600"
          ],
          categories: ["Adventure", "Nature", "Wildlife", "Beach", "Outdoor"]
        }
      ];
      
      // Generate trips
      const trips: Trip[] = [];
      for (let i = 0; i < numTrips; i++) {
        // Select a random region
        const region = regions[Math.floor(Math.random() * regions.length)];
        
        // Generate random dates within the last 18 months
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() - Math.floor(Math.random() * 18));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (7 + Math.floor(Math.random() * 14))); // 1-3 week trip
        
        // Generate trip title variations
        const titles = [
          `${region.name} Adventure`,
          `Exploring ${region.name}`,
          `${region.name} Discovery`,
          `${region.name} Memories`,
          `Journey Through ${region.name}`,
          `${region.name} Expedition`,
          `${region.name} Wonders`,
          `${region.name} Experience`,
          `${region.name} Escapade`
        ];
        
        // Select a random title
        const title = titles[Math.floor(Math.random() * titles.length)];
        
        // Generate a detailed summary with about 150 words
        const summary = `${region.description}. This unforgettable journey through ${region.name} offered a perfect blend of adventure, culture, and relaxation. From exploring hidden gems to immersing in local traditions, each day brought new discoveries and lasting memories. The breathtaking landscapes, friendly locals, and authentic experiences made this trip truly special. Whether it was sampling local cuisine, learning about ancient history, or simply enjoying the natural beauty, this trip exceeded all expectations and left me with a deep appreciation for the unique charm of ${region.name}.`;
        
        // Select 3-5 random categories
        const shuffledCategories = [...region.categories].sort(() => 0.5 - Math.random());
        const selectedCategories = shuffledCategories.slice(0, 3 + Math.floor(Math.random() * 3));
        
        // Select random cover image
        const coverImage = region.coverImages[Math.floor(Math.random() * region.coverImages.length)];
        
        // Create the trip
        const trip = await this.createTrip({
          userId,
          title,
          summary,
          startDate,
          endDate,
          isPublic: true,
          coverImage,
          categories: selectedCategories,
          viewCount: Math.floor(Math.random() * 5000),
          likeCount: Math.floor(Math.random() * 600),
        } as any);
        
        trips.push(trip);
        
        // Create 5-8 pins for this trip
        // Shuffle the coordinates
        const shuffledCoordinates = [...region.coordinates].sort(() => 0.5 - Math.random());
        
        // Select 5-8 random locations
        const numPins = 5 + Math.floor(Math.random() * 4);
        const selectedLocations = shuffledCoordinates.slice(0, numPins);
        
        // Create pins for this trip
        for (let j = 0; j < selectedLocations.length; j++) {
          const location = selectedLocations[j];
          
          // Calculate date for this pin
          const pinDate = new Date(startDate);
          pinDate.setDate(pinDate.getDate() + Math.floor(j * (endDate.getTime() - startDate.getTime()) / (selectedLocations.length * 24 * 60 * 60 * 1000)));
          
          // Select 2-3 random activities
          const shuffledActivities = [...region.activities].sort(() => 0.5 - Math.random());
          const selectedActivities = shuffledActivities.slice(0, 2 + Math.floor(Math.random() * 2));
          
          // Generate pin description
          const descriptions = [
            `Spent the day exploring ${location.title}. ${selectedActivities.join(" and ")} were the highlights of this amazing place.`,
            `Discovered the beauty of ${location.title}. Absolutely loved the ${selectedActivities.join(" and ")}.`,
            `${location.title} was breathtaking! Enjoyed ${selectedActivities.join(" and ")} while taking in the incredible views.`,
            `Explored ${location.title} today. The ${selectedActivities[0]} was unforgettable.`,
            `Day trip to ${location.title}. Couldn't get enough of the ${selectedActivities.join(" and ")}.`
          ];
          
          const description = descriptions[Math.floor(Math.random() * descriptions.length)];
          
          // Generate random photos (URLs from Unsplash)
          const photoBaseUrls = [
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
            "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
            "https://images.unsplash.com/photo-1505118380757-91f5f5632de0",
            "https://images.unsplash.com/photo-1499363536502-87642509e31b",
            "https://images.unsplash.com/photo-1514565131-fce0801e5785",
            "https://images.unsplash.com/photo-1475688621402-4257c812d6db",
            "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4",
            "https://images.unsplash.com/photo-1517760444937-f6397edcbbcd",
            "https://images.unsplash.com/photo-1520466809213-7b9a56adcd45",
            "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b",
            "https://images.unsplash.com/photo-1486299267070-83823f5448dd",
            "https://images.unsplash.com/photo-1459058537932-d95b3e968a81",
            "https://images.unsplash.com/photo-1491331941906-5b8fb02aef42",
            "https://images.unsplash.com/photo-1504214208698-ea1916a2195a"
          ];
          
          // Select 1-3 random photos
          const numPhotos = 1 + Math.floor(Math.random() * 3);
          const shuffledPhotos = [...photoBaseUrls].sort(() => 0.5 - Math.random());
          const selectedPhotos = shuffledPhotos.slice(0, numPhotos).map(url => 
            `${url}?auto=format&fit=crop&w=1200&h=800`
          );
          
          // Create the pin
          await this.createPin({
            tripId: trip.id,
            title: location.title,
            description,
            longitude: location.lon,
            latitude: location.lat,
            date: pinDate,
            order: j + 1,
            activities: selectedActivities,
            photos: selectedPhotos,
          });
        }
      }
      
      return trips;
    };
    
    // Create trips for each user
    console.log("Creating trips for users...");
    const tripDistribution = [5, 4, 4, 3, 3, 3]; // Total: 22 trips
    
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const numTrips = tripDistribution[i];
      console.log(`Creating ${numTrips} trips for user ${user.name}...`);
      await createTripsForUser(user.id, numTrips);
    }
    
    console.log("Seed data creation complete with 6 users and 22 trips!");
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