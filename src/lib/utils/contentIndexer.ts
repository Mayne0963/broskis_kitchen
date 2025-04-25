import { createHash } from "crypto"

// Define the structure for indexed content
export interface IndexedContent {
  id: string
  url: string
  title: string
  content: string
  lastIndexed: Date
}

// Define the structure for the content database
export interface ContentDatabase {
  pages: IndexedContent[]
  lastUpdated: Date
}

// Initialize an empty database
let contentDatabase: ContentDatabase = {
  pages: [],
  lastUpdated: new Date(),
}

// URLs to scan - these would be your website pages
const urlsToScan = [
  "/menu",
  "/infused-menu",
  "/locations",
  "/events",
  "/rewards",
  "/shop",
  "/contact",
  "/volunteer",
  "/about",
  "/loyalty",
]

// Function to scan a single page and extract content
async function scanPage(url: string): Promise<IndexedContent | null> {
  try {
    // In a real implementation, this would be a fetch to your actual deployed site
    // For now, we'll simulate content based on the URL path
    const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://broskiskitchen.com"
    const fullUrl = `${baseUrl}${url}`

    // Simulate fetching the page
    // In a real implementation: const response = await fetch(fullUrl);
    // const html = await response.text();

    // For now, generate simulated content based on the URL
    const simulatedContent = getSimulatedContent(url)

    // Generate a unique ID for this content
    const id = createHash("md5").update(`${url}-${new Date().toISOString()}`).digest("hex")

    return {
      id,
      url,
      title: simulatedContent.title,
      content: simulatedContent.content,
      lastIndexed: new Date(),
    }
  } catch (error) {
    console.error(`Error scanning page ${url}:`, error)
    return null
  }
}

// Function to simulate content for different pages
function getSimulatedContent(url: string): { title: string; content: string } {
  switch (url) {
    case "/menu":
      return {
        title: "Menu - Broski's Kitchen",
        content: `Our menu features luxury street gourmet items including burgers, tacos, wings, and sides. 
        Popular items include the Luxury Burger ($18.99), Gourmet Street Tacos ($14.99), and Truffle Parmesan Fries ($9.99).
        We offer vegetarian, vegan, gluten-free, and dairy-free options. All items are clearly marked with dietary information.`,
      }
    case "/infused-menu":
      return {
        title: "Infused Menu - Broski's Kitchen",
        content: `Our infused menu features premium culinary creations with special infusions. 
        You must be 21+ to access this menu, and it's only available in locations where legal.
        Popular items include Infused Wings ($16.99), Infused Chocolate Brownie ($12.99), and Infused Luxury Margarita ($15.99).`,
      }
    case "/locations":
      return {
        title: "Locations - Broski's Kitchen",
        content: `We have locations in LA, SF, NYC, and Chicago. 
        Our flagship location is in Downtown LA at 420 S Grand Ave, Los Angeles, CA 90071.
        Most locations are open from 11 AM to 10 PM Monday through Thursday, 11 AM to 12 AM Friday and Saturday, and 10 AM to 9 PM on Sunday.`,
      }
    case "/events":
      return {
        title: "Events - Broski's Kitchen",
        content: `Join us for exclusive tastings, chef workshops, and special dining experiences.
        Upcoming events include Luxury Tasting Experience, Infused Cooking Workshop, and Chef's Table Underground Dinner Series.
        You can register for events on our website.`,
      }
    case "/rewards":
      return {
        title: "Rewards Program - Broski's Kitchen",
        content: `Our rewards program lets you earn points with every purchase. 
        Bronze tier: 1 point per $1 spent, Silver tier: 1.5 points per $1 spent, Gold tier: 2 points per $1 spent.
        You can redeem points for free menu items, discounts, and exclusive experiences.`,
      }
    case "/shop":
      return {
        title: "Shop - Broski's Kitchen",
        content: `We offer a range of merchandise including t-shirts, hats, hoodies, and more.
        Popular items include the Classic Logo T-Shirt ($29.99), Graffiti Style Hoodie ($59.99), and Luxury Snapback Cap ($34.99).`,
      }
    case "/contact":
      return {
        title: "Contact Us - Broski's Kitchen",
        content: `You can contact us through our Contact page, by email at info@broskiskitchen.com, or by phone at (213) 555-1234.
        Our headquarters is located at 420 S Grand Ave, Los Angeles, CA 90071.
        For catering inquiries, contact catering@broskiskitchen.com or call (213) 555-5678.`,
      }
    case "/volunteer":
      return {
        title: "Volunteer - Broski's Kitchen",
        content: `We have volunteer opportunities through our community outreach programs.
        Volunteer positions include Kitchen Assistant, Event Support, Food Distribution, Community Outreach, and Administrative Support.
        You must be at least 16 years old to volunteer.`,
      }
    case "/about":
      return {
        title: "About Us - Broski's Kitchen",
        content: `Broski's Kitchen was founded with a vision to blend luxury dining with street food culture.
        We started as a food truck in LA and have grown to multiple locations across the country.
        Our mission is to provide gourmet street food experiences that are accessible to everyone.`,
      }
    case "/loyalty":
      return {
        title: "Loyalty Program - Broski's Kitchen",
        content: `Join our exclusive loyalty program and unlock premium benefits, rewards, and experiences.
        Our loyalty program features three membership tiers: Bronze, Silver, and Gold.
        Benefits include points on purchases, birthday rewards, priority pickup, exclusive menu items, free delivery, and VIP event invitations.`,
      }
    default:
      return {
        title: "Broski's Kitchen",
        content: "Luxury Street Gourmet – Where Flavor Meets Culture",
      }
  }
}

// Function to scan all pages and update the database
export async function indexAllContent(): Promise<ContentDatabase> {
  const newPages: IndexedContent[] = []

  for (const url of urlsToScan) {
    const pageContent = await scanPage(url)
    if (pageContent) {
      newPages.push(pageContent)
    }
  }

  contentDatabase = {
    pages: newPages,
    lastUpdated: new Date(),
  }

  return contentDatabase
}

// Function to get the current content database
export function getContentDatabase(): ContentDatabase {
  return contentDatabase
}

// Function to search the content database
export function searchContent(query: string): IndexedContent[] {
  const normalizedQuery = query.toLowerCase()

  return contentDatabase.pages.filter((page) => {
    return page.title.toLowerCase().includes(normalizedQuery) || page.content.toLowerCase().includes(normalizedQuery)
  })
}

// Initialize the database on module load
indexAllContent().catch(console.error)
