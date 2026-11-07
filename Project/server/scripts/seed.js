require("dotenv").config({
    path: require("path").resolve(__dirname, "../../.env")
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/database");

const User = require("../models/User");
const Gig = require("../models/Gig");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const Review = require("../models/Review");
const Analytics = require("../models/Analytics");
const ApiUsage = require("../models/ApiUsage");

function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

async function seedDatabase() {
    try {
        if (process.env.NODE_ENV !== "development") {
            throw new Error(
                "Database seeding is only permitted in development."
            );
        }

        if (
            process.env.MONGO_DB_DEV === process.env.MONGO_DB_PROD
        ) {
            throw new Error(
                "Development and production databases must be different."
            );
        }

        const expectedDatabase = process.env.MONGO_DB_DEV;

        if (!expectedDatabase) {
            throw new Error("MONGO_DB_DEV is missing.");
        }

        if (connectDB.getDatabaseName() !== expectedDatabase) {
            throw new Error(
                "Seed script is configured for the wrong database."
            );
        }

        await connectDB();

        if (mongoose.connection.name !== expectedDatabase) {
            throw new Error(
                `Connected to unexpected database: ${mongoose.connection.name}`
            );
        }
        console.log("--------------------------------");
        console.log("SEEDING DATABASE");
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`Database: ${mongoose.connection.name}`);
        console.log("--------------------------------");

        console.log("Clearing existing development data...");

        // Keep Admin accounts.
        // Only Client and Freelancer development data is reset.
        await Transaction.deleteMany({});
        await Booking.deleteMany({});
        await Gig.deleteMany({});
        await Analytics.deleteMany({});
        await ApiUsage.deleteMany({});
        await Review.deleteMany({});

        await User.deleteMany({
            role: { $ne: "Admin" }
        });

        console.log("Creating users...");

        const passwordHash = await bcrypt.hash("Password123!", 10);

        const userDefinitions = [
            // CLIENTS
            {
                name: "Test Client",
                email: "client@hustlehub.test",
                role: "Client",
                bio: "Small business owner looking for reliable freelancers.",
                location: "Pretoria, South Africa"
            },
            {
                name: "Michael Business",
                email: "michael@hustlehub.test",
                role: "Client",
                bio: "Entrepreneur building an online business.",
                location: "Johannesburg, South Africa"
            },
            {
                name: "Jessica Entrepreneur",
                email: "jessica@hustlehub.test",
                role: "Client",
                bio: "Startup founder and digital entrepreneur.",
                location: "Cape Town, South Africa"
            },
            {
                name: "David Projects",
                email: "david@hustlehub.test",
                role: "Client",
                bio: "Marketing manager managing multiple projects.",
                location: "Pretoria, South Africa"
            },
            {
                name: "Amanda Startup",
                email: "amanda@hustlehub.test",
                role: "Client",
                bio: "Startup owner seeking creative professionals.",
                location: "Johannesburg, South Africa"
            },

            // FREELANCERS
            {
                name: "John Freelancer",
                email: "john@hustlehub.test",
                role: "Freelancer",
                bio: "Full-stack developer specializing in React and Node.js.",
                skills: ["React", "JavaScript", "Node.js", "MongoDB"],
                location: "Pretoria, South Africa"
            },
            {
                name: "Sarah Designer",
                email: "sarah@hustlehub.test",
                role: "Freelancer",
                bio: "Graphic designer specializing in branding.",
                skills: ["Graphic Design", "Logo Design", "Branding"],
                location: "Pretoria, South Africa"
            },
            {
                name: "Daniel Developer",
                email: "daniel@hustlehub.test",
                role: "Freelancer",
                bio: "Backend developer building scalable APIs.",
                skills: ["Node.js", "Express", "MongoDB"],
                location: "Johannesburg, South Africa"
            },
            {
                name: "Emily Writer",
                email: "emily@hustlehub.test",
                role: "Freelancer",
                bio: "Professional copywriter and content strategist.",
                skills: ["Copywriting", "SEO", "Content Writing"],
                location: "Cape Town, South Africa"
            },
            {
                name: "James Marketer",
                email: "james@hustlehub.test",
                role: "Freelancer",
                bio: "Digital marketing specialist.",
                skills: ["SEO", "Marketing", "Social Media"],
                location: "Johannesburg, South Africa"
            },
            {
                name: "Olivia Photographer",
                email: "olivia@hustlehub.test",
                role: "Freelancer",
                bio: "Professional photographer and photo editor.",
                skills: ["Photography", "Editing", "Lightroom"],
                location: "Cape Town, South Africa"
            },
            {
                name: "Lucas Developer",
                email: "lucas@hustlehub.test",
                role: "Freelancer",
                bio: "Frontend developer building modern web experiences.",
                skills: ["React", "CSS", "JavaScript"],
                location: "Johannesburg, South Africa"
            },
            {
                name: "Sophia Designer",
                email: "sophia@hustlehub.test",
                role: "Freelancer",
                bio: "UI/UX designer focused on user-friendly products.",
                skills: ["UI Design", "UX Design", "Figma"],
                location: "Pretoria, South Africa"
            }
        ];

        const users = await User.insertMany(
            userDefinitions.map(user => ({
                ...user,
                password: passwordHash,
                provider: "local",
                isActive: true
            }))
        );

        const [
            client,
            client2,
            client3,
            client4,
            client5,
            freelancer1,
            freelancer2,
            freelancer3,
            freelancer4,
            freelancer5,
            freelancer6,
            freelancer7,
            freelancer8
        ] = users;

        console.log("Creating gigs...");

        const gigs = await Gig.create([

            {
                freelancerId: freelancer3._id,
                title: "Build a REST API",
                description: "Secure REST API using Node.js, Express and MongoDB.",
                category: "Programming",
                price: 3200,
                deliveryDays: 8,
                location: { address: "Johannesburg, South Africa" },
                isActive: true,
                status: "active",
                views: 145,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer3._id,
                title: "Database Design",
                description: "Design and optimize MongoDB databases.",
                category: "Programming",
                price: 1800,
                deliveryDays: 5,
                location: { address: "Pretoria, South Africa" },
                isActive: true,
                status: "active",
                views: 65,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer4._id,
                title: "Write SEO Blog Articles",
                description: "Professional search-optimized blog articles.",
                category: "Writing",
                price: 450,
                deliveryDays: 3,
                location: { address: "Cape Town, South Africa" },
                isActive: true,
                status: "active",
                views: 89,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer4._id,
                title: "Website Copywriting",
                description: "Professional website content and copywriting.",
                category: "Writing",
                price: 1500,
                deliveryDays: 5,
                location: { address: "Cape Town, South Africa" },
                isActive: true,
                status: "active",
                views: 130,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer5._id,
                title: "Social Media Management",
                description: "Manage your business social media presence.",
                category: "Digital Marketing",
                price: 2200,
                deliveryDays: 14,
                location: { address: "Johannesburg, South Africa" },
                isActive: true,
                status: "active",
                views: 190,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer5._id,
                title: "SEO Website Audit",
                description: "Technical SEO and website audit.",
                category: "Digital Marketing",
                price: 1200,
                deliveryDays: 4,
                location: { address: "Pretoria, South Africa" },
                isActive: true,
                status: "active",
                views: 110,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer6._id,
                title: "Professional Product Photography",
                description: "High quality product photography.",
                category: "Photography",
                price: 1600,
                deliveryDays: 5,
                location: { address: "Cape Town, South Africa" },
                isActive: true,
                status: "active",
                views: 155,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer6._id,
                title: "Photo Editing",
                description: "Professional photo retouching and editing.",
                category: "Photography",
                price: 500,
                deliveryDays: 2,
                location: { address: "Cape Town, South Africa" },
                isActive: true,
                status: "active",
                views: 70,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer7._id,
                title: "Create a Landing Page",
                description: "Conversion-focused responsive landing page.",
                category: "Web Development",
                price: 1200,
                deliveryDays: 4,
                location: { address: "Johannesburg, South Africa" },
                isActive: true,
                status: "active",
                views: 164,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer7._id,
                title: "Frontend Bug Fixes",
                description: "Fix responsive and frontend issues.",
                category: "Programming",
                price: 700,
                deliveryDays: 2,
                location: { address: "Pretoria, South Africa" },
                isActive: true,
                status: "active",
                views: 83,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer8._id,
                title: "UI/UX Website Design",
                description: "Modern website interface designed in Figma.",
                category: "UI/UX Design",
                price: 2800,
                deliveryDays: 7,
                location: { address: "Johannesburg, South Africa" },
                isActive: true,
                status: "active",
                views: 200,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            },
            {
                freelancerId: freelancer8._id,
                title: "Mobile App Wireframes",
                description: "Detailed mobile application wireframes.",
                category: "UI/UX Design",
                price: 1900,
                deliveryDays: 5,
                location: { address: "Pretoria, South Africa" },
                isActive: true,
                status: "active",
                views: 115,
                averageRating: 0,
                reviewCount: 0,
                imageUrl: ""
            }
        ]);

        console.log("Creating bookings...");

        const completedBooking = await Booking.create({
            gigId: gigs[0]._id,

            clientId: client._id,

            freelancerId: freelancer1._id,

            location: gigs[0].location,

            status: "completed",

            agreedPrice: 2500,

            bookingDate: new Date("2026-09-15"),

            completedAt: new Date("2026-09-22")
        });

        const activeBooking = await Booking.create({
            gigId: gigs[3]._id,

            clientId: client._id,

            freelancerId: freelancer2._id,

            location: gigs[3].location,

            status: "in_progress",

            agreedPrice: 600,

            bookingDate: new Date("2026-09-28")
        });

        const pendingBooking = await Booking.create({
            gigId: gigs[4]._id,

            clientId: client._id,

            freelancerId: freelancer2._id,

            location: gigs[4].location,

            status: "pending",

            agreedPrice: 1800,

            bookingDate: new Date("2026-10-10")
        });

        const additionalBookings = await Booking.create([
            {
                gigId: gigs[1]._id,
                clientId: client2._id,
                freelancerId: freelancer1._id,
                location: gigs[1].location,
                status: "completed",
                agreedPrice: gigs[1].price,
                bookingDate: daysAgo(48),
                completedAt: daysAgo(41)
            },
            {
                gigId: gigs[6]._id,
                clientId: client3._id,
                freelancerId: freelancer2._id,
                location: gigs[6].location,
                status: "in_progress",
                agreedPrice: gigs[6].price,
                bookingDate: daysAgo(12)
            },
            {
                gigId: gigs[7]._id,
                clientId: client4._id,
                freelancerId: freelancer2._id,
                location: gigs[7].location,
                status: "pending",
                agreedPrice: gigs[7].price,
                bookingDate: daysAgo(5)
            },
            {
                gigId: gigs[8]._id,
                clientId: client5._id,
                freelancerId: freelancer3._id,
                location: gigs[8].location,
                status: "accepted",
                agreedPrice: gigs[8].price,
                bookingDate: daysAgo(3)
            },
            {
                gigId: gigs[9]._id,
                clientId: client._id,
                freelancerId: freelancer3._id,
                location: gigs[9].location,
                status: "cancelled",
                agreedPrice: gigs[9].price,
                bookingDate: daysAgo(20)
            },
            {
                gigId: gigs[10]._id,
                clientId: client2._id,
                freelancerId: freelancer4._id,
                location: gigs[10].location,
                status: "completed",
                agreedPrice: gigs[10].price,
                bookingDate: daysAgo(30),
                completedAt: daysAgo(23)
            }
        ]);

        console.log("Creating reviews...");

        await Review.create([
            {
                gigId: gigs[0]._id,
                bookingId: completedBooking._id,
                clientId: client._id,
                freelancerId: freelancer1._id,
                rating: 5,
                comment: "Excellent website development. Highly recommended."
            },
            {
                gigId: gigs[1]._id,
                bookingId: additionalBookings[0]._id,
                clientId: client2._id,
                freelancerId: freelancer1._id,
                rating: 4,
                comment: "Great work and excellent communication."
            },
            {
                gigId: gigs[10]._id,
                bookingId: additionalBookings[5]._id,
                clientId: client2._id,
                freelancerId: freelancer4._id,
                rating: 5,
                comment: "Excellent content and professional delivery."
            }
        ]);

        console.log("Creating transactions...");

        await Transaction.create({
            bookingId: completedBooking._id,

            clientId: client._id,

            freelancerId: freelancer1._id,

            amount: 2500,

            platformFee: 250,

            freelancerAmount: 1912.5,

            taxAmount: 337.5,

            status: "completed",

            payoutDate: new Date("2026-09-23"),

            invoiceNumber: "INV-2026-0001"
        });

        await Transaction.create({
            bookingId: activeBooking._id,

            clientId: client._id,

            freelancerId: freelancer2._id,

            amount: 600,

            platformFee: 60,

            freelancerAmount: 459,

            taxAmount: 81,

            status: "pending",

            payoutDate: null,

            invoiceNumber: "INV-2026-0002"
        });

        await Transaction.create({
            bookingId: pendingBooking._id,
            clientId: client._id,
            freelancerId: freelancer2._id,
            amount: 1800,
            platformFee: 180,
            taxAmount: 243,
            freelancerAmount: 1377,
            status: "pending",
            invoiceNumber: "INV-2026-0003"
        });



        console.log("Creating analytics data...");

        const analyticsData = [];

        for (let i = 30; i >= 0; i--) {
            const date = new Date();

            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            analyticsData.push({
                date,
                activeUsers: 12 + (i % 8) * 4,
                apiRequests: 150 + (i % 10) * 35,
                bookings: i % 5,
                revenue: (i % 7) * 1250 + 1000
            });
        }

        await Analytics.insertMany(analyticsData);


        console.log("Creating API usage data...");

        const endpoints = [
            "/api/auth/me",
            "/api/auth/login",
            "/api/gigs",
            "/api/gigs/my-gigs",
            "/api/bookings/my-bookings",
            "/api/income",
            "/api/users/profile",
            "/api/reviews",
            "/api/transactions"
        ];

        const methods = ["GET", "POST", "PUT", "DELETE"];

        const apiUsageData = [];

        for (let day = 30; day >= 0; day--) {
            for (let request = 0; request < 15; request++) {
                const date = new Date();

                date.setDate(date.getDate() - day);
                date.setHours(
                    (request * 3) % 24,
                    (request * 7) % 60,
                    0,
                    0
                );

                const successful = request % 10 !== 0;

                apiUsageData.push({
                    date,
                    endpoint: endpoints[
                        (day + request) % endpoints.length
                    ],
                    method: methods[
                        request % methods.length
                    ],
                    statusCode: successful ? 200 : 500,
                    successful
                });
            }
        }

        await ApiUsage.insertMany(apiUsageData);

        console.log("Checking Admin account...");

        const adminExists = await User.findOne({
            role: "Admin"
        });

        if (!adminExists) {
            await User.create({
                name: "System Administrator",

                email: "admin@hustlehub.test",

                password: passwordHash,

                role: "Admin",

                provider: "local",

                isActive: true
            });

            console.log("Admin account created.");
        } else {
            console.log("Existing Admin account preserved.");
        }

        console.log("");
        console.log("Database seeded successfully.");
        console.log("");
        console.log("Test accounts:");
        console.log("------------------------------");

        console.log("Client:");
        console.log("Email: client@hustlehub.test");
        console.log("Password: Password123!");
        console.log("");

        console.log("Freelancer:");
        console.log("Email: john@hustlehub.test");
        console.log("Password: Password123!");
        console.log("");

        console.log("Freelancer:");
        console.log("Email: sarah@hustlehub.test");
        console.log("Password: Password123!");
        console.log("");

        console.log("Admin:");
        console.log("Email: admin@hustlehub.test");
        console.log("Password: Password123!");
        console.log("------------------------------");

    } catch (error) {
        console.error("Database seeding failed:");
        console.error(error);

        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
}

seedDatabase();
