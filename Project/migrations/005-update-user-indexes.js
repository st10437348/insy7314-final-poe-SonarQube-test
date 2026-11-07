module.exports = {
    async up(db) {
        await db.collection("users").createIndex(
            { isActive: 1 },
            {
                name: "users_isActive"
            }
        );

        await db.collection("users").createIndex(
            { provider: 1 },
            {
                name: "users_provider"
            }
        );
    },

    async down(db) {
        await db.collection("users").dropIndex(
            "users_isActive"
        );

        await db.collection("users").dropIndex(
            "users_provider"
        );
    }
};