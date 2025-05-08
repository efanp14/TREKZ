import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users - basic user information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Trips - represents a travel journey with multiple pins
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  coverImage: text("cover_image"),
  categories: text("categories").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  viewCount: true,
  likeCount: true,
});

// Pins - location pins within a trip
export const pins = pgTable("pins", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  longitude: text("longitude").notNull(),
  latitude: text("latitude").notNull(),
  date: timestamp("date").notNull(),
  order: integer("order").notNull(),
  activities: text("activities").array(),
  photos: text("photos").array(),
});

export const insertPinSchema = createInsertSchema(pins).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Pin = typeof pins.$inferSelect;
export type InsertPin = z.infer<typeof insertPinSchema>;

// Extended schemas for form validation
export const tripFormSchema = insertTripSchema.extend({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  summary: z.string().min(10, { message: "Summary must be at least 10 characters" }),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  categories: z.array(z.string()).optional(),
});

export const pinFormSchema = insertPinSchema.extend({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  longitude: z.string().min(1, { message: "Longitude is required" }),
  latitude: z.string().min(1, { message: "Latitude is required" }),
});
