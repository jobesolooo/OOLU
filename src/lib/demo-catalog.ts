/**
 * OOLU catalogue, imported from ooluclothing.shop (prices in EUR cents).
 * Used to render the store before Stripe is connected, and by `npm run stripe:seed`
 * to create these products in Stripe. Once Stripe has products, they come from Stripe.
 */
export type DemoProduct = {
  slug: string;
  name: string;
  description: string;
  unitAmount: number; // cents
  compareAt?: number; // original price in cents → shows as a sale
  category: "t-shirts" | "sleeveless-and-tanks" | "tracksuits" | "hoodies";
  collection: string;
  sizes: string[];
  /** Colour options on the same product (picked on the product page) */
  colors: { name: string; hex: string }[];
  /** Colour/size combinations that exist, as "Colour / Size" (only when there are colours) */
  variants?: string[];
  /** Combinations that are sold out ("Size" or "Colour / Size") */
  soldOut: string[];
  images: string[];
  featured?: boolean;
  isNew?: boolean;
  sort: number;
  /** Products sharing a group show as colour swatches of each other */
  group?: string;
  color?: string;
  colorHex?: string;
  /** Days from now until release (demo only) → drop countdown */
  releaseInDays?: number;
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    "slug": "oolu-windbreaker-tracksuit-set-black-grey",
    "name": "OOLU Windbreaker Tracksuit Set – Black & Grey",
    "description": "The OOLU Windbreaker Tracksuit Set in black with grey side panels: a hooded zip jacket with an adjustable hood and elasticated cuffs and hem, plus matching pants with an elasticated waist and ankle drawcords. Both pieces carry the OOLU logo with a purple underline.",
    "unitAmount": 11900,
    "category": "tracksuits",
    "collection": "tracksuits",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "S",
      "M",
      "L"
    ],
    "images": [
      "/images/products/oolu-windbreaker-tracksuit-set-black-grey-1.jpg"
    ],
    "featured": false,
    "isNew": false,
    "sort": 50
  },
  {
    "slug": "oolu-hoodie-tracksuit-set-black",
    "group": "hoodie-tracksuit-set",
    "color": "Black",
    "colorHex": "#151515",
    "name": "OOLU Hoodie Tracksuit Set – Black",
    "description": "The OOLU Hoodie Tracksuit Set in black: a zip-up hoodie with a contrast zip, kangaroo pocket and ribbed cuffs, plus matching wide-leg sweatpants. Both pieces carry the white OOLU logo.",
    "unitAmount": 11900,
    "category": "tracksuits",
    "collection": "tracksuits",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "S",
      "M",
      "L"
    ],
    "images": [
      "/images/products/oolu-hoodie-tracksuit-set-black-1.jpg"
    ],
    "featured": false,
    "isNew": false,
    "sort": 51
  },
  {
    "slug": "oolu-hoodie-tracksuit-set-grey",
    "group": "hoodie-tracksuit-set",
    "color": "Grey",
    "colorHex": "#9a9ca0",
    "name": "OOLU Hoodie Tracksuit Set – Grey",
    "description": "The OOLU Hoodie Tracksuit Set in grey: a zip-up hoodie with a kangaroo pocket and ribbed cuffs, plus matching wide-leg sweatpants. Both pieces carry the OOLU logo.",
    "unitAmount": 11900,
    "category": "tracksuits",
    "collection": "tracksuits",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "S",
      "M",
      "L"
    ],
    "images": [
      "/images/products/oolu-hoodie-tracksuit-set-grey-1.jpg"
    ],
    "featured": false,
    "isNew": false,
    "sort": 52
  },
  {
    "slug": "oolu-zip-hoodie-grey",
    "name": "OOLU Zip Hoodie – Grey",
    "description": "The OOLU Zip Hoodie in grey, with a full front zip, a kangaroo pocket, ribbed cuffs and hem, and an OOLU logo print with a purple underline on the chest.",
    "unitAmount": 6000,
    "category": "hoodies",
    "collection": "hoodies",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "S",
      "M",
      "L"
    ],
    "images": [
      "/images/products/oolu-zip-hoodie-grey-1.jpg"
    ],
    "featured": false,
    "isNew": false,
    "sort": 53
  },
  {
    "slug": "oolu-gambia-edition-t-shirt",
    "name": "OOLU Gambia Edition T-Shirt",
    "description": "Wear your roots. Tell your story. The OOLU Gambia Edition T-Shirt brings identity into your everyday style. A black base pairs with a white OOLU chest logo and Gambian flag-inspired details on the sleeve and near the hem. On the back, “YOUR ROOTS. YOUR JOURNEY. YOUR STORY.” makes a statement about where you come from and the path you’re making your own. Style it with jeans, cargos or your favourite OOLU tracksuit pants. A simple look with a personal message.",
    "unitAmount": 2000,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "M",
      "S",
      "L"
    ],
    "images": [
      "/images/products/oolu-gambia-edition-t-shirt-1.jpg",
      "/images/products/oolu-gambia-edition-t-shirt-2.jpg",
      "/images/products/oolu-gambia-edition-t-shirt-3.jpg"
    ],
    "featured": false,
    "isNew": false,
    "sort": 54
  },
  {
    "slug": "oolu-cropped-t-shirt-sky-blue",
    "name": "OOLU Cropped T-Shirt – Sky Blue",
    "description": "The OOLU Cropped T-Shirt in sky blue with a black OOLU print. The Short-sleeve T-Shirt is made from 100% cotton for a comfortable, breathable feel you can wear every day. Easy to style on its own or layer with your favorite OOLU pieces, it is a clean and reliable wardrobe staple. 100% cotton Comfortable, breathable feel Easy to wear every day Simple to style on its own or layered",
    "unitAmount": 2900,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "L",
      "M"
    ],
    "images": [
      "/images/products/oolu-cropped-t-shirt-sky-blue-1.jpg",
      "/images/products/oolu-cropped-t-shirt-sky-blue-2.jpg"
    ],
    "featured": false,
    "isNew": false,
    "sort": 55
  },
  {
    "slug": "oolu-tracksuit-pants",
    "name": "OOLU Tracksuit Pants",
    "description": "The OOLU Tracksuit Pants are designed for comfortable movement from workouts to everyday wear. Their waterproof design helps protect you from wet weather while keeping you comfortable and ready to move. Lightweight and easy to wear, they bring a clean, sporty look from gym to street. Waterproof design for protection in wet weather Lightweight construction for everyday comfort Comfortable for workouts, outdoor activities, and casual wear Easy movement from gym to street Pair them with the matching OOLU tracksuit jacket for the full look Want the complete look? Shop the full OOLU tracksuit set .",
    "unitAmount": 6000,
    "category": "tracksuits",
    "collection": "tracksuits",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "L",
      "S",
      "M"
    ],
    "images": [
      "/images/products/oolu-tracksuit-pants-1.jpg",
      "/images/products/oolu-tracksuit-pants-2.jpg",
      "/images/products/oolu-tracksuit-pants-3.jpg",
      "/images/products/oolu-tracksuit-pants-4.jpg"
    ],
    "featured": false,
    "isNew": true,
    "sort": 12
  },
  {
    "slug": "oolu-tracksuit-jacket",
    "name": "OOLU Tracksuit Jacket",
    "description": "The OOLU Tracksuit Jacket is a lightweight, breathable windbreaker made for active days and easy everyday wear. Its water-resistant design helps protect you from light weather while keeping you comfortable and moving freely. Lightweight, breathable windbreaker design Water-resistant protection Comfortable for workouts, outdoor activities, and everyday wear Pair it with the matching OOLU tracksuit pants for the full look Want the complete look? Shop the full OOLU tracksuit set .",
    "unitAmount": 6000,
    "category": "tracksuits",
    "collection": "tracksuits",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "L",
      "S",
      "M"
    ],
    "images": [
      "/images/products/oolu-tracksuit-jacket-1.jpg",
      "/images/products/oolu-tracksuit-jacket-2.jpg",
      "/images/products/oolu-tracksuit-jacket-3.jpg",
      "/images/products/oolu-tracksuit-jacket-4.jpg"
    ],
    "featured": false,
    "isNew": true,
    "sort": 11
  },
  {
    "slug": "oolu-cropped-t-shirt-washed-pink",
    "name": "OOLU Cropped T-Shirt – Washed Pink",
    "description": "The OOLU Cropped T-Shirt in washed pink with the YOUR OOLU JOURNEY. print. Women's Short-Sleeve T-Shirt A clean everyday essential made from 100% cotton, with a simple short-sleeve shape that keeps your wardrobe feeling effortless. 100% cotton Short-sleeve design Easy to style with denim, trousers, or layered looks From slow mornings to everyday plans, this is the tee you can throw on and feel instantly pulled together. Keep it relaxed, tuck it in, or layer it under your favourite jacket.",
    "unitAmount": 2900,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      {
        "name": "Washed pink",
        "hex": "#e1a7b5"
      }
    ],
    "soldOut": [
      "Washed pink / S",
      "Washed pink / L"
    ],
    "images": [
      "/images/products/oolu-cropped-t-shirt-washed-pink-1.jpg",
      "/images/products/oolu-cropped-t-shirt-washed-pink-2.jpg"
    ],
    "featured": true,
    "isNew": true,
    "sort": 8,
    "variants": [
      "Washed pink / M",
      "Washed pink / S",
      "Washed pink / L"
    ]
  },
  {
    "slug": "oolu-washed-t-shirt-purple-green-gray",
    "name": "OOLU Washed T-Shirt – Purple, Green & Gray",
    "description": "The OOLU Washed T-Shirt comes in washed purple, washed green and washed gray, with an OOLU chest print and YOUR JOURNEY. on the back. Short-Sleeve T-Shirt An easy everyday essential with a clean short-sleeve silhouette. Simple to wear, easy to style, and ready to become a reliable part of your rotation. Short-sleeve design 100% cotton Available in washed purple, washed green, and washed gray Keep it casual with denim or make it part of a sharper layered look. This is the kind of piece you’ll reach for when you want effortless, no-fuss style.",
    "unitAmount": 2900,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      {
        "name": "Washed purple",
        "hex": "#9b80d3"
      },
      {
        "name": "Washed green",
        "hex": "#8ea58b"
      },
      {
        "name": "Washed gray",
        "hex": "#8e8d89"
      }
    ],
    "soldOut": [
      "Washed purple / M",
      "Washed gray / M",
      "Washed purple / S",
      "Washed green / S",
      "Washed gray / S",
      "Washed purple / L",
      "Washed green / L",
      "Washed gray / L"
    ],
    "images": [
      "/images/products/oolu-washed-t-shirt-purple-green-gray-1.jpg",
      "/images/products/oolu-washed-t-shirt-purple-green-gray-2.jpg",
      "/images/products/oolu-washed-t-shirt-purple-green-gray-3.jpg",
      "/images/products/oolu-washed-t-shirt-purple-green-gray-4.jpg",
      "/images/products/oolu-washed-t-shirt-purple-green-gray-5.jpg"
    ],
    "featured": true,
    "isNew": true,
    "sort": 4,
    "variants": [
      "Washed purple / M",
      "Washed green / M",
      "Washed gray / M",
      "Washed purple / S",
      "Washed green / S",
      "Washed gray / S",
      "Washed purple / L",
      "Washed green / L",
      "Washed gray / L"
    ]
  },
  {
    "slug": "oolu-cropped-t-shirt-pink-light-blue",
    "name": "OOLU Cropped T-Shirt – Pink & Light Blue",
    "description": "The OOLU Cropped T-Shirt comes in pink, light pink and light blue. Women's Short-Sleeve T-Shirt A clean everyday essential made from 100% cotton, with a simple short-sleeve shape that keeps your wardrobe feeling effortless. 100% cotton Short-sleeve design Easy to style with denim, trousers, or layered looks From slow mornings to everyday plans, this is the tee you can throw on and feel instantly pulled together. Keep it relaxed, tuck it in, or layer it under your favourite jacket.",
    "unitAmount": 2900,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      {
        "name": "Pink",
        "hex": "#e98bb1"
      },
      {
        "name": "Light Blue",
        "hex": "#a8c9e6"
      },
      {
        "name": "Light Pink",
        "hex": "#f1c3cf"
      }
    ],
    "soldOut": [
      "Pink / S",
      "Pink / L",
      "Light Blue / S"
    ],
    "images": [
      "/images/products/oolu-cropped-t-shirt-pink-light-blue-1.jpg",
      "/images/products/oolu-cropped-t-shirt-pink-light-blue-2.jpg",
      "/images/products/oolu-cropped-t-shirt-pink-light-blue-3.jpg"
    ],
    "featured": false,
    "isNew": true,
    "sort": 9,
    "variants": [
      "Pink / M",
      "Pink / S",
      "Pink / L",
      "Light Blue / S",
      "Light Pink / L"
    ]
  },
  {
    "slug": "oolu-t-shirt-hot-pink",
    "group": "oolu-colour-tee",
    "color": "Hot Pink",
    "colorHex": "#ff2d8a",
    "name": "OOLU T-Shirt – Hot Pink",
    "description": "The OOLU T-Shirt in hot pink, with an OOLU chest print and OOLU YOUR ROOTS. on the back. An easy everyday essential with a clean short-sleeve silhouette. Simple to wear, easy to style, and ready to become a reliable part of your rotation. Short-sleeve design 100% cotton Easy to pair with your everyday looks Available in size M Keep it casual with denim or make it part of a sharper layered look. This is the kind of piece you’ll reach for when you want effortless, no-fuss style.",
    "unitAmount": 2900,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "S",
      "L"
    ],
    "images": [
      "/images/products/oolu-t-shirt-hot-pink-1.jpg",
      "/images/products/oolu-t-shirt-hot-pink-2.jpg",
      "/images/products/oolu-t-shirt-hot-pink-3.jpg",
      "/images/products/oolu-t-shirt-hot-pink-4.jpg"
    ],
    "featured": true,
    "isNew": true,
    "sort": 5
  },
  {
    "slug": "oolu-t-shirt-coral-red",
    "group": "oolu-colour-tee",
    "color": "Coral Red",
    "colorHex": "#f0605a",
    "name": "OOLU T-Shirt – Coral Red",
    "description": "The OOLU T-Shirt in coral red, with an OOLU chest print and YOUR ROOTS. on the back. An easy everyday essential with a clean short-sleeve silhouette. Simple to wear, easy to style, and ready to become a reliable part of your rotation. Short-sleeve design 100% cotton Easy to pair with your everyday looks Keep it casual with denim or make it part of a sharper layered look. This is the kind of piece you’ll reach for when you want effortless, no-fuss style.",
    "unitAmount": 2900,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "M",
      "S",
      "L"
    ],
    "images": [
      "/images/products/oolu-t-shirt-coral-red-1.jpg",
      "/images/products/oolu-t-shirt-coral-red-2.jpg",
      "/images/products/oolu-t-shirt-coral-red-3.jpg",
      "/images/products/oolu-t-shirt-coral-red-4.jpg"
    ],
    "featured": true,
    "isNew": true,
    "sort": 3
  },
  {
    "slug": "oolu-everyday-t-shirt",
    "name": "OOLU Everyday T-Shirt – Beige, Gray, Cream & Black",
    "description": "The OOLU Everyday T-Shirt comes in beige, washed gray, cream and black. Short-Sleeve T-Shirt An easy everyday essential with a clean short-sleeve silhouette. Simple to wear, easy to style, and ready to become a reliable part of your rotation. Short-sleeve design 100% cotton Easy to pair with your everyday looks Keep it casual with denim or make it part of a sharper layered look. This is the kind of piece you’ll reach for when you want effortless, no-fuss style.",
    "unitAmount": 2900,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      {
        "name": "Beige",
        "hex": "#d6c2a4"
      },
      {
        "name": "Washed gray",
        "hex": "#8e8d89"
      },
      {
        "name": "Cream",
        "hex": "#ece3cf"
      },
      {
        "name": "Black",
        "hex": "#111111"
      }
    ],
    "soldOut": [
      "Beige / S",
      "Beige / L",
      "Washed gray / M",
      "Washed gray / S",
      "Washed gray / L",
      "Cream / S",
      "Cream / L",
      "Black / M",
      "Black / S",
      "Black / L"
    ],
    "images": [
      "/images/products/oolu-everyday-t-shirt-1.jpg",
      "/images/products/oolu-everyday-t-shirt-2.jpg",
      "/images/products/oolu-everyday-t-shirt-3.jpg",
      "/images/products/oolu-everyday-t-shirt-4.jpg",
      "/images/products/oolu-everyday-t-shirt-5.jpg"
    ],
    "featured": true,
    "isNew": true,
    "sort": 2,
    "variants": [
      "Beige / M",
      "Beige / S",
      "Beige / L",
      "Washed gray / M",
      "Washed gray / S",
      "Washed gray / L",
      "Cream / M",
      "Cream / S",
      "Cream / L",
      "Black / M",
      "Black / S",
      "Black / L"
    ]
  },
  {
    "slug": "oolu-version-2-t-shirt",
    "name": "OOLU Version 2 T-Shirt",
    "description": "A clean everyday essential made from 100% cotton, designed with OOLU’s signature graphic details and an easy, comfortable fit. 100% cotton Available in white and black Sizes S, M, and L Soft, breathable feel for everyday wear A versatile staple with a bold identity, made to be worn on repeat.",
    "unitAmount": 2599,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#111111"
      },
      {
        "name": "White",
        "hex": "#f4f4f2"
      }
    ],
    "soldOut": [
      "Black / L",
      "White / S",
      "White / M",
      "White / L"
    ],
    "images": [
      "/images/products/oolu-version-2-t-shirt-1.jpg",
      "/images/products/oolu-version-2-t-shirt-2.jpg",
      "/images/products/oolu-version-2-t-shirt-3.jpg",
      "/images/products/oolu-version-2-t-shirt-4.jpg",
      "/images/products/oolu-version-2-t-shirt-5.jpg"
    ],
    "featured": true,
    "isNew": true,
    "sort": 7,
    "variants": [
      "Black / S",
      "Black / M",
      "Black / L",
      "White / S",
      "White / M",
      "White / L"
    ]
  },
  {
    "slug": "oolu-t-shirt",
    "name": "OOLU T-Shirt",
    "description": "The OOLU T-Shirt is crafted from 100% soft cotton, made for those who carry their story with them. Featuring the signature OOLU logo on the chest and the iconic \"Your Roots. Your Journey. Your Story.\" message on the back, this tee is a statement of identity and purpose. Material: 100% Cotton Oversized relaxed fit Available in Black and White Signature OOLU branding on chest and back",
    "unitAmount": 3900,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "M"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#111111"
      },
      {
        "name": "White",
        "hex": "#f4f4f2"
      }
    ],
    "soldOut": [],
    "images": [
      "/images/products/oolu-t-shirt-1.jpg",
      "/images/products/oolu-t-shirt-2.jpg",
      "/images/products/oolu-t-shirt-3.jpg",
      "/images/products/oolu-t-shirt-4.jpg",
      "/images/products/oolu-t-shirt-5.jpg",
      "/images/products/oolu-t-shirt-6.jpg"
    ],
    "featured": true,
    "isNew": true,
    "sort": 6,
    "variants": [
      "Black / M",
      "White / M"
    ]
  },
  {
    "slug": "oolu-sleeveless-tee",
    "name": "OOLU Sleeveless Tee",
    "description": "The OOLU Sleeveless Tee is crafted from 100% soft cotton, designed for those who move with purpose. Featuring the signature OOLU logo on the chest and the bold \"Your Roots. Your Journey. Your Story.\" message on the back, this tee is more than just apparel — it's a statement. Material: 100% Cotton Sleeveless muscle tee cut Available in Black and White Signature OOLU branding",
    "unitAmount": 3900,
    "category": "sleeveless-and-tanks",
    "collection": "sleeveless-and-tanks",
    "sizes": [
      "M"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#111111"
      },
      {
        "name": "White",
        "hex": "#f4f4f2"
      }
    ],
    "soldOut": [
      "Black / M",
      "White / M"
    ],
    "images": [
      "/images/products/oolu-sleeveless-tee-1.jpg",
      "/images/products/oolu-sleeveless-tee-2.jpg",
      "/images/products/oolu-sleeveless-tee-3.jpg",
      "/images/products/oolu-sleeveless-tee-4.jpg",
      "/images/products/oolu-sleeveless-tee-5.jpg"
    ],
    "featured": false,
    "isNew": true,
    "sort": 10,
    "variants": [
      "Black / M",
      "White / M"
    ]
  },
  {
    "slug": "oolu-womens-tank-top",
    "name": "OOLU Women's Tank Top",
    "description": "Lightweight, soft, and effortlessly versatile, our Women's Tank Top is designed for all-day comfort. Made from breathable cotton with a flattering fit, it's perfect for layering, workouts, or everyday wear. A timeless wardrobe essential you'll wear season after season.",
    "unitAmount": 2500,
    "category": "sleeveless-and-tanks",
    "collection": "sleeveless-and-tanks",
    "sizes": [
      "S",
      "M"
    ],
    "colors": [],
    "soldOut": [
      "S",
      "M"
    ],
    "images": [
      "/images/products/oolu-womens-tank-top-1.jpg",
      "/images/products/oolu-womens-tank-top-2.jpg",
      "/images/products/oolu-womens-tank-top-3.jpg",
      "/images/products/oolu-womens-tank-top-4.jpg"
    ],
    "featured": false,
    "isNew": false,
    "sort": 67
  },
  {
    "slug": "oolu-mens-sleeveless-t-shirt",
    "name": "OOLU Men's Sleeveless T-Shirt",
    "description": "Designed for comfort and everyday wear, our Men's Sleeveless T-Shirt is made from soft, breathable cotton with a relaxed fit that moves with you. Perfect for workouts, warm days, or casual styling, it's a timeless essential you'll reach for again and again.",
    "unitAmount": 3500,
    "category": "sleeveless-and-tanks",
    "collection": "sleeveless-and-tanks",
    "sizes": [
      "M"
    ],
    "colors": [],
    "soldOut": [
      "M"
    ],
    "images": [
      "/images/products/oolu-mens-sleeveless-t-shirt-1.jpg",
      "/images/products/oolu-mens-sleeveless-t-shirt-2.jpg",
      "/images/products/oolu-mens-sleeveless-t-shirt-3.jpg",
      "/images/products/oolu-mens-sleeveless-t-shirt-4.jpg"
    ],
    "featured": false,
    "isNew": false,
    "sort": 68
  },
  {
    "slug": "oolu-tracksuit",
    "name": "OOLU Tracksuit Set",
    "description": "The Tracksuit Oolu combines style and functionality in one sleek ensemble. This windbreaker tracksuit features a lightweight, breathable design perfect for active days and casual wear. The jacket offers water-resistant protection, while the matching pants provide comfort and mobility. Ideal for workouts, outdoor activities, or relaxed everyday looks, this tracksuit transitions seamlessly from gym to street. Quality construction ensures durability through regular wear and washing. Prefer to buy the pieces separately? Shop the jacket only or the pants only .",
    "unitAmount": 11900,
    "category": "tracksuits",
    "collection": "tracksuits",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [],
    "soldOut": [
      "L",
      "S",
      "M"
    ],
    "images": [
      "/images/products/oolu-tracksuit-1.jpg",
      "/images/products/oolu-tracksuit-2.jpg",
      "/images/products/oolu-tracksuit-3.jpg",
      "/images/products/oolu-tracksuit-4.jpg"
    ],
    "featured": true,
    "isNew": true,
    "sort": 1
  },
  {
    "slug": "oolu-classic-cotton-t-shirt",
    "name": "OOLU Classic Cotton T-Shirt – White & Black",
    "description": "Designed for everyday comfort and effortless style, our Classic Cotton T-Shirt is made from 100% premium cotton, offering a soft, breathable feel with a premium heavyweight construction. With its high-quality craftsmanship and comfortable fit, it's a wardrobe essential that pairs perfectly with any outfit. Features: 100% premium cotton Soft, breathable, and heavyweight fabric Comfortable, flattering fit for everyday wear Pre-shrunk fabric to help maintain its shape after washing Suitable for all seasons Easy to care for and machine washable Whether you're dressing it up or keeping it casual, this versatile T-shirt delivers the perfect combination of comfort and timeless style.",
    "unitAmount": 3500,
    "category": "t-shirts",
    "collection": "t-shirts",
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "colors": [
      {
        "name": "White",
        "hex": "#f4f4f2"
      },
      {
        "name": "Black",
        "hex": "#111111"
      }
    ],
    "soldOut": [
      "White / S",
      "Black / S",
      "White / M",
      "Black / M",
      "White / L",
      "Black / L"
    ],
    "images": [
      "/images/products/oolu-classic-cotton-t-shirt-1.jpg",
      "/images/products/oolu-classic-cotton-t-shirt-2.jpg",
      "/images/products/oolu-classic-cotton-t-shirt-3.jpg",
      "/images/products/oolu-classic-cotton-t-shirt-4.jpg"
    ],
    "featured": false,
    "isNew": false,
    "sort": 70,
    "variants": [
      "White / S",
      "Black / S",
      "White / M",
      "Black / M",
      "White / L",
      "Black / L"
    ]
  }
];

export const COLLECTIONS: Record<string, { title: string; blurb: string; image?: string }> = {
  "t-shirts": { title: "T-Shirts", blurb: "Everyday, washed and cropped tees with the OOLU mark.", image: "/images/brand/tile-t-shirts.jpg" },
  "sleeveless-and-tanks": { title: "Sleeveless & Tanks", blurb: "Clean cuts for warm days and late nights.", image: "/images/brand/tile-tanks.jpg" },
  tracksuits: { title: "Tracksuits", blurb: "The OOLU tracksuit, windbreaker and hoodie sets.", image: "/images/brand/tile-tracksuits.jpg" },
  hoodies: { title: "Hoodies", blurb: "Zip hoodies with the OOLU logo." },
};

/** Size charts shown in the size guide, per category (cm). Indicative — update with the real spec sheets. */
export const SIZE_GUIDES: Record<string, { note: string; columns: string[]; rows: (string | number)[][] }> = {
  "t-shirts": {
    note: "Relaxed, slightly oversized fit. Size down for a closer fit. Measured flat, in cm.",
    columns: ["Size", "Chest width", "Body length", "Sleeve"],
    rows: [
      ["S", 54, 70, 21],
      ["M", 56, 72, 22],
      ["L", 58, 74, 23],
    ],
  },
  "sleeveless-and-tanks": {
    note: "Regular fit. Measured flat, in cm.",
    columns: ["Size", "Chest width", "Body length"],
    rows: [
      ["S", 50, 68],
      ["M", 53, 70],
      ["L", 56, 72],
    ],
  },
  tracksuits: {
    note: "Relaxed fit with elasticated cuffs and hem. Measured flat, in cm.",
    columns: ["Size", "Jacket chest", "Jacket length", "Pant waist (relaxed)", "Inseam"],
    rows: [
      ["S", 58, 68, 36, 76],
      ["M", 61, 70, 38, 78],
      ["L", 64, 72, 40, 80],
    ],
  },
  hoodies: {
    note: "Relaxed fit. Measured flat, in cm.",
    columns: ["Size", "Chest width", "Body length", "Sleeve"],
    rows: [
      ["S", 58, 68, 60],
      ["M", 61, 70, 62],
      ["L", 64, 72, 63],
    ],
  },
};
