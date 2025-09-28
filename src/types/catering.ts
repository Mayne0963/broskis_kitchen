export interface CateringPackage {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  minGuests: number;
  maxGuests: number;
}

export interface CateringAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'per_person' | 'flat_rate';
}

export interface CateringMenu {
  meats: string[];
  sides: string[];
  drinks?: string[];
  appetizers?: string[];
  desserts?: string[];
}

export interface CateringCustomer {
  name: string;
  email: string;
  phone: string;
  company?: string;
}

export interface CateringEvent {
  date: string;
  time: string;
  location: string;
  type: string;
  notes?: string;
}

export interface CateringRequest {
  id?: string;
  customer: CateringCustomer;
  event: CateringEvent;
  packageId: string;
  guests: number;
  addons: string[];
  menu: CateringMenu;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface CateringEstimate {
  packagePrice: number;
  addonPrice: number;
  totalPrice: number;
  deposit: number;
}

// Admin types
export type CateringAdminQuery = {
  status?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
};

export type CateringStatus = "pending" | "quoted" | "confirmed" | "canceled";