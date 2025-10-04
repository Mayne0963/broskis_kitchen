/**
 * Catering Dashboard Types
 * Data models for the Admin Catering Dashboard system
 */

export type CateringStatus = 
  | "new" 
  | "in_review" 
  | "quoted" 
  | "confirmed" 
  | "cancelled" 
  | "archived"
  | "paid";

export type CateringRequest = {
  id: string;
  createdAt: number;
  
  // Nested customer data
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
  
  // Nested event data
  event?: {
    date: string;
    address: string;
    guests: number;
  };
  
  // Nested price data
  price?: {
    currency: string;
    addons: number;
    deposit?: number;
    perGuest?: number;
    subtotal?: number;
    total?: number;
  };
  
  // Nested stripe data
  stripe?: {
    checkoutUrl?: string;
  };
  
  packageTier?: "standard" | "premium" | "luxury";
  notes?: string;
  status: CateringStatus;
  
  // Legacy flat fields for backward compatibility
  eventDate?: number;
  name?: string;
  email?: string;
  phone?: string;
  guestCount?: number;
  selections?: string[];
  totalEstimate?: number;
  source?: "site" | "contact" | "manual";
  updatedAt?: number;
};

export type CateringListResponse = {
  items: CateringRequest[];
  nextCursor: string | null;
};

export type CateringFilters = {
  status?: string;
  q?: string;
  limit?: number;
  cursor?: string;
};

export type CateringUpdateRequest = {
  status?: CateringStatus;
  notes?: string;
  totalEstimate?: number;
};