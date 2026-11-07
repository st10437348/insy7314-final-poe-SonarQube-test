module.exports = {
    async up(db) {
        await db.collection("users").createIndex(
            { email: 1 },
            { unique: true, name: "users_email_unique" }
        );

        await db.collection("users").createIndex(
            { firebaseUid: 1 },
            {
                unique: true,
                sparse: true,
                name: "users_firebaseUid_unique"
            }
        );

        await db.collection("users").createIndex(
            { role: 1 },
            { name: "users_role" }
        );
    },

    async down(db) {
        await db.collection("users").dropIndex("users_email_unique");
        await db.collection("users").dropIndex("users_firebaseUid_unique");
        await db.collection("users").dropIndex("users_role");
    }
};