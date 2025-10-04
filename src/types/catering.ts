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
  | "archived";

export type CateringRequest = {
  id: string;
  createdAt: number;
  eventDate?: number;
  name: string;
  email: string;
  phone?: string;
  guestCount?: number;
  packageTier?: "standard" | "premium" | "luxury";
  selections?: string[];
  notes?: string;
  status: CateringStatus;
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