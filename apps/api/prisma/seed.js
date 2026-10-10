"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2_1 = __importDefault(require("argon2"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding CampusLoop database...');
    // ── Colleges ────────────────────────────────────────────────────────────
    const college = await prisma.college.upsert({
        where: { slug: 'demo-university' },
        update: {},
        create: {
            name: 'Demo University',
            slug: 'demo-university',
            approvedEmailDomains: ['demo.edu', 'student.demo.edu'],
            status: client_1.CollegeStatus.ACTIVE,
        },
    });
    console.log(`✅ College: ${college.name}`);
    // ── Categories ───────────────────────────────────────────────────────────
    const categoryData = [
        { name: 'Books & Academic Materials', slug: 'books-academic' },
        { name: 'Electronics & Accessories', slug: 'electronics' },
        { name: 'Computers & Components', slug: 'computers' },
        { name: 'Cycles & Sports Equipment', slug: 'cycles-sports' },
        { name: 'Furniture & Room Essentials', slug: 'furniture' },
        { name: 'Clothing & Accessories', slug: 'clothing' },
        { name: 'Hostel & Household Items', slug: 'hostel-household' },
        { name: 'Other Permitted Goods', slug: 'other' },
    ];
    const categories = {};
    for (const cat of categoryData) {
        const c = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: { ...cat, active: true },
        });
        categories[cat.slug] = c.id;
        console.log(`✅ Category: ${c.name}`);
    }
    // ── Users ────────────────────────────────────────────────────────────────
    const adminHash = await argon2_1.default.hash('Admin@123456');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@campusloop.dev' },
        update: {},
        create: {
            name: 'Platform Admin',
            email: 'admin@campusloop.dev',
            passwordHash: adminHash,
            collegeId: college.id,
            role: client_1.UserRole.ADMIN,
            emailVerifiedAt: new Date(),
            course: 'Platform Administration',
        },
    });
    console.log(`✅ Admin: ${admin.email}`);
    const modHash = await argon2_1.default.hash('Mod@123456');
    const moderator = await prisma.user.upsert({
        where: { email: 'mod@demo.edu' },
        update: {},
        create: {
            name: 'Alice Moderator',
            email: 'mod@demo.edu',
            passwordHash: modHash,
            collegeId: college.id,
            role: client_1.UserRole.MODERATOR,
            emailVerifiedAt: new Date(),
            course: 'Computer Science',
            graduationYear: 2025,
        },
    });
    console.log(`✅ Moderator: ${moderator.email}`);
    const seller1Hash = await argon2_1.default.hash('Student@123456');
    const seller1 = await prisma.user.upsert({
        where: { email: 'bob@student.demo.edu' },
        update: {},
        create: {
            name: 'Bob Seller',
            email: 'bob@student.demo.edu',
            passwordHash: seller1Hash,
            collegeId: college.id,
            role: client_1.UserRole.STUDENT,
            emailVerifiedAt: new Date(),
            course: 'Electrical Engineering',
            graduationYear: 2026,
        },
    });
    const buyer1Hash = await argon2_1.default.hash('Student@123456');
    const buyer1 = await prisma.user.upsert({
        where: { email: 'carol@student.demo.edu' },
        update: {},
        create: {
            name: 'Carol Buyer',
            email: 'carol@student.demo.edu',
            passwordHash: buyer1Hash,
            collegeId: college.id,
            role: client_1.UserRole.STUDENT,
            emailVerifiedAt: new Date(),
            course: 'Business Administration',
            graduationYear: 2027,
        },
    });
    console.log(`✅ Demo students: Bob & Carol`);
    // ── Listings ─────────────────────────────────────────────────────────────
    const now = new Date();
    const listing1 = await prisma.listing.upsert({
        where: { id: 'seed-listing-001' },
        update: {},
        create: {
            id: 'seed-listing-001',
            sellerId: seller1.id,
            collegeId: college.id,
            categoryId: categories['computers'],
            title: 'Dell XPS 13 Laptop — Like New',
            description: 'Barely used Dell XPS 13 (2023), Intel i7, 16GB RAM, 512GB SSD. Selling because I upgraded. Comes with original charger and box. No scratches.',
            condition: client_1.ItemCondition.LIKE_NEW,
            listingType: client_1.ListingType.FIXED_PRICE,
            fixedPrice: 45000,
            minimumAcceptablePrice: 40000,
            negotiationEnabled: true,
            pickupLocation: 'Hostel Block A, Room 204',
            status: client_1.ListingStatus.ACTIVE,
        },
    });
    const listing2 = await prisma.listing.upsert({
        where: { id: 'seed-listing-002' },
        update: {},
        create: {
            id: 'seed-listing-002',
            sellerId: seller1.id,
            collegeId: college.id,
            categoryId: categories['books-academic'],
            title: 'Engineering Mathematics Vol 1 & 2 — Kreyszig',
            description: 'Both volumes of Advanced Engineering Mathematics by Kreyszig. Good condition, some highlighting in volume 1. Perfect for second year students.',
            condition: client_1.ItemCondition.GOOD,
            listingType: client_1.ListingType.FIXED_PRICE,
            fixedPrice: 800,
            negotiationEnabled: false,
            pickupLocation: 'Main Library Entrance',
            status: client_1.ListingStatus.ACTIVE,
        },
    });
    // Auction listing
    const listing3 = await prisma.listing.upsert({
        where: { id: 'seed-listing-003' },
        update: {},
        create: {
            id: 'seed-listing-003',
            sellerId: seller1.id,
            collegeId: college.id,
            categoryId: categories['cycles-sports'],
            title: 'Hero Sprint 26T Mountain Cycle — Auction',
            description: 'Well-maintained Hero Sprint mountain cycle. New tyres last month, gear shifts smoothly. Selling since I am going home after graduation.',
            condition: client_1.ItemCondition.GOOD,
            listingType: client_1.ListingType.AUCTION,
            negotiationEnabled: false,
            pickupLocation: 'Cycle Stand, Block C',
            status: client_1.ListingStatus.ACTIVE,
        },
    });
    // Attach auction to listing3
    const auctionStart = new Date(now.getTime() - 60000); // started 1 min ago
    const auctionEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // ends in 24h
    await prisma.auction.upsert({
        where: { listingId: listing3.id },
        update: {},
        create: {
            listingId: listing3.id,
            startsAt: auctionStart,
            endsAt: auctionEnd,
            startingBid: 2000,
            minimumBidIncrement: 100,
            reservePrice: 3500,
            status: client_1.AuctionStatus.LIVE,
        },
    });
    console.log(`✅ Demo listings: ${listing1.title}, ${listing2.title}, ${listing3.title}`);
    console.log('');
    console.log('📋 Demo credentials:');
    console.log('  Admin:     admin@campusloop.dev / Admin@123456');
    console.log('  Moderator: mod@demo.edu         / Mod@123456');
    console.log('  Seller:    bob@student.demo.edu / Student@123456');
    console.log('  Buyer:     carol@student.demo.edu / Student@123456');
    console.log('');
    console.log('✅ Seed complete!');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map