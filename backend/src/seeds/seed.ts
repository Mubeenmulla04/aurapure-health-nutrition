import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  Role,
  User,
  Category,
  Product,
  ProductVariant,
  Inventory,
  Coupon,
  Banner,
  FAQ,
  Review,
} from '../models/index.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurapure_ecommerce';

export async function seedDatabase() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
      logger.info('Connected to MongoDB for database seeding.');
    } else {
      logger.info('Reusing active MongoDB connection for seeding.');
    }

    // Clean existing records if any
    await Role.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});
    await Inventory.deleteMany({});
    await Coupon.deleteMany({});
    await Banner.deleteMany({});
    await FAQ.deleteMany({});
    await Review.deleteMany({});

    logger.info('Purged existing seedable collections.');

    // 1. Roles
    const roles = await Role.insertMany([
      { name: 'admin', description: 'Full system administration', permissions: ['*'] },
      { name: 'customer', description: 'Standard customer role', permissions: ['order:create', 'order:read_self'] },
      { name: 'inventory_manager', description: 'Inventory and stock operations', permissions: ['inventory:*'] },
      { name: 'support', description: 'Customer support representative', permissions: ['order:read', 'ticket:*'] },
    ]);

    const adminRole = roles.find((r) => r.name === 'admin');
    const customerRole = roles.find((r) => r.name === 'customer');

    // 2. Users (Admin + Demo Customer)
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@AuraPure2026', salt);
    const customerPasswordHash = await bcrypt.hash('Customer@2026', salt);

    const adminUser = await User.create({
      name: 'Dr. Siddharth Sen (Admin)',
      email: 'admin@aurapure.in',
      phone: '+919876543210',
      passwordHash: adminPasswordHash,
      role: 'admin',
      roleId: adminRole?._id,
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    const demoCustomer = await User.create({
      name: 'Ananya Sharma',
      email: 'customer@aurapure.in',
      phone: '+919811223344',
      passwordHash: customerPasswordHash,
      role: 'customer',
      roleId: customerRole?._id,
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    // 3. Categories
    const categories = await Category.insertMany([
      {
        name: 'Plant Protein Powders',
        slug: 'plant-protein-powder',
        description: 'Clean-label, cold-pressed golden pea & organic brown rice protein infused with Ayurvedic adaptogens.',
        image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80',
        badge: 'Best Seller',
        sortOrder: 1,
      },
      {
        name: 'Daily Wellness & Adaptogens',
        slug: 'daily-wellness',
        description: 'Formulated with organic Indian botanicals to enhance immunity, mental clarity and sustained vitality.',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
        badge: 'Trending',
        sortOrder: 2,
      },
      {
        name: 'Plant Superfoods & Greens',
        slug: 'superfoods-greens',
        description: 'Farm-fresh organic Moringa, Spirulina, Wheatgrass and high-curcumin Lakadong Turmeric.',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        badge: 'Pure Organic',
        sortOrder: 3,
      },
      {
        name: 'Gut Health & Digestion',
        slug: 'gut-health',
        description: 'Plant-based digestive enzymes and prebiotic dietary fiber blends for comfortable digestion.',
        image: 'https://images.unsplash.com/photo-1505253758473-96b3d5eb926f?auto=format&fit=crop&w=800&q=80',
        badge: 'Clinically Proven',
        sortOrder: 4,
      },
    ]);

    const proteinCat = categories[0];
    const wellnessCat = categories[1];
    const superfoodCat = categories[2];

    // 4. Products & Variants
    // Product 1: Belgian Chocolate Plant Protein
    const prod1 = await Product.create({
      title: 'AuraPure Organic Plant Protein — Belgian Dark Chocolate',
      slug: 'plant-protein-belgian-dark-chocolate',
      subtitle: '25g Complete Plant Protein • Enhanced with Ashwagandha & Digestive Enzymes • 0g Added Sugar',
      categoryId: proteinCat._id,
      description:
        'A luscious, rich blend of organic Golden Pea and Sprouted Brown Rice protein crafted with raw Dutch-processed Belgian cocoa and KSM-66 Ashwagandha. Complete amino acid profile with naturally occurring 4.8g BCAAs. Fortified with bromelain and papain plant enzymes for zero bloating and seamless digestion.',
      benefits: [
        '25g high-bioavailability plant protein per serving',
        'Enhanced with 300mg KSM-66 Ashwagandha for stress relief and cortisol balance',
        'Includes Papain & Bromelain plant enzymes to prevent gas and bloating',
        'Naturally sweetened with Monk Fruit extract — zero sugar, zero stevia aftertaste',
        'Third-party tested in NABL certified labs for heavy metals and pesticides',
      ],
      certifications: ['Certified Organic', 'Non-GMO', 'Heavy Metal Tested', 'Vegan Society Approved', 'Gluten Free'],
      nutritionalHighlights: {
        proteinPerServing: '25g',
        bcaa: '4.8g',
        servingsPerTub: 30,
        addedSugar: '0g',
        digestiveEnzymes: true,
      },
      ingredients: [
        'Organic Yellow Pea Protein Isolate (82%)',
        'Organic Sprouted Brown Rice Protein (10%)',
        'Pure Belgian Alkalized Cocoa Powder',
        'KSM-66 Ashwagandha Extract (Withania Somnifera)',
        'Natural Dark Chocolate Flavor',
        'Digestive Enzyme Blend (Papain, Bromelain)',
        'Monk Fruit Extract (Siraitia grosvenorii)',
        'Himalayan Pink Rock Salt',
      ],
      howToUse: [
        { step: 'Step 1', description: 'Add 1 heaping scoop (34g) into your AuraPure shaker.' },
        { step: 'Step 2', description: 'Pour 250ml–300ml of chilled water, almond milk, or oat milk.' },
        { step: 'Step 3', description: 'Shake vigorously for 20 seconds. Enjoy your creamy, nutrient-rich shake!' },
      ],
      badges: ['Best Seller', 'Lab Tested'],
      rating: 4.9,
      reviewCount: 342,
      isActive: true,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
    });

    const v1_1 = await ProductVariant.create({
      productId: prod1._id,
      sku: 'AP-PROT-CHOC-1KG',
      title: 'Belgian Dark Chocolate - 1 kg Tub (30 Servings)',
      flavor: 'Belgian Dark Chocolate',
      packSize: '1 kg Tub',
      weightGrams: 1000,
      mrp: 2999,
      sellingPrice: 2499,
      discountPercent: 17,
      images: [
        'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80',
      ],
      isActive: true,
    });

    const v1_2 = await ProductVariant.create({
      productId: prod1._id,
      sku: 'AP-PROT-CHOC-500G',
      title: 'Belgian Dark Chocolate - 500g Pouch (15 Servings)',
      flavor: 'Belgian Dark Chocolate',
      packSize: '500g Pouch',
      weightGrams: 500,
      mrp: 1699,
      sellingPrice: 1399,
      discountPercent: 18,
      images: [
        'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=1000&q=80',
      ],
      isActive: true,
    });

    // Product 2: Madagascar Vanilla Bean Plant Protein
    const prod2 = await Product.create({
      title: 'AuraPure Organic Plant Protein — Madagascar Vanilla Bean',
      slug: 'plant-protein-madagascar-vanilla',
      subtitle: '25g Pure Clean Protein • Infused with Shatavari Root • Velvety Smooth Texture',
      categoryId: proteinCat._id,
      description:
        'Infused with aromatic bourbon vanilla beans straight from Madagascar. Delivers pure floral warmth with zero artificial flavorings. Packed with complete plant protein and enriched with wild-harvested Shatavari root to promote hormonal harmony and antioxidant defense.',
      benefits: [
        '25g clean multi-source plant protein with complete 9 essential amino acids',
        'Real Madagascar vanilla bean extract for authentic subtle sweetness',
        'Infused with 250mg Organic Shatavari Root Extract for stamina and vitality',
        'Fortified with plant-derived papain and bromelain enzymes for effortless digestion',
        'Non-GMO, Soy-Free, Dairy-Free, and zero gums or emulsifiers',
      ],
      certifications: ['Certified Organic', 'Non-GMO', 'Heavy Metal Tested', 'Vegan Society Approved'],
      nutritionalHighlights: {
        proteinPerServing: '25g',
        bcaa: '4.7g',
        servingsPerTub: 30,
        addedSugar: '0g',
        digestiveEnzymes: true,
      },
      ingredients: [
        'Organic Yellow Pea Protein Isolate',
        'Organic Sprouted Brown Rice Protein',
        'Madagascar Vanilla Pod Powder',
        'Organic Shatavari Root Extract',
        'Digestive Enzymes (Papain, Bromelain)',
        'Monk Fruit Sweetener',
        'Pink Himalayan Salt',
      ],
      howToUse: [
        { step: 'Step 1', description: 'Add 1 level scoop (33g) to your glass or smoothie blender.' },
        { step: 'Step 2', description: 'Blend with 250ml coconut water or plant milk and half a banana.' },
        { step: 'Step 3', description: 'Serve fresh post-workout or as a nourishing breakfast booster.' },
      ],
      badges: ['Award Winning', 'High Protein'],
      rating: 4.8,
      reviewCount: 218,
      isActive: true,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
    });

    const v2_1 = await ProductVariant.create({
      productId: prod2._id,
      sku: 'AP-PROT-VAN-1KG',
      title: 'Madagascar Vanilla Bean - 1 kg Tub (30 Servings)',
      flavor: 'Madagascar Vanilla Bean',
      packSize: '1 kg Tub',
      weightGrams: 1000,
      mrp: 2999,
      sellingPrice: 2499,
      discountPercent: 17,
      images: [
        'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=1000&q=80',
      ],
      isActive: true,
    });

    // Product 3: Raw Unflavored Plant Protein
    const prod3 = await Product.create({
      title: 'AuraPure 100% Raw Unflavored Plant Protein',
      slug: 'raw-unflavored-plant-protein',
      subtitle: '26g Ultra-Pure Protein • Zero Sweeteners • Ideal for Cooking & Smoothies',
      categoryId: proteinCat._id,
      description:
        'Just 2 pure ingredients: Organic Golden Canadian Pea Isolate & Sprouted Brown Rice Isolate. Unsweetened, unflavored, and allergen-free. Blend into rotis, pancakes, bowls, or savory dishes for an effortless protein upgrade.',
      benefits: [
        '26g pure protein per serving — highest concentration in class',
        '100% clean single-source nutrition with 0g carbs and 0g sugar',
        'Unflavored versatility: seamless for baking, soups, and shakes',
        'Cold-water extracted without chemical solvents or hexane',
      ],
      certifications: ['Certified Organic', 'Hexane Free', 'Lab Tested', '100% Vegan'],
      nutritionalHighlights: {
        proteinPerServing: '26g',
        bcaa: '5.1g',
        servingsPerTub: 30,
        addedSugar: '0g',
        digestiveEnzymes: false,
      },
      ingredients: [
        'Certified Organic Golden Pea Protein Isolate (85%)',
        'Certified Organic Sprouted Brown Rice Protein (15%)',
      ],
      howToUse: [
        { step: 'Step 1', description: 'Add 1 scoop into your favorite soup, dal, atta dough, or green smoothie.' },
        { step: 'Step 2', description: 'Mix thoroughly until dissolved.' },
      ],
      badges: ['100% Raw', 'Zero Additives'],
      rating: 4.9,
      reviewCount: 164,
      isActive: true,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
    });

    const v3_1 = await ProductVariant.create({
      productId: prod3._id,
      sku: 'AP-PROT-RAW-1KG',
      title: 'Raw Unflavored - 1 kg Tub (30 Servings)',
      flavor: 'Raw Unflavored',
      packSize: '1 kg Tub',
      weightGrams: 1000,
      mrp: 2699,
      sellingPrice: 2199,
      discountPercent: 19,
      images: [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=1000&q=80',
      ],
      isActive: true,
    });

    // Product 4: Golden Ayurvedic Turmeric Latte
    const prod4 = await Product.create({
      title: 'AuraPure Ayurvedic Golden Turmeric Super-Elixir',
      slug: 'golden-turmeric-latte-elixir',
      subtitle: 'Lakadong High-Curcumin Turmeric • Ceylon Cinnamon • BioPerine Piperine',
      categoryId: wellnessCat._id,
      description:
        'Sourced from the pristine hills of Meghalaya, containing 7.5% natural curcumin. Blended with organic Ceylon cinnamon, ginger, cardamom, and black pepper for maximum absorption. Relieves joint inflammation and bolsters cellular immunity.',
      benefits: [
        'Contains 7.5% naturally occurring active Curcumin (3x standard grocery turmeric)',
        'Infused with 95% standardized Piperine for 2000% enhanced absorption',
        'Traditional Ayurvedic Rasayana promoting restorative sleep and joint comfort',
      ],
      certifications: ['Direct Farm Sourced', 'Pesticide Free', 'Non-Irradiated'],
      nutritionalHighlights: {
        proteinPerServing: '3g',
        bcaa: '0g',
        servingsPerTub: 40,
        addedSugar: '0g',
        digestiveEnzymes: false,
      },
      ingredients: [
        'Pure Lakadong Turmeric (Curcuma Longa)',
        'Ceylon Cinnamon Bark Powder',
        'Sun-dried Ginger Root',
        'Green Cardamom Seed Powder',
        'BioPerine Black Pepper Extract',
      ],
      howToUse: [
        { step: 'Step 1', description: 'Whisk 1 teaspoon (5g) into warm almond or oat milk.' },
        { step: 'Step 2', description: 'Sip 30 minutes before bed for deep restorative recovery.' },
      ],
      badges: ['Immunity Booster', 'Meghalaya Sourced'],
      rating: 4.95,
      reviewCount: 97,
      isActive: true,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
    });

    const v4_1 = await ProductVariant.create({
      productId: prod4._id,
      sku: 'AP-WELL-HALDI-200G',
      title: 'Golden Turmeric Elixir - 200g Jar (40 Servings)',
      flavor: 'Spiced Golden Cardamom',
      packSize: '200g Glass Jar',
      weightGrams: 200,
      mrp: 999,
      sellingPrice: 799,
      discountPercent: 20,
      images: [
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1000&q=80',
      ],
      isActive: true,
    });

    // Product 5: Daily Organic Greens
    const prod5 = await Product.create({
      title: 'AuraPure Daily Greens & Superfoods Alkalizing Blend',
      slug: 'daily-greens-superfoods-blend',
      subtitle: '30+ Whole Organic Greens, Wheatgrass, Spirulina, Moringa & Digestive Enzymes',
      categoryId: superfoodCat._id,
      description:
        'A single scoop satisfies your daily micronutrient and prebiotic fiber needs. Balances gut microbiome, reduces acidity, and eliminates afternoon energy slumps.',
      benefits: [
        '30+ raw cold-processed greens and botanical superfoods in every serving',
        'Natural detoxification and cellular alkalizing support',
        'Rich in Vitamin C from wild Amla and organic Chlorophyll',
      ],
      certifications: ['Certified Organic', 'No Fillers', 'No Grass Extracts', '100% Whole Food'],
      nutritionalHighlights: {
        proteinPerServing: '4g',
        bcaa: '0.8g',
        servingsPerTub: 30,
        addedSugar: '0g',
        digestiveEnzymes: true,
      },
      ingredients: [
        'Organic Wheatgrass Powder',
        'Organic Barley Grass',
        'Moringa Oleifera Leaf',
        'Organic Spirulina',
        'Spinach & Kale Extract',
        'Wild Indian Gooseberry (Amla)',
        'Prebiotic Apple Pectin Fiber',
      ],
      howToUse: [
        { step: 'Step 1', description: 'Mix 1 scoop (8g) in 250ml room temperature water first thing in the morning.' },
      ],
      badges: ['Detox Essential'],
      rating: 4.85,
      reviewCount: 142,
      isActive: true,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
    });

    const v5_1 = await ProductVariant.create({
      productId: prod5._id,
      sku: 'AP-SUP-GREENS-250G',
      title: 'Daily Greens - 250g Jar (30 Servings)',
      flavor: 'Crisp Green Apple & Mint',
      packSize: '250g Jar',
      weightGrams: 250,
      mrp: 1499,
      sellingPrice: 1199,
      discountPercent: 20,
      images: [
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80',
      ],
      isActive: true,
    });

    // 5. Initialize Inventory Records
    const variants = [v1_1, v1_2, v2_1, v3_1, v4_1, v5_1];
    for (const v of variants) {
      await Inventory.create({
        variantId: v._id,
        sku: v.sku,
        stockOnHand: 150,
        reservedStock: 0,
        availableStock: 150,
        lowStockThreshold: 15,
        alertStatus: 'IN_STOCK',
      });
    }

    // 6. Promotional Coupons
    await Coupon.insertMany([
      {
        code: 'AURAPURE10',
        description: '10% Flat Discount on All Plant Nutrition Orders',
        discountType: 'PERCENT',
        discountValue: 10,
        minOrderValue: 999,
        maxDiscountCap: 500,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimitTotal: 10000,
        usageLimitPerUser: 5,
        isActive: true,
      },
      {
        code: 'WELCOME200',
        description: 'Flat ₹200 OFF on your first wellness order above ₹1,499',
        discountType: 'FLAT',
        discountValue: 200,
        minOrderValue: 1499,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimitTotal: 5000,
        usageLimitPerUser: 1,
        isActive: true,
      },
    ]);

    // 7. Banners
    await Banner.insertMany([
      {
        title: 'Pure Plant Power. Zero Bloating.',
        subtitle: '100% Clean Plant Protein fortified with Himalayan Ashwagandha & Digestive Enzymes.',
        tagline: 'Clean Nutrition For The Conscious Individual',
        imageDesktop: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=1920&q=80',
        imageMobile: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80',
        ctaText: 'Explore Collections',
        ctaLink: '/collections/plant-protein-powder',
        placement: 'HERO',
        isActive: true,
        sortOrder: 1,
      },
      {
        title: 'Enjoy Free Express Shipping Across India',
        subtitle: 'On all orders above ₹999. Fast dispatch within 24 hours.',
        imageDesktop: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
        imageMobile: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
        placement: 'PROMO_BAR',
        isActive: true,
        sortOrder: 1,
      },
    ]);

    // 8. Structured FAQs
    await FAQ.insertMany([
      {
        question: 'What makes AuraPure plant protein superior to whey protein?',
        answer:
          'Unlike whey, which often triggers lactose intolerance, gas, acne, and heavy bloating, AuraPure is 100% plant-based, made from cold-pressed golden pea and brown rice isolates. We also add papain and bromelain digestive enzymes to ensure gentle, effortless digestion and 98% bioavailability without feeling heavy.',
        category: 'NUTRITION',
        sortOrder: 1,
        isActive: true,
      },
      {
        question: 'Are your products tested for heavy metals and toxins?',
        answer:
          'Yes, every single batch is independently tested in NABL-accredited third-party laboratories for Lead, Cadmium, Arsenic, and Mercury, exceeding stringent FSSAI safety norms. Batch COA (Certificate of Analysis) reports are publicly accessible.',
        category: 'INGREDIENTS',
        sortOrder: 2,
        isActive: true,
      },
      {
        question: 'How long does shipping take across India?',
        answer:
          'Orders placed before 2 PM IST are dispatched on the same business day via Shiprocket premium air couriers (BlueDart, Delhivery, DTDC). Metro deliveries arrive in 2–3 business days; other regions within 4–5 business days.',
        category: 'SHIPPING',
        sortOrder: 3,
        isActive: true,
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We partner with Razorpay to provide secure 256-bit encrypted checkout. We accept UPI (Google Pay, PhonePe, Paytm, Cred), all Major Credit & Debit Cards (Visa, Mastercard, RuPay, Amex), and Net Banking across 50+ Indian banks.',
        category: 'ORDERS',
        sortOrder: 4,
        isActive: true,
      },
    ]);

    // 9. Sample Customer Reviews
    await Review.insertMany([
      {
        productId: prod1._id,
        userName: 'Vikram Malhotra',
        rating: 5,
        title: 'Best plant protein in India — period!',
        comment:
          'I have tried almost every brand in the Indian market, but most taste like chalk or sand. AuraPure Belgian Chocolate is smooth, mixes completely without clumps, and leaves zero chalky aftertaste. Best of all: absolutely zero bloating!',
        verifiedPurchase: true,
        isApproved: true,
        helpfulVotes: 42,
      },
      {
        productId: prod1._id,
        userName: 'Meera Deshmukh',
        rating: 5,
        title: 'Gentle on sensitive stomach',
        comment:
          'I could never digest whey without stomach cramps. Switched to AuraPure two months ago and my recovery post-yoga has improved drastically. The addition of Ashwagandha is brilliant.',
        verifiedPurchase: true,
        isApproved: true,
        helpfulVotes: 29,
      },
      {
        productId: prod2._id,
        userName: 'Rahul Nambiar',
        rating: 5,
        title: 'Authentic Madagascar vanilla flavor',
        comment:
          'Subtle, natural vanilla taste. Not overly sweet like standard commercial powders. I blend it with unsweetened oat milk and a frozen banana every single morning.',
        verifiedPurchase: true,
        isApproved: true,
        helpfulVotes: 18,
      },
    ]);

    logger.info('🎉 Database seeding completed successfully with realistic Indian wellness catalog!');
  } catch (error) {
    logger.error('Error during database seeding:', error);
    throw error;
  }
}

// Direct execution support
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding finished.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Seed execution failed:', err);
      process.exit(1);
    });
}
