module.exports = {
    async up(db) {
        await db.collection("gigs").createIndex(
            { freelancerId: 1 },
            { name: "gigs_freelancerId" }
        );

        await db.collection("gigs").createIndex(
            { category: 1 },
            { name: "gigs_category" }
        );

        await db.collection("gigs").createIndex(
            { isActive: 1 },
            { name: "gigs_isActive" }
        );

        await db.collection("gigs").createIndex(
            { createdAt: -1 },
            { name: "gigs_createdAt" }
        );
    },

    async down(db) {
        await db.collection("gigs").dropIndex("gigs_freelancerId");
        await db.collection("gigs").dropIndex("gigs_category");
        await db.collection("gigs").dropIndex("gigs_isActive");
        await db.collection("gigs").dropIndex("gigs_createdAt");
    }
};