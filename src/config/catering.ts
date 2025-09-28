export const CATERING_PACKAGES = [
  {
    id: "standard",
    name: "Standard",
    pricePerGuest: 18,
    includes: ["2 meats", "2 sides", "bread"]
  },
  {
    id: "premium",
    name: "Premium",
    pricePerGuest: 24,
    includes: ["3 meats", "3 sides", "bread", "drinks"]
  },
  {
    id: "luxury",
    name: "Luxury",
    pricePerGuest: 32,
    includes: ["3 meats", "3 sides", "apps", "dessert", "drinks"]
  }
];

export const ADDONS = [
  {
    id: "staffing",
    name: "On-site Staff/hr",
    price: 35,
    type: "hour"
  },
  {
    id: "delivery",
    name: "Delivery flat",
    price: 40,
    type: "flat"
  },
  {
    id: "chafers",
    name: "Chafers set",
    price: 12,
    type: "unit"
  },
  {
    id: "dessertBar",
    name: "Dessert Bar/guest",
    price: 6,
    type: "perGuest"
  }
];

export const MIN_GUESTS = 25;
export const DEPOSIT_PCT = 0.2;