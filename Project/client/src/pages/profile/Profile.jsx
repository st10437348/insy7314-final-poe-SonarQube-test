import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";


function Profile() {
    const API_URL = import.meta.env.VITE_API_URL;
    const [deletingId, setDeletingId] = useState(null);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        bio: "",
        skills: ""
    });
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadProfile = async () => {

            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/users/profile`,
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        data.message ||
                        "Failed to load profile."
                    );
                }

                const profile = data.data || data.user || data;

                setForm({
                    fullName: profile.name || "",
                    email: profile.email || "",
                    bio: profile.bio || "",
                    skills: Array.isArray(profile.skills)
                        ? profile.skills.join(", ")
                        : profile.skills || ""
                });
            } catch (err) {
                console.error("Profile loading error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        void loadProfile();
    }, [API_URL]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));

        // Clear messages when the user starts editing.
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/api/users/profile`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fullName: form.fullName.trim(),
                        bio: form.bio.trim(),
                        skills: form.skills
                            .split(",")
                            .map((skill) => skill.trim())
                            .filter(Boolean)
                    })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    "Failed to update profile."
                );
            }

            // Update the displayed data with the response from the server.
            const updatedUser = data.data || data.user || data;

            setForm((current) => ({
                ...current,
                fullName: updatedUser.name || current.fullName,
                bio: updatedUser.bio || "",
                skills: Array.isArray(updatedUser.skills)
                    ? updatedUser.skills.join(", ")
                    : current.skills
            }));

            setSuccess("Profile updated successfully.");
        } catch (err) {
            console.error("Profile update error:", err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    async function handleDelete() {
        const confirmed = window.confirm(
            "Are you sure you want to delete your account?"
        );

        if (!confirmed) {
            return;
        }

        try {

            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/api/users/profile`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data = await response.json().catch(() => ({}));;

            if (!response.ok) {
                throw new Error(data.error ||
                    data.message || "Failed to delete account."
                );
            }

            setSuccess("Your account has been deleted");

            await logout();

            await navigate("/");

        } catch (err) {
            console.error("Failed to delete account:", err);
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>My Profile</h1>
                    <p>Loading your profile...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">

            <div className="page-heading">
                <h1>My Profile</h1>
                <p>Manage your HustleHub+ account information.</p>
            </div>

            {error && (
                <div className="form-error" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="form-success" role="status">
                    {success}
                </div>
            )}

            <div className="profile-layout">

                <aside className="profile-sidebar">

                    <div className="profile-avatar">
                        {form.fullName
                            ? form.fullName.charAt(0).toUpperCase()
                            : "U"}
                    </div>

                    <h2>{form.fullName || "User"}</h2>

                    <p>{form.email}</p>

                    {user?.role && (
                        <span className="profile-role">
                            {user.role}
                        </span>
                    )}

                    <div className="connected-accounts">

                        <div className="account-badge">
                            Google Ready
                        </div>

                        <div className="account-badge">
                            Microsoft Ready
                        </div>

                    </div>

                </aside>

                <form
                    className="form-card profile-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">
                        <label htmlFor="fullName">
                            Full Name
                        </label>

                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={form.fullName}
                            onChange={handleChange}
                            required
                            minLength={2}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            disabled
                        />

                        <small>
                            Email addresses cannot be changed here.
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">
                            Bio
                        </label>

                        <textarea
                            id="bio"
                            name="bio"
                            rows="5"
                            value={form.bio}
                            onChange={handleChange}
                            maxLength={500}
                            placeholder="Tell clients about yourself..."
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="skills">
                            Skills
                        </label>

                        <input
                            id="skills"
                            name="skills"
                            type="text"
                            value={form.skills}
                            onChange={handleChange}
                            placeholder="React, JavaScript, UI Design"
                        />

                        <small>
                            Separate each skill with a comma.
                        </small>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            className="button button-danger"
                            disabled={deletingId}
                            onClick={() => handleDelete()}
                            >
                                {deletingId ? "Deleting..." : "Delete"}
                        
                        </button>
                    </div>

                </form>

            </div>

        </main>
    );
}

export default Profile;
