module.exports = {
    async up(db) {
        await db.collection("gigs").createIndex(
            { status: 1 },
            {
                name: "gigs_status"
            }
        );

        await db.collection("gigs").createIndex(
            { averageRating: -1 },
            {
                name: "gigs_averageRating"
            }
        );
    },

    async down(db) {
        await db.collection("gigs").dropIndex(
            "gigs_status"
        );

        await db.collection("gigs").dropIndex(
            "gigs_averageRating"
        );
    }
};