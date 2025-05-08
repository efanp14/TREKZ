import { 
  users, type User, type InsertUser,
  trips, type Trip, type InsertTrip,
  pins, type Pin, type InsertPin
} from "@shared/schema";

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

  // Pin operations
  getPinsByTripId(tripId: number): Promise<Pin[]>;
  createPin(pin: InsertPin): Promise<Pin>;
  updatePin(id: number, pin: Partial<Pin>): Promise<Pin | undefined>;
  deletePin(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trips: Map<number, Trip>;
  private pins: Map<number, Pin>;
  private defaultUser: User;
  
  private userIdCounter: number;
  private tripIdCounter: number;
  private pinIdCounter: number;

  constructor() {
    this.users = new Map();
    this.trips = new Map();
    this.pins = new Map();
    
    this.userIdCounter = 1;
    this.tripIdCounter = 1;
    this.pinIdCounter = 1;

    // Create default test user
    this.defaultUser = {
      id: this.userIdCounter++,
      username: "alexmorgan",
      name: "Alex Morgan",
      bio: "Travel enthusiast and photographer. Exploring the world one trip at a time.",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100",
    };
    this.users.set(this.defaultUser.id, this.defaultUser);

    this.seedData();
  }

  private seedData() {
    // Create some sample trips
    const sampleTrips: InsertTrip[] = [
      {
        userId: this.defaultUser.id,
        title: "Swiss Alps Journey",
        summary: "Exploring the breathtaking mountain ranges and charming villages of Switzerland over two weeks.",
        startDate: new Date("2023-04-12"),
        endDate: new Date("2023-04-26"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500",
        categories: ["Mountains", "Hiking", "Nature"],
      },
      {
        userId: this.defaultUser.id,
        title: "Southeast Asia Backpacking",
        summary: "Three months exploring Thailand, Vietnam, Cambodia, and Indonesia. Best street foods and hidden beaches!",
        startDate: new Date("2023-01-05"),
        endDate: new Date("2023-03-25"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500",
        categories: ["Beach", "Food", "Culture"],
      },
      {
        userId: this.defaultUser.id,
        title: "American Southwest Road Trip",
        summary: "Two weeks driving through Arizona, Utah, and New Mexico. National parks, hiking trails, and amazing sunsets.",
        startDate: new Date("2023-05-08"),
        endDate: new Date("2023-05-22"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500",
        categories: ["Road Trip", "National Parks", "Desert"],
      },
      {
        userId: this.defaultUser.id,
        title: "Italian Coastal Dream",
        summary: "A stunning two-week journey through Italy's most beautiful coastal towns, from the colorful villages of Cinque Terre to the cliffside beauty of the Amalfi Coast.",
        startDate: new Date("2023-06-05"),
        endDate: new Date("2023-06-19"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1533575770077-052fa2c609fc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=500",
        categories: ["Coastal", "Food & Wine", "Cultural", "Relaxation"],
        viewCount: 3200,
        likeCount: 458,
      },
      {
        userId: this.defaultUser.id,
        title: "Island Hopping: Greek Isles",
        summary: "Exploring the beautiful islands of Greece, their beaches, cuisine, and architecture.",
        startDate: new Date("2023-07-10"),
        endDate: new Date("2023-07-20"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
        categories: ["Island", "Beach", "Culture"],
      },
      {
        userId: this.defaultUser.id,
        title: "Tokyo: Modern Meets Traditional",
        summary: "Exploring the contrast between modern technology and traditional culture in Tokyo.",
        startDate: new Date("2023-08-05"),
        endDate: new Date("2023-08-13"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
        categories: ["Urban", "Culture", "Food"],
      },
      {
        userId: this.defaultUser.id,
        title: "Pacific Northwest Trek",
        summary: "Hiking through the forests and mountains of the Pacific Northwest.",
        startDate: new Date("2023-09-01"),
        endDate: new Date("2023-09-07"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
        categories: ["Hiking", "Nature", "Photography"],
      },
      {
        userId: this.defaultUser.id,
        title: "Historic European Capitals",
        summary: "Traveling through the historic capitals of Europe, exploring architecture and history.",
        startDate: new Date("2023-10-01"),
        endDate: new Date("2023-10-15"),
        isPublic: true,
        coverImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600",
        categories: ["Urban", "History", "Culture"],
      }
    ];

    // Add trips to storage
    sampleTrips.forEach(trip => {
      const tripWithId: Trip = {
        ...trip,
        id: this.tripIdCounter++,
        createdAt: new Date(),
        viewCount: Math.floor(Math.random() * 5000),
        likeCount: Math.floor(Math.random() * 600),
      };
      this.trips.set(tripWithId.id, tripWithId);
    });

    // Add pins for the Italian Coastal Dream trip
    const italianTrip = Array.from(this.trips.values()).find(trip => trip.title === "Italian Coastal Dream");
    if (italianTrip) {
      const pins: InsertPin[] = [
        {
          tripId: italianTrip.id,
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
          tripId: italianTrip.id,
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
          tripId: italianTrip.id,
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
          tripId: italianTrip.id,
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

      pins.forEach(pin => {
        const pinWithId: Pin = {
          ...pin,
          id: this.pinIdCounter++,
        };
        this.pins.set(pinWithId.id, pinWithId);
      });
    }
  }

  // USER OPERATIONS
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDefaultUser(): Promise<User> {
    return this.defaultUser;
  }

  // TRIP OPERATIONS
  async getTrips(): Promise<Trip[]> {
    return Array.from(this.trips.values());
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async getTripsByUserId(userId: number): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(trip => trip.userId === userId);
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = this.tripIdCounter++;
    const trip: Trip = {
      ...insertTrip,
      id,
      createdAt: new Date(),
      viewCount: 0,
      likeCount: 0,
    };
    this.trips.set(id, trip);
    return trip;
  }

  async updateTrip(id: number, tripUpdate: Partial<Trip>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    
    const updatedTrip = { ...trip, ...tripUpdate };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }

  async deleteTrip(id: number): Promise<boolean> {
    // Delete all associated pins first
    const tripPins = await this.getPinsByTripId(id);
    tripPins.forEach(pin => this.pins.delete(pin.id));
    
    return this.trips.delete(id);
  }

  async getTrendingTrips(limit: number = 6): Promise<Trip[]> {
    return Array.from(this.trips.values())
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  async getRecentTrips(limit: number = 8): Promise<Trip[]> {
    return Array.from(this.trips.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async incrementTripViews(id: number): Promise<void> {
    const trip = this.trips.get(id);
    if (trip) {
      trip.viewCount += 1;
      this.trips.set(id, trip);
    }
  }

  async likeTrip(id: number): Promise<void> {
    const trip = this.trips.get(id);
    if (trip) {
      trip.likeCount += 1;
      this.trips.set(id, trip);
    }
  }

  // PIN OPERATIONS
  async getPinsByTripId(tripId: number): Promise<Pin[]> {
    return Array.from(this.pins.values())
      .filter(pin => pin.tripId === tripId)
      .sort((a, b) => a.order - b.order);
  }

  async createPin(insertPin: InsertPin): Promise<Pin> {
    const id = this.pinIdCounter++;
    const pin: Pin = { ...insertPin, id };
    this.pins.set(id, pin);
    return pin;
  }

  async updatePin(id: number, pinUpdate: Partial<Pin>): Promise<Pin | undefined> {
    const pin = this.pins.get(id);
    if (!pin) return undefined;
    
    const updatedPin = { ...pin, ...pinUpdate };
    this.pins.set(id, updatedPin);
    return updatedPin;
  }

  async deletePin(id: number): Promise<boolean> {
    return this.pins.delete(id);
  }
}

export const storage = new MemStorage();
