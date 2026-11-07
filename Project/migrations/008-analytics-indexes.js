module.exports = {
    async up(db) {
        await db.collection("analytics").createIndex(
            { date: 1 },
            {
                unique: true,
                name: "analytics_date_unique"
            }
        );
    },

    async down(db) {
        await db.collection("analytics").dropIndex(
            "analytics_date_unique"
        );
    }
};