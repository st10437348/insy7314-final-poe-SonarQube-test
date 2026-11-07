module.exports = {
    async up(db) {
        await db.collection("transactions").createIndex(
            { bookingId: 1 },
            { unique: true, name: "transactions_bookingId_unique" }
        );

        await db.collection("transactions").createIndex(
            { clientId: 1 },
            { name: "transactions_clientId" }
        );

        await db.collection("transactions").createIndex(
            { freelancerId: 1 },
            { name: "transactions_freelancerId" }
        );

        await db.collection("transactions").createIndex(
            { status: 1 },
            { name: "transactions_status" }
        );

        await db.collection("transactions").createIndex(
            { createdAt: -1 },
            { name: "transactions_createdAt" }
        );
    },

    async down(db) {
        await db.collection("transactions").dropIndex(
            "transactions_bookingId_unique"
        );

        await db.collection("transactions").dropIndex(
            "transactions_clientId"
        );

        await db.collection("transactions").dropIndex(
            "transactions_freelancerId"
        );

        await db.collection("transactions").dropIndex(
            "transactions_status"
        );

        await db.collection("transactions").dropIndex(
            "transactions_createdAt"
        );
    }
};