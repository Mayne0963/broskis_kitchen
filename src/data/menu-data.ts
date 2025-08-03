import type { CustomizationCategory } from "@/types"

export const categories = [
  { id: "breakfast", name: "Breakfast" },
  { id: "burgers", name: "Burgers" },
  { id: "wings", name: "Wings" },
  { id: "tacos", name: "Tacos" },
  { id: "sandwiches", name: "Sandwiches"},
  { id: "sides", name: "Sides" },
  { id: "desserts", name: "Desserts" },
  { id: "drinks", name: "Drinks" },
  { id: "infused", name: "Infused" },
]

// Infused menu offerings currently feature a few specialty items
export const infusedMenuItems = [
  {
    id: 'infused-wings',
    name: 'Infused Wings',
    description:
      'Crispy chicken wings tossed in our signature sauce and infused with a touch of premium cannabis.',
    price: 16.99,
    image:
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=infused%20wings%20crispy%20chicken%20wings%20special%20infusion&image_size=square_hd',
    category: 'wings',
    infused: true,
    dietary: { dairyFree: true, glutenFree: true, vegetarian: false, vegan: false },
  },
  {
    id: 'infused-brownie',
    name: 'Infused Chocolate Brownie',
    description:
      'Decadent chocolate brownie infused with THC and finished with edible gold flakes.',
    price: 12.99,
    image:
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Infused%20chocolate%20brownie%20rich%20chocolate%20special%20infusion%20gold%20flakes&image_size=square_hd',
    category: 'desserts',
    infused: true,
    new: true,
    dietary: { dairyFree: false, glutenFree: false, vegetarian: true, vegan: false },
  },
  {
    id: 'infused-margarita',
    name: 'Infused Luxury Margarita',
    description:
      'Premium tequila shaken with fresh lime and agave then kissed with an infused kick and a gold rim.',
    price: 15.99,
    image:
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Infused%20luxury%20margarita%20premium%20tequila%20fresh%20lime%20juice%20agave%20nectar%20special%20infusion%20gold%20rim&image_size=square_hd',
    category: 'drinks',
    infused: true,
    dietary: { dairyFree: true, glutenFree: true, vegetarian: true, vegan: true },
  },
  {
    id: 'infused-chocolate',
    name: 'Infused Luxury Chocolate Bar',
    description:
      'Silky dark chocolate bar infused with cannabis, sprinkled with sea salt and shimmering gold dust.',
    price: 18.99,
    image:
      'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Infused%20luxury%20chocolate%20bar%20premium%20dark%20chocolate%20special%20infusion%20sea%20salt%20gold%20flakes&image_size=square_hd',
    category: 'desserts',
    infused: true,
    dietary: { dairyFree: false, glutenFree: true, vegetarian: true, vegan: false },
  },
  {
    id: 'infusedtoasterstrudel',
    name: 'Infused Toaster Strudel',
    description:
      'Flaky pastry pockets filled with berry jam and drizzled with vanilla icing.',
    price: 12.99,
    image: '/images/menu-items/infused-toaster-strudel.png',
    category: 'desserts',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
]

export const menuItems = [
  // Breakfast
  {
    id: 'broskispearlsugarwaffles',
    name: 'Broskis Pearl Sugar Waffles',
    description:
      'Crisp golden waffles served with powdered sugar, warm maple syrup and whipped butter on the side.',
    price: 12.99,
    image: '/images/menu-items/broskis-pearl-sugar-waffles.png',
    category: 'breakfast',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: true, vegan: false },
  },
  {
    id: 'sweetpotatoepancakes',
    name: 'Sweet Potato Pancakes',
    description:
      'Fluffy pancakes made with mashed sweet potatoes and warm spices.',
    price: 12.99,
    image: '/images/menu-items/sweet-potato-pancakes.png',
    category: 'breakfast',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: true, vegan: false },
  },

  // Burgers
  {
    id: 'veggieburgerdeluxe',
    name: 'Veggie Burger Deluxe',
    description:
      'Plant-based patty topped with vegan cheese and crisp pickles on a soft brioche bun.',
    price: 12.99,
    image: '/images/menu-items/veggie-burger-deluxe.png',
    category: 'burgers',
    dietary: { dairyFree: true, glutenFree: false, vegetarian: true, vegan: true },
  },
  {
    id: 'broskissliders',
    name: 'Broskis Veggie Sliders',
    description:
      'Three mini plant-based sliders stacked with melted American cheese on toasted brioche buns.',
    price: 13.99,
    image: '/images/menu-items/broskis-sliders.png',
    category: 'burgers',
    dietary: { dairyFree: true, glutenFree: false, vegetarian: true, vegan: true },
  },
  {
    id: 'doublestackveggieburger',
    name: 'Double Stack Veggie Burger',
    description:
      'Two plant-based patties layered with melted American cheese and our signature special sauce.',
    price: 12.99,
    image: '/images/menu-items/double-stack-veggie-burger.png',
    category: 'burgers',
    dietary: { dairyFree: true, glutenFree: false, vegetarian: true, vegan: true },
  },

  // Wings
  {
    id: 'boosiegoldwings',
    name: 'Boosie Gold Wings',
    description:
      'Crispy fried wings coated in our signature honey-gold sauce with a sprinkle of sesame seeds.',
    price: 12.99,
    image: '/images/menu-items/boosie-gold-wings.png',
    category: 'wings',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'smokedfriedwings',
    name: 'Smoked Fried Wings',
    description:
      'Crispy wings drenched in our fiery house-made red hot sauce.',
    price: 12.99,
    image: '/images/menu-items/smoked-fried-wings.png',
    category: 'wings',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'sexyyredwings',
    name: 'Sexyy Red Wings',
    description:
      'Spicy wings coated in our signature bright red hot sauce.',
    price: 12.99,
    image: '/images/menu-items/sexyy-red-wings.png',
    category: 'wings',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },

  // Tacos
  {
    id: 'birriatacos',
    name: 'Birria Tacos',
    description:
      'Slow-braised beef tucked in soft tortillas with melted cheese and a side of savory consommé.',
    price: 12.99,
    image: '/images/menu-items/birria-tacos.png',
    category: 'tacos',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },

  // Sandwiches
  {
    id: 'broskisdog',
    name: 'Broskis Dog',
    description:
      'Grilled all-beef hot dog piled high with onions, relish and classic yellow mustard.',
    price: 12.99,
    image: '/images/menu-items/broskis-dog.png',
    category: 'sandwiches',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'wildcaughtcodsandwich',
    name: 'Wild Caught Cod Sandwich',
    description:
      'Crispy fried chicken breast with tangy pickles and our signature sauce on a toasted bun.',
    price: 12.99,
    image: '/images/menu-items/wild-caught-cod-sandwich.png',
    category: 'sandwiches',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'ribs',
    name: 'Rib Plate',
    description:
      'Slow-cooked pork ribs glazed in smoky barbecue sauce.',
    price: 12.99,
    image: '/images/menu-items/ribs-plate.png',
    category: 'sandwiches',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'salmon',
    name: 'Salmon Plate',
    description:
      'Grilled salmon fillet finished with a bright lemon-herb marinade.',
    price: 12.99,
    image: '/images/menu-items/salmon-plate.png',
    category: 'sandwiches',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'meatloafplate',
    name: 'Meatloaf Plate',
    description:
      'Home-style meatloaf topped with rich brown gravy and served with mashed potatoes.',
    price: 14.99,
    image: '/images/menu-items/meatloaf-plate.png',
    category: 'sandwiches',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },

  // Sides
  {
    id: 'steamfriedcabbage',
    name: 'Steam Fried Cabbage',
    description:
      'Seasoned cabbage sautéed with onions until tender and packed with flavor.',
    price: 12.99,
    image: '/images/menu-items/steam-fried-cabbage.png',
    category: 'sides',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'cornonthecob',
    name: 'Smoked Corn On The Cob',
    description:
      'Sweet corn brushed with garlic butter then grilled to smoky perfection.',
    price: 12.99,
    image: '/images/menu-items/smoked-corn-on-the-cob.png',
    category: 'sides',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'boosietenders',
    name: 'Boosie Powder Tenders',
    description:
      'Crispy chicken tenders tossed in a zesty lemon pepper seasoning.',
    price: 12.99,
    image: '/images/menu-items/boosie-powder-chicken-tenders.png',
    category: 'sides',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'macncheese',
    name: 'Mac N Cheese',
    description:
      'Classic elbow macaroni baked in a creamy cheddar cheese sauce.',
    price: 12.99,
    image: '/images/menu-items/mac-n-cheese.png',
    category: 'sides',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'nachos',
    name: 'Nachos',
    description:
      'House tortilla chips smothered in queso, jalapeños and fresh pico de gallo.',
    price: 12.99,
    image: '/images/menu-items/nachos.png',
    category: 'sides',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'salmonbites',
    name: 'Salmon Bites',
    description:
      'Bite-size salmon pieces fried crisp and served with tangy dipping sauce.',
    price: 12.99,
    image: '/images/menu-items/salmon-bites.png',
    category: 'sides',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'shrimpngrits',
    name: 'Shrimp N Grits',
    description:
      'Creamy cheddar grits topped with seasoned shrimp and scallions.',
    price: 12.99,
    image: '/images/menu-items/ShrimpNGrits.png',
    category: 'sides',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'sweetpotatoes',
    name: 'Sweet Potatoes',
    description:
      'Roasted sweet potato wedges tossed with brown sugar and butter.',
    price: 12.99,
    image: '/images/menu-items/SweetPotatoes.png',
    category: 'sides',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'broskishousesalad',
    name: 'Broskis House Salad',
    description:
      'Fresh mixed greens topped with cherry tomatoes, cucumber, red onions and your choice of dressing.',
    price: 9.99,
    image: '/images/menu-items/BroskisHouseSalad.png',
    category: 'sides',
    dietary: { dairyFree: true, glutenFree: true, vegetarian: true, vegan: true },
  },
  {
    id: 'alfredo',
    name: 'Fettuccine Alfredo',
    description:
      'Fettuccine pasta tossed in a rich and creamy parmesan alfredo sauce.',
    price: 13.99,
    image: '/images/menu-items/Alfredo.png',
    category: 'sides',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: true, vegan: false },
  },

  // Desserts
  {
    id: 'broskiscake',
    name: 'Broskis Cake',
    description:
      "A sinfully delicious warm chocolate cake with an irresistibly gooey molten center, drizzled with luxurious dark chocolate ganache and dusted with gold-flecked powdered sugar. So good it will make your knees weak.",
    price: 12.99,
    image: '/images/menu-items/BroskisCake.png',
    category: 'desserts',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'cheesecakebites',
    name: 'Cheesecake Bites',
    description:
      'Bite-size pieces of creamy cheesecake rolled in sweet graham cracker crumbs.',
    price: 12.99,
    image: '/images/menu-items/CheesecakeBites.png',
    category: 'desserts',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'cheesecakecones',
    name: 'Cheesecake Cones',
    description:
      'Crispy waffle cones overflowing with smooth cheesecake filling and fresh fruit.',
    price: 12.99,
    image: '/images/menu-items/CheesecakeCones.png',
    category: 'desserts',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'chocolatecchipcookies',
    name: 'Broskis Chocolate Chip Cookies',
    description:
      'Chewy double-chocolate cookies loaded with dark chocolate chunks.',
    price: 12.99,
    image: '/images/menu-items/BroskisChocolateCookies.png',
    category: 'desserts',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },


  // Drinks
  {
    id: 'boosiepunch',
    name: 'Boosie Punch',
    description:
      'Refreshing tropical fruit punch with bright citrus flavors and a signature kick.',
    price: 12.99,
    image: '/images/menu-items/BoosiePunch.png',
    category: 'drinks',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
  {
    id: 'broskissweettea',
    name: 'Broskis Sweet Tea',
    description:
      'Classic Southern sweet tea brewed fresh each day and served over ice.',
    price: 12.99,
    image: '/images/menu-items/BroskisTea.png',
    category: 'drinks',
    dietary: { dairyFree: false, glutenFree: false, vegetarian: false, vegan: false },
  },
] 

export const customizationOptions: { [key: string]: CustomizationCategory[] } = {
  breakfast: [
    {
      id: "eggs",
      name: "Egg Style",
      required: false,
      multiple: false,
      options: [
        { id: "scrambled", name: "Scrambled", price: 0 },
        { id: "over-easy", name: "Over Easy", price: 0 },
        { id: "over-medium", name: "Over Medium", price: 0 },
        { id: "over-hard", name: "Over Hard", price: 0 },
        { id: "poached", name: "Poached", price: 0 },
      ],
    },
    {
      id: "protein",
      name: "Protein Choice",
      required: false,
      multiple: false,
      options: [
        { id: "beyond-sausage", name: "Beyond Sausage", price: 2.99 },
        { id: "tempeh-bacon", name: "Tempeh Bacon", price: 2.99 },
        { id: "tofu-scramble", name: "Tofu Scramble", price: 2.99 },
      ],
    },
    {
      id: "extras",
      name: "Extras",
      required: false,
      multiple: true,
      options: [
        { id: "avocado", name: "Avocado", price: 1.99 },
        { id: "vegan-cheese", name: "Vegan Cheese", price: 1.49 },
        { id: "extra-toast", name: "Extra Toast", price: 0.99 },
        { id: "fruit", name: "Fresh Fruit", price: 2.99 },
      ],
    },
  ],
  burgers: [
    {
      id: "patty-type",
      name: "Patty Type",
      required: true,
      multiple: false,
      options: [
        { id: "beef", name: "Premium Beef", price: 0 },
        { id: "wagyu", name: "Wagyu Beef", price: 5.99 },
        { id: "beyond", name: "Beyond Meat", price: 2.99 },
      ],
    },
    {
      id: "toppings",
      name: "Extra Toppings",
      required: false,
      multiple: true,
      options: [
        { id: "bacon", name: "Bacon", price: 1.99 },
        { id: "avocado", name: "Avocado", price: 1.99 },
        { id: "egg", name: "Fried Egg", price: 1.49 },
        { id: "cheese", name: "Extra Cheese", price: 0.99 },
        { id: "caramelized-onions", name: "Caramelized Onions", price: 0.99 },
      ],
    },
    {
      id: "sauces",
      name: "Sauces",
      required: false,
      multiple: true,
      options: [
        { id: "truffle-aioli", name: "Truffle Aioli", price: 0 },
        { id: "spicy-mayo", name: "Spicy Mayo", price: 0 },
        { id: "bbq", name: "BBQ Sauce", price: 0 },
        { id: "ranch", name: "Ranch", price: 0 },
      ],
    },
  ],
  tacos: [
    {
      id: "protein",
      name: "Protein",
      required: true,
      multiple: false,
      options: [
        { id: "beef", name: "Beef", price: 0 },
        { id: "chicken", name: "Chicken", price: 0 },
        { id: "shrimp", name: "Shrimp", price: 2.99 },
        { id: "fish", name: "Fish", price: 1.99 },
        { id: "veggie", name: "Vegetarian", price: 0 },
      ],
    },
    {
      id: "toppings",
      name: "Extra Toppings",
      required: false,
      multiple: true,
      options: [
        { id: "guacamole", name: "Guacamole", price: 1.99 },
        { id: "queso", name: "Queso", price: 1.49 },
        { id: "pico", name: "Extra Pico de Gallo", price: 0.99 },
        { id: "jalapenos", name: "Jalapeños", price: 0.49 },
      ],
    },
    {
      id: "spice-level",
      name: "Spice Level",
      required: false,
      multiple: false,
      options: [
        { id: "mild", name: "Mild", price: 0 },
        { id: "medium", name: "Medium", price: 0 },
        { id: "hot", name: "Hot", price: 0 },
        { id: "extra-hot", name: "Extra Hot", price: 0 },
      ],
    },
  ],
  wings: [
    {
      id: "sauce",
      name: "Sauce",
      required: true,
      multiple: false,
      options: [
        { id: "buffalo", name: "Buffalo", price: 0 },
        { id: "bbq", name: "BBQ", price: 0 },
        { id: "honey-garlic", name: "Honey Garlic", price: 0 },
        { id: "lemon-pepper", name: "Lemon Pepper", price: 0 },
        { id: "korean-gochujang", name: "Korean Gochujang", price: 0 },
      ],
    },
    {
      id: "spice-level",
      name: "Spice Level",
      required: false,
      multiple: false,
      options: [
        { id: "mild", name: "Mild", price: 0 },
        { id: "medium", name: "Medium", price: 0 },
        { id: "hot", name: "Hot", price: 0 },
        { id: "extra-hot", name: "Extra Hot", price: 0 },
      ],
    },
    {
      id: "extras",
      name: "Extras",
      required: false,
      multiple: true,
      options: [
        { id: "ranch", name: "Ranch Dip", price: 0.99 },
        { id: "blue-cheese", name: "Blue Cheese Dip", price: 0.99 },
        { id: "celery", name: "Celery Sticks", price: 0.99 },
        { id: "carrots", name: "Carrot Sticks", price: 0.99 },
      ],
    },
  ],
  sides: [
    {
      id: "size",
      name: "Size",
      required: true,
      multiple: false,
      options: [
        { id: "regular", name: "Regular", price: 0 },
        { id: "large", name: "Large", price: 2.99 },
      ],
    },
    {
      id: "extras",
      name: "Extras",
      required: false,
      multiple: true,
      options: [
        { id: "cheese", name: "Extra Cheese", price: 1.99 },
        { id: "bacon", name: "Bacon Bits", price: 1.99 },
        { id: "truffle", name: "Truffle Oil", price: 2.99 },
        { id: "garlic", name: "Garlic", price: 0.99 },
      ],
    },
  ],
  sandwiches: [
    {
      id: "bread",
      name: "Bread Type",
      required: true,
      multiple: false,
      options: [
        { id: "artisan", name: "Artisan", price: 0 },
        { id: "ciabatta", name: "Ciabatta", price: 0 },
        { id: "sourdough", name: "Sourdough", price: 0 },
        { id: "gluten-free", name: "Gluten-Free", price: 1.99 },
      ],
    },
    {
      id: "toppings",
      name: "Extra Toppings",
      required: false,
      multiple: true,
      options: [
        { id: "bacon", name: "Bacon", price: 1.99 },
        { id: "avocado", name: "Avocado", price: 1.99 },
        { id: "cheese", name: "Extra Cheese", price: 0.99 },
        { id: "caramelized-onions", name: "Caramelized Onions", price: 0.99 },
      ],
    },
    {
      id: "sides",
      name: "Side",
      required: false,
      multiple: false,
      options: [
        { id: "fries", name: "Fries", price: 2.99 },
        { id: "salad", name: "Side Salad", price: 3.99 },
        { id: "chips", name: "Chips", price: 1.99 },
      ],
    },
  ],
  desserts: [
    {
      id: "size",
      name: "Size",
      required: true,
      multiple: false,
      options: [
        { id: "regular", name: "Regular", price: 0 },
        { id: "large", name: "Large", price: 2.99 },
      ],
    },
    {
      id: "toppings",
      name: "Toppings",
      required: false,
      multiple: true,
      options: [
        { id: "whipped-cream", name: "Whipped Cream", price: 0.99 },
        { id: "chocolate-sauce", name: "Chocolate Sauce", price: 0.99 },
        { id: "caramel", name: "Caramel", price: 0.99 },
        { id: "berries", name: "Fresh Berries", price: 1.99 },
        { id: "gold-leaf", name: "Gold Leaf", price: 4.99 },
      ],
    },
  ],
  drinks: [
    {
      id: "size",
      name: "Size",
      required: true,
      multiple: false,
      options: [
        { id: "regular", name: "Regular", price: 0 },
        { id: "large", name: "Large", price: 1.99 },
      ],
    },
    {
      id: "ice",
      name: "Ice",
      required: false,
      multiple: false,
      options: [
        { id: "normal", name: "Normal Ice", price: 0 },
        { id: "light", name: "Light Ice", price: 0 },
        { id: "no-ice", name: "No Ice", price: 0 },
      ],
    },
    {
      id: "extras",
      name: "Extras",
      required: false,
      multiple: true,
      options: [
        { id: "boba", name: "Boba Pearls", price: 1.99 },
        { id: "whipped-cream", name: "Whipped Cream", price: 0.99 },
        { id: "extra-shot", name: "Extra Espresso Shot", price: 1.49 },
      ],
    },
  ],
  infused: [
    {
      id: "potency",
      name: "Potency",
      required: true,
      multiple: false,
      options: [
        { id: "mild", name: "Mild (5mg)", price: 0 },
        { id: "medium", name: "Medium (10mg)", price: 2.99 },
        { id: "strong", name: "Strong (15mg)", price: 4.99 },
      ],
    },
    // Temporarily disable cook type selection
    // {
    //   id: "type",
    //   name: "Type",
    //   required: false,
    //   multiple: false,
    //   options: [
    //     { id: "sativa", name: "Sativa Dominant", price: 0 },
    //     { id: "indica", name: "Indica Dominant", price: 0 },
    //     { id: "hybrid", name: "Hybrid", price: 0 },
    //   ],
    // },
  ],
}

// Update the menuItems export to include a function to get customization options
export const getItemCustomizationOptions = (item: { category: string }) => {
  return customizationOptions[item.category] || []
}