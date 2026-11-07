module.exports = {
    async up(db) {
        await db.collection("reviews").createIndex(
            { gigId: 1 },
            {
                name: "reviews_gigId"
            }
        );

        await db.collection("reviews").createIndex(
            { freelancerId: 1 },
            {
                name: "reviews_freelancerId"
            }
        );

        await db.collection("reviews").createIndex(
            { clientId: 1 },
            {
                name: "reviews_clientId"
            }
        );

        await db.collection("reviews").createIndex(
            { bookingId: 1 },
            {
                unique: true,
                name: "reviews_bookingId_unique"
            }
        );
    },

    async down(db) {
        await db.collection("reviews").dropIndex(
            "reviews_gigId"
        );

        await db.collection("reviews").dropIndex(
            "reviews_freelancerId"
        );

        await db.collection("reviews").dropIndex(
            "reviews_clientId"
        );

        await db.collection("reviews").dropIndex(
            "reviews_bookingId_unique"
        );
    }
};