module.exports = {
    async up(db) {
        await db.collection("bookings").createIndex(
            { gigId: 1 },
            { name: "bookings_gigId" }
        );

        await db.collection("bookings").createIndex(
            { clientId: 1 },
            { name: "bookings_clientId" }
        );

        await db.collection("bookings").createIndex(
            { freelancerId: 1 },
            { name: "bookings_freelancerId" }
        );

        await db.collection("bookings").createIndex(
            { status: 1 },
            { name: "bookings_status" }
        );

        await db.collection("bookings").createIndex(
            { bookingDate: 1 },
            { name: "bookings_bookingDate" }
        );
    },

    async down(db) {
        await db.collection("bookings").dropIndex("bookings_gigId");
        await db.collection("bookings").dropIndex("bookings_clientId");
        await db.collection("bookings").dropIndex("bookings_freelancerId");
        await db.collection("bookings").dropIndex("bookings_status");
        await db.collection("bookings").dropIndex("bookings_bookingDate");
    }
};