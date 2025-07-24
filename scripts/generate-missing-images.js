const fs = require('fs');
const path = require('path');
const https = require('https');

// List of all images that need to be created
const imagesToCreate = [
  // Menu items
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20gourmet%20burger%20with%20truffle%20aioli%20aged%20cheddar%20caramelized%20onions%20brioche%20bun%20premium%20beef%20patty&image_size=square_hd',
    path: 'public/images/luxury-burger.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=gourmet%20street%20tacos%20premium%20fillings%20house%20made%20salsas%20luxury%20presentation&image_size=square_hd',
    path: 'public/images/gourmet-tacos.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=truffle%20parmesan%20fries%20hand%20cut%20golden%20crispy%20fresh%20herbs%20gourmet%20side%20dish&image_size=square_hd',
    path: 'public/images/truffle-fries.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=wagyu%20beef%20sandwich%20thinly%20sliced%20horseradish%20cream%20arugula%20artisan%20bread%20luxury%20sandwich&image_size=square_hd',
    path: 'public/images/wagyu-sandwich.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20vegan%20burger%20plant%20based%20patty%20vegan%20truffle%20aioli%20dairy%20free%20cheese%20vegan%20brioche&image_size=square_hd',
    path: 'public/images/vegan-burger.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=buffalo%20cauliflower%20crispy%20florets%20buffalo%20sauce%20vegan%20ranch%20dressing%20appetizer&image_size=square_hd',
    path: 'public/images/buffalo-cauliflower.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=lobster%20tacos%20butter%20poached%20lobster%20avocado%20crema%20mango%20salsa%20corn%20tortillas%20luxury%20seafood&image_size=square_hd',
    path: 'public/images/lobster-tacos.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=24k%20gold%20cheesecake%20new%20york%20style%20edible%20gold%20leaf%20berry%20compote%20luxury%20dessert&image_size=square_hd',
    path: 'public/images/gold-cheesecake.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=korean%20gochujang%20wings%20crispy%20sweet%20spicy%20glaze%20sesame%20seeds%20green%20onions&image_size=square_hd',
    path: 'public/images/korean-wings.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20loaded%20nachos%20house%20made%20tortilla%20chips%20premium%20beef%20queso%20guacamole%20pico%20de%20gallo&image_size=square_hd',
    path: 'public/images/loaded-nachos.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=truffle%20mushroom%20burger%20premium%20beef%20patty%20sauteed%20wild%20mushrooms%20truffle%20butter%20swiss%20cheese%20brioche&image_size=square_hd',
    path: 'public/images/mushroom-burger.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=blackened%20fish%20tacos%20mahi%20mahi%20cabbage%20slaw%20chipotle%20crema%20pickled%20red%20onions%20corn%20tortillas&image_size=square_hd',
    path: 'public/images/fish-tacos.jpg'
  },
  // Infused items
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=infused%20wings%20crispy%20chicken%20wings%20special%20infusion&image_size=square_hd',
    path: 'public/images/infused-wings.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Infused%20chocolate%20brownie%20rich%20chocolate%20special%20infusion%20gold%20flakes&image_size=square_hd',
    path: 'public/images/infused-brownie.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Infused%20luxury%20margarita%20premium%20tequila%20fresh%20lime%20juice%20agave%20nectar%20special%20infusion%20gold%20rim&image_size=square_hd',
    path: 'public/images/infused-margarita.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Infused%20luxury%20chocolate%20bar%20premium%20dark%20chocolate%20special%20infusion%20sea%20salt%20gold%20flakes&image_size=square_hd',
    path: 'public/images/infused-chocolate.jpg'
  },
  // Merchandise items
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20signature%20t-shirt%20premium%20cotton%20ultimate%20comfort&image_size=square_hd',
    path: 'public/images/merch/classic-logo-tee.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20signature%20t-shirt%20premium%20cotton%20ultimate%20comfort&image_size=square_hd',
    path: 'public/images/merch/classic-logo-tee-2.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20graffiti%20style%20hoodie%20premium%20cotton%20street%20art%20design%20exclusive%20to%20Broski\'s%20Kitchen&image_size=square_hd',
    path: 'public/images/merch/graffiti-hoodie.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20graffiti%20style%20hoodie%20premium%20cotton%20street%20art%20design%20exclusive%20to%20Broski\'s%20Kitchen&image_size=square_hd',
    path: 'public/images/merch/graffiti-hoodie-2.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20luxury%20snapback%20cap%20premium%20cotton%20embroidered%20Broski\'s%20Kitchen%20logo%20one%20size%20fits%20most%20with%20adjustable%20strap&image_size=square_hd',
    path: 'public/images/merch/snapback-cap.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20luxury%20snapback%20cap%20premium%20cotton%20embroidered%20Broski\'s%20Kitchen%20logo%20one%20size%20fits%20most%20with%20adjustable%20strap&image_size=square_hd',
    path: 'public/images/merch/snapback-cap-2.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20embroidered%20beanie%20stylish%20keep%20your%20head%20warm%20with%20our%20stylish%20beanie%20featuring%20an%20embroidered%20Broski\'s%20Kitchen%20logo&image_size=square_hd',
    path: 'public/images/merch/beanie.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20embroidered%20beanie%20stylish%20keep%20your%20head%20warm%20with%20our%20stylish%20beanie%20featuring%20an%20embroidered%20Broski\'s%20Kitchen%20logo&image_size=square_hd',
    path: 'public/images/merch/beanie-2.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20insulated%20tumbler%20double%20walled%20stainless%20steel%20keeps%20drinks%20hot%20cold%20hours%20signature%20logo&image_size=square_hd',
    path: 'public/images/merch/insulated-tumbler.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20insulated%20tumbler%20double%20walled%20stainless%20steel%20keeps%20drinks%20hot%20cold%20hours%20signature%20logo&image_size=square_hd',
    path: 'public/images/merch/insulated-tumbler-2.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20ceramic%20mug%20logo%20holds%2012oz%20favorite%20beverage&image_size=square_hd',
    path: 'public/images/merch/ceramic-mug.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Broski\'s%20Kitchen%20ceramic%20mug%20logo%20holds%2012oz%20favorite%20beverage&image_size=square_hd',
    path: 'public/images/merch/ceramic-mug-2.jpg'
  },
  // Event images
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20street%20food%20tasting%20event%20elegant%20dining%20experience%20chef%20demonstration&image_size=landscape_16_9',
    path: 'public/images/event-tasting.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20workshop%20hands%20on%20culinary%20class%20professional%20kitchen%20chef%20instruction&image_size=landscape_16_9',
    path: 'public/images/event-workshop.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=chef%20table%20dinner%20intimate%20dining%20experience%20multi%20course%20meal%20luxury%20restaurant&image_size=landscape_16_9',
    path: 'public/images/event-dinner.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=hip%20hop%20dinner%20party%20music%20food%20event%20DJ%20dancing%20street%20luxury&image_size=landscape_16_9',
    path: 'public/images/event-music.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=pop%20up%20restaurant%20event%20collaboration%20special%20menu%20street%20food%20fusion&image_size=landscape_16_9',
    path: 'public/images/event-popup.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=thanksgiving%20holiday%20feast%20family%20style%20dining%20luxury%20street%20food%20celebration&image_size=landscape_16_9',
    path: 'public/images/event-holiday.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=summer%20rooftop%20party%20city%20views%20cocktails%20DJ%20celebration&image_size=landscape_16_9',
    path: 'public/images/event-past-1.jpg'
  },
  // Chef images
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chef%20Marcus%20Reynolds%20executive%20chef%20luxury%20kitchen%20portrait&image_size=portrait_4_3',
    path: 'public/images/chef-marcus.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chef%20Olivia%20Chen%20cannabis%20culinary%20specialist%20kitchen%20portrait&image_size=portrait_4_3',
    path: 'public/images/chef-olivia.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20chef%20James%20Wilson%20culinary%20director%20luxury%20kitchen%20portrait&image_size=portrait_4_3',
    path: 'public/images/chef-james.jpg'
  },
  // Reward images
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20burger%20reward%20voucher%20gift%20card%20style%20golden%20design&image_size=square_hd',
    path: 'public/images/reward-burger.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=side%20dish%20reward%20voucher%20gift%20card%20style%20golden%20design&image_size=square_hd',
    path: 'public/images/reward-side.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=dessert%20reward%20voucher%20gift%20card%20style%20golden%20design&image_size=square_hd',
    path: 'public/images/reward-dessert.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=discount%20reward%20voucher%20gift%20card%20style%20golden%20design%2010%20percent%20off&image_size=square_hd',
    path: 'public/images/reward-discount.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=discount%20reward%20voucher%20gift%20card%20style%20golden%20design%2020%20percent%20off&image_size=square_hd',
    path: 'public/images/reward-discount-20.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=free%20delivery%20reward%20voucher%20gift%20card%20style%20golden%20design&image_size=square_hd',
    path: 'public/images/reward-delivery.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cooking%20class%20reward%20voucher%20gift%20card%20style%20golden%20design&image_size=square_hd',
    path: 'public/images/reward-cooking-class.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=chef%20table%20experience%20reward%20voucher%20gift%20card%20style%20golden%20design&image_size=square_hd',
    path: 'public/images/reward-chefs-table.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=t%20shirt%20reward%20voucher%20gift%20card%20style%20golden%20design&image_size=square_hd',
    path: 'public/images/reward-tshirt.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=hat%20reward%20voucher%20gift%20card%20style%20golden%20design&image_size=square_hd',
    path: 'public/images/reward-hat.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cookbook%20reward%20voucher%20gift%20card%20style%20golden%20design&image_size=square_hd',
    path: 'public/images/reward-cookbook.jpg'
  },
  {
    url: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=vip%20event%20access%20reward%20voucher%20gift%20card%20style%20golden%20design&image_size=square_hd',
    path: 'public/images/reward-vip-event.jpg'
  }
];

// Function to download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${filepath}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Main function to download all images
async function downloadAllImages() {
  console.log(`Starting download of ${imagesToCreate.length} images...`);
  
  for (let i = 0; i < imagesToCreate.length; i++) {
    const { url, path: filepath } = imagesToCreate[i];
    
    try {
      console.log(`[${i + 1}/${imagesToCreate.length}] Downloading ${filepath}...`);
      await downloadImage(url, filepath);
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`✗ Failed to download ${filepath}:`, error.message);
    }
  }
  
  console.log('\n✓ Image download process completed!');
}

// Run the script
downloadAllImages().catch(console.error);