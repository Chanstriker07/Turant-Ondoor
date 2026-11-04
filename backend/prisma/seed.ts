import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const serviceCatalog: { name: string; icon: string; services: [string, string, number, number][] }[] = [
  {
    name: "Cleaning",
    icon: "🧹",
    services: [
      ["Full Home Deep Cleaning", "Complete deep cleaning of kitchen, bathrooms, rooms and balcony.", 3499, 300],
      ["Bathroom Cleaning", "Intense cleaning of tiles, fittings, mirrors and floor.", 499, 60],
      ["Kitchen Cleaning", "Degreasing of chimney exterior, slab, tiles and sink.", 899, 120],
      ["Sofa Cleaning (5 seats)", "Shampoo and vacuum cleaning for fabric sofas.", 799, 90],
    ],
  },
  {
    name: "AC Repair",
    icon: "❄️",
    services: [
      ["AC Service (Split)", "Jet-pump cleaning of indoor and outdoor units.", 599, 60],
      ["AC Gas Refill", "Leak check and complete gas top-up.", 2499, 90],
      ["AC Installation", "Installation of split or window AC.", 1499, 120],
    ],
  },
  {
    name: "Electrician",
    icon: "💡",
    services: [
      ["Fan Installation", "Install ceiling or wall fan.", 149, 30],
      ["Switchboard Repair", "Fix or replace switches and sockets.", 99, 30],
      ["Inverter Installation", "Installation and wiring of home inverter.", 499, 60],
    ],
  },
  {
    name: "Plumber",
    icon: "🚰",
    services: [
      ["Tap Repair", "Fix leaking or broken taps.", 129, 30],
      ["Blockage Removal", "Clear blocked drains, sinks or toilets.", 249, 45],
      ["Water Tank Cleaning", "Mechanised cleaning of overhead tank.", 699, 90],
    ],
  },
  {
    name: "Salon for Women",
    icon: "💅",
    services: [
      ["Waxing (Full Arms + Legs)", "Rica wax for full arms and full legs.", 799, 60],
      ["Facial & Cleanup", "Fruit facial with cleanup and massage.", 999, 75],
      ["Manicure & Pedicure", "Classic mani-pedi with nail shaping.", 899, 90],
    ],
  },
  {
    name: "Men's Grooming",
    icon: "💈",
    services: [
      ["Haircut & Beard Styling", "Haircut and beard trim at home.", 349, 45],
      ["Head Massage", "Relaxing 20-minute oil head massage.", 249, 20],
    ],
  },
  {
    name: "Appliance Repair",
    icon: "🔧",
    services: [
      ["Washing Machine Repair", "Diagnosis and repair of washing machines.", 299, 60],
      ["Refrigerator Repair", "Cooling issues, gas refill and repairs.", 349, 60],
      ["RO Water Purifier Service", "Filter change and service.", 399, 45],
    ],
  },
  {
    name: "Painting",
    icon: "🎨",
    services: [
      ["Room Painting (1 BHK)", "Interior painting with premium emulsion.", 7999, 960],
      ["Wall Texture Design", "Designer texture on one wall.", 2999, 240],
    ],
  },
  {
    name: "Pest Control",
    icon: "🪳",
    services: [
      ["Cockroach Control", "Odourless gel treatment for kitchen and bathrooms.", 899, 60],
      ["Termite Control", "Drill-fill-seal anti-termite treatment.", 2999, 180],
    ],
  },
  {
    name: "Carpenter",
    icon: "🪚",
    services: [
      ["Furniture Assembly", "Assemble beds, wardrobes and tables.", 299, 60],
      ["Door Lock Repair", "Repair or replace door locks.", 199, 30],
    ],
  },
];

const listingCatalog: { name: string; icon: string }[] = [
  { name: "Restaurants", icon: "🍽️" },
  { name: "Hospitals & Clinics", icon: "🏥" },
  { name: "Pharmacies", icon: "💊" },
  { name: "Grocery Stores", icon: "🛒" },
  { name: "Schools & Tutors", icon: "🎓" },
  { name: "Gyms & Fitness", icon: "🏋️" },
  { name: "Hotels", icon: "🏨" },
  { name: "Car & Bike Repair", icon: "🚗" },
  { name: "Real Estate", icon: "🏠" },
  { name: "Banquet Halls", icon: "🎉" },
];

const businesses: {
  category: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  openingHours: string;
  isFeatured?: boolean;
}[] = [
  { category: "Restaurants", name: "Spice Garden Family Restaurant", description: "North Indian, Chinese and South Indian. Family dining and takeaway.", phone: "9876500001", address: "12 MG Road, Indiranagar", city: "Bengaluru", openingHours: "11:00 AM - 11:00 PM", isFeatured: true },
  { category: "Restaurants", name: "Biryani House", description: "Hyderabadi dum biryani and kebabs.", phone: "9876500002", address: "45 Banjara Hills Road No. 1", city: "Hyderabad", openingHours: "12:00 PM - 11:30 PM" },
  { category: "Hospitals & Clinics", name: "CityCare Multispeciality Clinic", description: "General physician, paediatrics, dental and diagnostics.", phone: "9876500003", address: "88 Koramangala 5th Block", city: "Bengaluru", openingHours: "24 Hours", isFeatured: true },
  { category: "Pharmacies", name: "HealthPlus Pharmacy", description: "Medicines, wellness products and home delivery.", phone: "9876500004", address: "3 HSR Layout Sector 2", city: "Bengaluru", openingHours: "8:00 AM - 11:00 PM" },
  { category: "Grocery Stores", name: "FreshMart Supermarket", description: "Groceries, fruits, vegetables and daily essentials.", phone: "9876500005", address: "21 Jubilee Hills Checkpost", city: "Hyderabad", openingHours: "7:00 AM - 10:00 PM" },
  { category: "Schools & Tutors", name: "BrightMinds Tuition Centre", description: "Maths and science coaching for classes 6-12.", phone: "9876500006", address: "9 Anna Nagar West", city: "Chennai", openingHours: "4:00 PM - 9:00 PM" },
  { category: "Gyms & Fitness", name: "IronCore Fitness", description: "Strength training, cardio, Zumba and personal trainers.", phone: "9876500007", address: "77 Andheri West, Link Road", city: "Mumbai", openingHours: "5:30 AM - 10:30 PM", isFeatured: true },
  { category: "Hotels", name: "Hotel Comfort Inn", description: "Budget rooms with free Wi-Fi near railway station.", phone: "9876500008", address: "2 Station Road", city: "Pune", openingHours: "24 Hours" },
  { category: "Car & Bike Repair", name: "QuickFix Auto Garage", description: "Car and bike servicing, denting, painting.", phone: "9876500009", address: "56 Whitefield Main Road", city: "Bengaluru", openingHours: "9:00 AM - 8:00 PM" },
  { category: "Real Estate", name: "HomeKey Realtors", description: "Buy, sell and rent flats and independent houses.", phone: "9876500010", address: "14 Sector 18", city: "Noida", openingHours: "10:00 AM - 7:00 PM" },
  { category: "Banquet Halls", name: "Royal Palace Banquets", description: "AC banquet hall for weddings and parties up to 500 guests.", phone: "9876500011", address: "101 Ring Road, Lajpat Nagar", city: "Delhi", openingHours: "9:00 AM - 11:00 PM" },
];

async function main() {
  await prisma.$transaction([
    prisma.businessReview.deleteMany(),
    prisma.business.deleteMany(),
    prisma.listingCategory.deleteMany(),
    prisma.bookingReview.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.providerProfile.deleteMany(),
    prisma.service.deleteMany(),
    prisma.serviceCategory.deleteMany(),
    prisma.address.deleteMany(),
    prisma.otpCode.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const categoryIds: Record<string, string> = {};
  for (const [i, c] of serviceCatalog.entries()) {
    const category = await prisma.serviceCategory.create({
      data: {
        name: c.name,
        slug: slug(c.name),
        icon: c.icon,
        sortOrder: i,
        services: {
          create: c.services.map(([name, description, price, durationMins]) => ({
            name,
            description,
            price,
            durationMins,
          })),
        },
      },
    });
    categoryIds[c.name] = category.id;
  }

  const listingIds: Record<string, string> = {};
  for (const [i, c] of listingCatalog.entries()) {
    const category = await prisma.listingCategory.create({
      data: { name: c.name, slug: slug(c.name), icon: c.icon, sortOrder: i },
    });
    listingIds[c.name] = category.id;
  }
  for (const b of businesses) {
    const { category, ...rest } = b;
    await prisma.business.create({
      data: { ...rest, whatsapp: rest.phone, categoryId: listingIds[category], status: "APPROVED", isVerified: true },
    });
  }

  await prisma.user.create({ data: { phone: "9999999999", name: "Admin", role: "ADMIN" } });
  await prisma.user.create({
    data: {
      phone: "8888888888",
      name: "Ravi Kumar",
      role: "PROVIDER",
      provider: {
        create: {
          bio: "Certified electrician and AC technician.",
          experienceYears: 6,
          city: "Bengaluru",
          isVerified: true,
          categories: {
            connect: [{ id: categoryIds["Electrician"] }, { id: categoryIds["AC Repair"] }, { id: categoryIds["Plumber"] }],
          },
        },
      },
    },
  });
  await prisma.user.create({
    data: {
      phone: "7777777777",
      name: "Priya Sharma",
      addresses: {
        create: { label: "Home", line1: "Flat 402, Green Residency", line2: "80 Feet Road, Koramangala", city: "Bengaluru", pincode: "560034" },
      },
    },
  });

  console.log("Seeded: admin 9999999999, provider 8888888888, customer 7777777777");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
