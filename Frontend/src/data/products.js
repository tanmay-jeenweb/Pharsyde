// Curated Product Catalogue for Pharsyde
// Compliant with Canadian Cannabis & Lifestyle Regulations

export const CANNABIS_CATEGORIES = [
  "All",
  "Dried Flower",
  "Cartridges",
  "Disposable Vapes",
  "Pre-Rolls",
  "Edibles",
  "Extracts",
  "Concentrates",
  "CBD Blends",
  "Cannabis Seeds",
  "Accessories"
];

export const NICOTINE_CATEGORIES = [
  "All",
  "Disposable Vapes",
  "Closed Pod Systems",
  "Salt Nic e-Liquid",
  "Vape Hardware & Devices",
  "Replacement Coils & Pods"
];

export const STRAIN_TYPES = ["All", "Indica", "Sativa", "Hybrid", "CBD Blend"];

export const PRODUCTS = [
  // 1. Dried Flower
  {
    id: "flower-01",
    name: "Animal Face Craft Reserve",
    brand: "Carmel",
    category: "Dried Flower",
    strainType: "Sativa",
    price: 46.99,
    thc: "29.4%",
    cbd: "<0.1%",
    terpenes: "3.8% (Myrcene, Caryophyllene, Limonene)",
    weight: "3.5g",
    variants: [
      { id: "v1", label: "3.5g Tin", price: 46.99, inStock: true },
      { id: "v2", label: "7g Glass Jar", price: 86.99, inStock: true },
      { id: "v3", label: "14g Craft Pouch", price: 154.99, inStock: false }
    ],
    inStock: true,
    badge: "STAFF PICK",
    isBestSeller: true,
    rating: 4.9,
    ratingCount: 38,
    image: "https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80"
    ],
    description: "An ultra-premium whole flower release slow-cured for 21 days and hand-trimmed to absolute perfection. Animal Face delivers deep gas notes accented by bright citrus rind and pine terpenes.",
    lineage: "Face Off OG x Animal Mints",
    effects: ["Euphoric", "Creative", "Focused"],
    aroma: ["Pungent Diesel", "Sweet Pine", "Crushed Lemon"]
  },
  {
    id: "flower-02",
    name: "Gelato 33 Small Batch",
    brand: "Pharsyde Reserve",
    category: "Dried Flower",
    strainType: "Hybrid",
    price: 44.50,
    thc: "27.8%",
    cbd: "<0.05%",
    terpenes: "3.2% (Linalool, Caryophyllene)",
    weight: "3.5g",
    variants: [
      { id: "v1", label: "3.5g Jar", price: 44.50, inStock: true },
      { id: "v2", label: "7g Jar", price: 82.00, inStock: true }
    ],
    inStock: true,
    badge: "CRAFT RESERVE",
    isBestSeller: true,
    rating: 4.8,
    ratingCount: 42,
    image: "https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Renowned purple-hued buds densely coated in frosty resin trichomes. Provides a harmonious balance of physical ease and mental clarity with dessert-sweet undertones.",
    lineage: "Sunset Sherbet x Thin Mint GSC",
    effects: ["Balanced", "Uplifting", "Relaxed"],
    aroma: ["Sweet Sherbet", "Creamy Vanilla", "Earth"]
  },
  {
    id: "flower-03",
    name: "Comatose Kush Indica",
    brand: "1964 Organic",
    category: "Dried Flower",
    strainType: "Indica",
    price: 41.99,
    thc: "31.2%",
    cbd: "<0.1%",
    terpenes: "4.1% (Caryophyllene, Myrcene, Humulene)",
    weight: "3.5g",
    variants: [
      { id: "v1", label: "3.5g", price: 41.99, inStock: true },
      { id: "v2", label: "14g Bag", price: 139.99, inStock: true }
    ],
    inStock: true,
    badge: "HIGH POTENCY",
    isBestSeller: true,
    rating: 4.9,
    ratingCount: 56,
    image: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Organic soil-grown heavy indica cultivar prized for deep nighttime unwinding. Heavy notes of damp forest, fuel, and cracked pepper.",
    lineage: "OG Kush Heritage",
    effects: ["Deep Rest", "Sedative", "Body Melt"],
    aroma: ["Dank Fuel", "Black Pepper", "Cedar Wood"]
  },
  {
    id: "flower-04",
    name: "Moonlight Lavender CBD",
    brand: "Pharsyde Botanicals",
    category: "CBD Blends",
    strainType: "CBD Blend",
    price: 36.00,
    thc: "1.2%",
    cbd: "16.4%",
    terpenes: "2.9% (Linalool, Bisabolol)",
    weight: "3.5g",
    variants: [
      { id: "v1", label: "3.5g Jar", price: 36.00, inStock: true },
      { id: "v2", label: "7g Pouch", price: 65.00, inStock: true }
    ],
    inStock: true,
    badge: "CALM BLEND",
    isBestSeller: false,
    rating: 4.7,
    ratingCount: 19,
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Designed for effortless calm without intoxication. Soft notes of French lavender blossoms and green tea, perfect for daytime mindfulness or evening meditation.",
    lineage: "Cannatonic x Harlequin",
    effects: ["Peaceful", "Clear Minded", "Restorative"],
    aroma: ["Wild Lavender", "Chamomile", "Fresh Moss"]
  },

  // 2. Cartridges
  {
    id: "cart-01",
    name: "Galactic Runtz Live Resin 510",
    brand: "Tribal",
    category: "Cartridges",
    strainType: "Indica",
    price: 39.50,
    thc: "82.5%",
    cbd: "<0.5%",
    terpenes: "7.9% Live Terpenes",
    weight: "1.0g",
    variants: [
      { id: "v1", label: "1.0g Thread 510", price: 39.50, inStock: true }
    ],
    inStock: true,
    badge: "BESTSELLER",
    isBestSeller: true,
    rating: 4.9,
    ratingCount: 84,
    image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Extracted from flash-frozen whole flower without chemical distillation. Pure cryogenic hydrocarbon extraction preserves exotic fruit candy and fuel nuances.",
    lineage: "Falcon 9 x Runtz",
    effects: ["Calm", "Dreamy", "Sensory Elevation"],
    aroma: ["Tropical Candy", "Sweet Gasoline", "Tart Berries"]
  },
  {
    id: "cart-02",
    name: "Tiger Cake Full Spectrum 510",
    brand: "Pharsyde Reserve",
    category: "Cartridges",
    strainType: "Hybrid",
    price: 42.00,
    thc: "78.4%",
    cbd: "1.8%",
    terpenes: "6.4% Natural Terpenes",
    weight: "1.0g",
    variants: [
      { id: "v1", label: "1.0g Ceramic Cartridge", price: 42.00, inStock: true }
    ],
    inStock: true,
    badge: "NEW RELEASE",
    isBestSeller: false,
    rating: 4.8,
    ratingCount: 15,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Full spectrum oil in medical-grade ceramic core hardware. Rich pastry crust aromas complemented by zesty lemon custard notes.",
    lineage: "Layer Cake x The Menthol",
    effects: ["Joyful", "Smooth Relax", "Creative"],
    aroma: ["Warm Vanilla", "Lemon Zest", "Dank Dough"]
  },

  // 3. Disposable Vapes
  {
    id: "disp-01",
    name: "Electric Blue All-In-One Vaporizer",
    brand: "Pharsyde Labs",
    category: "Disposable Vapes",
    strainType: "Sativa",
    price: 48.00,
    thc: "85.0%",
    cbd: "0.2%",
    terpenes: "5.5% Terpene Rich",
    weight: "1.0g",
    variants: [
      { id: "v1", label: "1.0g Rechargeable Device", price: 48.00, inStock: true }
    ],
    inStock: true,
    badge: "EXCLUSIVE",
    isBestSeller: true,
    rating: 4.9,
    ratingCount: 61,
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Sleek aerospace-grade aluminum chassis with USB-C rechargeability, dual ceramic heating elements, and instant button-less draw activation. Delivers vibrant electric blueberry and mint punch.",
    lineage: "Blue Dream x Super Silver Haze",
    effects: ["Energizing", "Euphoric", "Social"],
    aroma: ["Electric Blueberry", "Mint Frost", "Floral Citrus"]
  },
  {
    id: "disp-02",
    name: "Sunset Coral Live Rosin Vaporizer",
    brand: "Pharsyde Labs",
    category: "Disposable Vapes",
    strainType: "Hybrid",
    price: 54.00,
    thc: "79.2%",
    cbd: "0.8%",
    terpenes: "8.1% Solventless Rosin",
    weight: "1.0g",
    variants: [
      { id: "v1", label: "1.0g Type-C Rosin Pen", price: 54.00, inStock: true }
    ],
    inStock: true,
    badge: "SOLVENTLESS",
    isBestSeller: false,
    rating: 5.0,
    ratingCount: 29,
    image: "https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Solventless live rosin extracted using solely pure ice water, gentle heat, and pneumatic pressure. Authentic flower taste without additives or cutting agents.",
    lineage: "Papaya x Mimosa",
    effects: ["Mellow", "Sensory Rich", "Serene"],
    aroma: ["Ripe Papaya", "Blood Orange", "Sweet Resin"]
  },

  // 4. Edibles
  {
    id: "edible-01",
    name: "Yuzu & Blood Orange Artisan Gummies",
    brand: "Pharsyde Confections",
    category: "Edibles",
    strainType: "Hybrid",
    price: 11.99,
    thc: "10mg (2 x 5mg)",
    cbd: "10mg (2 x 5mg)",
    terpenes: "Botanical Infusion",
    weight: "2-pack",
    variants: [
      { id: "v1", label: "2 Pack (10mg Total)", price: 11.99, inStock: true },
      { id: "v2", label: "4 Pack (20mg Total / Medical)", price: 21.99, inStock: false }
    ],
    inStock: true,
    badge: "ORGANIC PECTIN",
    isBestSeller: true,
    rating: 4.8,
    ratingCount: 73,
    image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Crafted with Japanese yuzu purée and Sicilian blood orange nectar. Fast-acting nano-emulsified cannabinoid formulation for consistent, predictable onset within 15-20 minutes.",
    lineage: "Full Spectrum Distillate",
    effects: ["Gentle Waves", "Social Cheer", "Relaxing"],
    aroma: ["Bright Yuzu", "Tart Orange", "Cane Sugar"]
  },
  {
    id: "edible-02",
    name: "Midnight Blackberry CBN Drops",
    brand: "Pharsyde Confections",
    category: "Edibles",
    strainType: "Indica",
    price: 13.50,
    thc: "10mg THC + 10mg CBN",
    cbd: "5mg CBD",
    terpenes: "Sleep Terpene Complex",
    weight: "2-pack",
    variants: [
      { id: "v1", label: "2 Chews", price: 13.50, inStock: true }
    ],
    inStock: true,
    badge: "SLEEP RITUAL",
    isBestSeller: true,
    rating: 4.9,
    ratingCount: 92,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Formulated specifically for evening restoration with synergized CBN, THC, and micro-dosed CBD in a luscious wild blackberry reduction.",
    lineage: "Broad Spectrum + CBN Isolate",
    effects: ["Deep Sleep", "Night Rest", "Tension Release"],
    aroma: ["Ripe Blackberry", "Vanilla Bean", "Botanical Herbs"]
  },

  // 5. Extracts & Concentrates
  {
    id: "ext-01",
    name: "Diamonds & Sauce Live Terp Caviar",
    brand: "Pharsyde Reserve",
    category: "Concentrates",
    strainType: "Hybrid",
    price: 52.00,
    thc: "88.6%",
    cbd: "<0.5%",
    terpenes: "9.2% Pure Terpene Sauce",
    weight: "1.0g",
    variants: [
      { id: "v1", label: "1.0g Ultra-Jar", price: 52.00, inStock: true }
    ],
    inStock: true,
    badge: "DIAMOND GRADE",
    isBestSeller: true,
    rating: 5.0,
    ratingCount: 31,
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Pure crystallized THCA facets bathed in high-terpene liquid fraction. Unrivalled aromatic depth engineered for low-temperature vaporization.",
    lineage: "Chem de la Chem x Triangle Kush",
    effects: ["Instant Euphoria", "Elevated Senses", "Deep Relief"],
    aroma: ["Gasoline Funk", "Pine Sol", "Sour Chemical"]
  },
  {
    id: "ext-02",
    name: "Cold Cure Live Rosin Badder",
    brand: "Pharsyde Labs",
    category: "Extracts",
    strainType: "Indica",
    price: 64.00,
    thc: "76.8%",
    cbd: "1.1%",
    terpenes: "8.7% (Caryophyllene, Linalool)",
    weight: "1.0g",
    variants: [
      { id: "v1", label: "1.0g Miron Glass Jar", price: 64.00, inStock: true }
    ],
    inStock: true,
    badge: "100% SOLVENTLESS",
    isBestSeller: false,
    rating: 4.9,
    ratingCount: 22,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
    ],
    description: "First-wash hash rosin whip cured cold over 14 days to achieve a silken butter consistency. Unmatched purity, terpene retention, and velvet smoothness.",
    lineage: "GMO Cookies x Zkittlez",
    effects: ["Couch Lock", "Total Peace", "Sensory Rich"],
    aroma: ["Garlic Diesel", "Tropical Fruit", "Earthy Sweet"]
  },

  // 6. Cannabis Seeds
  {
    id: "seed-01",
    name: "Northern Lights x Haze Feminized Seeds",
    brand: "Pharsyde Genetics",
    category: "Cannabis Seeds",
    strainType: "Hybrid",
    price: 49.99,
    thc: "Genetic potential 24-28%",
    cbd: "Low (<1%)",
    terpenes: "Rich Genetic Profile",
    weight: "4 Seeds",
    variants: [
      { id: "v1", label: "4-Seed Pack", price: 49.99, inStock: true }
    ],
    inStock: true,
    badge: "FEMINIZED",
    isBestSeller: false,
    rating: 4.7,
    ratingCount: 14,
    image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Heritage breeding lineage packaged for home cultivation enthusiasts. High germination rate, vigorous flowering structure, and heavy trichome development.",
    lineage: "Northern Lights #5 x Original Haze",
    effects: ["Growth Potential", "Heritage"],
    aroma: ["Spicy Incense", "Earthy Pine"]
  },

  // 7. Accessories
  {
    id: "acc-01",
    name: "Obsidian Precision Herb Grinder",
    brand: "Pharsyde Lifestyle",
    category: "Accessories",
    strainType: "All",
    price: 65.00,
    thc: "N/A",
    cbd: "N/A",
    terpenes: "N/A",
    weight: "63mm Diameter",
    variants: [
      { id: "v1", label: "Matte Abyss Black (63mm)", price: 65.00, inStock: true },
      { id: "v2", label: "Electric Blue Edition", price: 69.00, inStock: true }
    ],
    inStock: true,
    badge: "LIFETIME DESIGN",
    isBestSeller: true,
    rating: 5.0,
    ratingCount: 47,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
    ],
    description: "CNC-machined from single-billet aerospace 6061-T6 aluminum. Diamond-curved teeth deliver a fluffy, uniform consistency designed for even vaporization.",
    lineage: "Engineered in Canada",
    effects: ["Precision Prep", "Smooth Grind"],
    aroma: ["N/A"]
  },
  {
    id: "acc-02",
    name: "Borosilicate Minimalist Bubbler",
    brand: "Pharsyde Lifestyle",
    category: "Accessories",
    strainType: "All",
    price: 89.00,
    thc: "N/A",
    cbd: "N/A",
    terpenes: "N/A",
    weight: "220g",
    variants: [
      { id: "v1", label: "Smoked Grey Glass", price: 89.00, inStock: true },
      { id: "v2", label: "Clear Cobalt Tint", price: 89.00, inStock: true }
    ],
    inStock: true,
    badge: "HAND BLOWN",
    isBestSeller: false,
    rating: 4.8,
    ratingCount: 28,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Sculptural hand-blown laboratory-grade borosilicate water pipe with integrated matrix percolator for ultra-cooled, velvety smooth inhalation.",
    lineage: "Artisan Glasswork",
    effects: ["Hydrated Inhalation", "Cool Draw"],
    aroma: ["N/A"]
  },

  // 8. Nicotine Vape Products
  {
    id: "nic-01",
    name: "STLTH Loop 2 Device Kit",
    brand: "STLTH",
    category: "Nicotine Hardware",
    nicotineType: true,
    price: 19.99,
    strength: "Hardware Device (850mAh)",
    flavor: "Matte Charcoal / Electric Glow",
    weight: "Rechargeable",
    variants: [
      { id: "v1", label: "Matte Charcoal", price: 19.99, inStock: true },
      { id: "v2", label: "Electric Cyan", price: 19.99, inStock: true }
    ],
    inStock: true,
    badge: "19+ LEGAL",
    isBestSeller: true,
    rating: 4.8,
    ratingCount: 65,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Next-generation closed-loop pod battery featuring LED battery indicator, USB-C quick recharge, and child-resistant locking mechanism. Designed strictly for adult smokers.",
    effects: ["Device Only", "Nicotine Hardware"],
    aroma: ["Hardware Only"]
  },
  {
    id: "nic-02",
    name: "Vice Twist 10K Disposable",
    brand: "Vice",
    category: "Disposable Vapes",
    nicotineType: true,
    price: 27.99,
    strength: "20 mg/mL Nicotine Salt",
    flavor: "Iced Blue Raspberry",
    weight: "10,000 Puffs (18ml)",
    variants: [
      { id: "v1", label: "Single 10k Device (20mg)", price: 27.99, inStock: true }
    ],
    inStock: true,
    badge: "HIGH CAPACITY",
    isBestSeller: true,
    rating: 4.9,
    ratingCount: 88,
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Adjustable airflow dial with dual mesh coil technology and real-time smart screen displaying battery and e-liquid percentage. 20mg/mL federal legal limit.",
    effects: ["Adult Nicotine Consumer Use Only"],
    aroma: ["Crisp Blue Raspberry", "Arctic Ice"]
  },
  {
    id: "nic-03",
    name: "Oxbar Icewave Coral Mint 8K",
    brand: "Oxbar",
    category: "Disposable Vapes",
    nicotineType: true,
    price: 24.99,
    strength: "20 mg/mL Nicotine Salt",
    flavor: "Coral Tangerine Mint",
    weight: "8,000 Puffs (16ml)",
    variants: [
      { id: "v1", label: "Single 8K Device (20mg)", price: 24.99, inStock: true }
    ],
    inStock: true,
    badge: "19+ RESTRICTED",
    isBestSeller: false,
    rating: 4.7,
    ratingCount: 39,
    image: "https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1559825481-12a05cc00344?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Curved ergonomic shell with ultra-fast firing chip and clear cyber casing. Notes of sweet sun-drenched tangerine finished with a frosty spearmint breeze.",
    effects: ["Adult Nicotine Consumer Use Only"],
    aroma: ["Sweet Tangerine", "Fresh Mint"]
  },
  {
    id: "nic-04",
    name: "STLTH Loop Pod 2-Pack Blue Chill",
    brand: "STLTH",
    category: "Closed Pod Systems",
    nicotineType: true,
    price: 21.99,
    strength: "20 mg/mL Nicotine Salt",
    flavor: "Blueberry Chill",
    weight: "2 x 10ml Pods",
    variants: [
      { id: "v1", label: "2-Pack (20mg)", price: 21.99, inStock: true }
    ],
    inStock: true,
    badge: "POD REFILL",
    isBestSeller: true,
    rating: 4.8,
    ratingCount: 52,
    image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Compatible with STLTH Loop and Loop 2 battery systems. Freshly crushed Canadian blueberries backed with a crisp menthol finish.",
    effects: ["Adult Nicotine Consumer Use Only"],
    aroma: ["Wild Blueberry", "Menthol"]
  }
];

export const STORE_INFO = {
  name: "Pharsyde Cannabis",
  address: "117 Regent Ave W, Winnipeg, MB R2C 1R1",
  phone: "(204) 222-4753",
  email: "cannabis@pharsyde.ca",
  hours: [
    { days: "Monday – Friday", time: "7:00 AM – 10:00 PM" },
    { days: "Saturday", time: "8:00 AM – 10:00 PM" },
    { days: "Sunday", time: "9:00 AM – 9:00 PM" }
  ],
  province: "Manitoba",
  legalAge: 19
};

