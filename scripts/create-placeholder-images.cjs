const fs = require('fs');
const path = require('path');

// Function to create SVG placeholder
function createSVGPlaceholder(name, width = 400, height = 400) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f3f4f6"/>
  <rect x="${width * 0.1}" y="${height * 0.3}" width="${width * 0.8}" height="${height * 0.4}" rx="10" fill="#d4af37"/>
  <text x="${width / 2}" y="${height * 0.8}" text-anchor="middle" font-family="Arial" font-size="16" fill="#374151">${name}</text>
</svg>`;
}

// List of images to create
const imagesToCreate = [
  // Menu items
  { path: 'public/images/gourmet-tacos.jpg', name: 'Gourmet Tacos' },
  { path: 'public/images/truffle-fries.jpg', name: 'Truffle Fries' },
  { path: 'public/images/wagyu-sandwich.jpg', name: 'Wagyu Sandwich' },
  { path: 'public/images/vegan-burger.jpg', name: 'Vegan Burger' },
  { path: 'public/images/buffalo-cauliflower.jpg', name: 'Buffalo Cauliflower' },
  { path: 'public/images/lobster-tacos.jpg', name: 'Lobster Tacos' },
  { path: 'public/images/gold-cheesecake.jpg', name: '24K Gold Cheesecake' },
  { path: 'public/images/korean-wings.jpg', name: 'Korean Wings' },
  { path: 'public/images/loaded-nachos.jpg', name: 'Loaded Nachos' },
  { path: 'public/images/mushroom-burger.jpg', name: 'Mushroom Burger' },
  { path: 'public/images/fish-tacos.jpg', name: 'Fish Tacos' },
  
  // Infused items
  { path: 'public/images/infused-wings.jpg', name: 'Infused Wings' },
  { path: 'public/images/infused-brownie.jpg', name: 'Infused Brownie' },
  { path: 'public/images/infused-margarita.jpg', name: 'Infused Margarita' },
  { path: 'public/images/infused-chocolate.jpg', name: 'Infused Chocolate' },
  
  // Merchandise
  { path: 'public/images/merch/classic-logo-tee.jpg', name: 'Classic Logo Tee' },
  { path: 'public/images/merch/classic-logo-tee-2.jpg', name: 'Classic Logo Tee' },
  { path: 'public/images/merch/graffiti-hoodie.jpg', name: 'Graffiti Hoodie' },
  { path: 'public/images/merch/graffiti-hoodie-2.jpg', name: 'Graffiti Hoodie' },
  { path: 'public/images/merch/snapback-cap.jpg', name: 'Snapback Cap' },
  { path: 'public/images/merch/snapback-cap-2.jpg', name: 'Snapback Cap' },
  { path: 'public/images/merch/beanie.jpg', name: 'Beanie' },
  { path: 'public/images/merch/beanie-2.jpg', name: 'Beanie' },
  { path: 'public/images/merch/insulated-tumbler.jpg', name: 'Insulated Tumbler' },
  { path: 'public/images/merch/insulated-tumbler-2.jpg', name: 'Insulated Tumbler' },
  { path: 'public/images/merch/ceramic-mug.jpg', name: 'Ceramic Mug' },
  { path: 'public/images/merch/ceramic-mug-2.jpg', name: 'Ceramic Mug' },
  
  // Events
  { path: 'public/images/event-tasting.jpg', name: 'Tasting Event', width: 600, height: 400 },
  { path: 'public/images/event-workshop.jpg', name: 'Workshop Event', width: 600, height: 400 },
  { path: 'public/images/event-dinner.jpg', name: 'Dinner Event', width: 600, height: 400 },
  { path: 'public/images/event-music.jpg', name: 'Music Event', width: 600, height: 400 },
  { path: 'public/images/event-popup.jpg', name: 'Pop-up Event', width: 600, height: 400 },
  { path: 'public/images/event-holiday.jpg', name: 'Holiday Event', width: 600, height: 400 },
  { path: 'public/images/event-past-1.jpg', name: 'Past Event', width: 600, height: 400 },
  
  // Chefs
  { path: 'public/images/chef-marcus.jpg', name: 'Chef Marcus', width: 300, height: 400 },
  { path: 'public/images/chef-olivia.jpg', name: 'Chef Olivia', width: 300, height: 400 },
  { path: 'public/images/chef-james.jpg', name: 'Chef James', width: 300, height: 400 },
  
  // Rewards
  { path: 'public/images/reward-burger.jpg', name: 'Burger Reward' },
  { path: 'public/images/reward-side.jpg', name: 'Side Reward' },
  { path: 'public/images/reward-dessert.jpg', name: 'Dessert Reward' },
  { path: 'public/images/reward-discount.jpg', name: '10% Off' },
  { path: 'public/images/reward-discount-20.jpg', name: '20% Off' },
  { path: 'public/images/reward-delivery.jpg', name: 'Free Delivery' },
  { path: 'public/images/reward-cooking-class.jpg', name: 'Cooking Class' },
  { path: 'public/images/reward-chefs-table.jpg', name: 'Chef\'s Table' },
  { path: 'public/images/reward-tshirt.jpg', name: 'T-Shirt Reward' },
  { path: 'public/images/reward-hat.jpg', name: 'Hat Reward' },
  { path: 'public/images/reward-cookbook.jpg', name: 'Cookbook' },
  { path: 'public/images/reward-vip-event.jpg', name: 'VIP Event' }
];

// Create all placeholder images
imagesToCreate.forEach(({ path: imagePath, name, width = 400, height = 400 }) => {
  const dir = path.dirname(imagePath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Create SVG content
  const svgContent = createSVGPlaceholder(name, width, height);
  
  // Write file
  fs.writeFileSync(imagePath, svgContent);
  console.log(`✓ Created: ${imagePath}`);
});

console.log(`\n✓ Created ${imagesToCreate.length} placeholder images!`);