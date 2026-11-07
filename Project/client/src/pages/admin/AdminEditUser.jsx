/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Initial API loads update state asynchronously; API_URL is fixed at build time. */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function AdminEditUser() {
    const { id } = useParams();
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL;

    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "Client",
        bio: "",
        skills: "",
        isActive: true
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");



    async function loadUser() {

        try {
            const response = await fetch(
                `${API_URL}/api/admin/users/${id}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load user."
                );
            }

            const user = data.user || data;

            setForm({
                name: user.name || "",
                email: user.email || "",
                role: user.role || "Client",
                bio: user.bio || "",
                skills: Array.isArray(user.skills)
                    ? user.skills.join(", ")
                    : "",
                isActive: user.isActive !== false
            });
        } catch (err) {
            console.error("Failed to load user:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadUser();
    }, [id]);

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSaving(true);
        setError("");

        try {
            const skills = form.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean);

            const response = await fetch(
                `${API_URL}/api/admin/users/${id}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: form.name.trim(),
                        email: form.email.trim(),
                        role: form.role,
                        bio: form.bio.trim(),
                        skills,
                        isActive: form.isActive
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update user."
                );
            }

            await navigate("/admin/users");
        } catch (err) {
            console.error("Failed to update user:", err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>Edit User</h1>
                    <p>Loading user...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <h1>Edit User</h1>
                <p>Update the user's account details.</p>
            </div>

            {error && (
                <div className="form-error">
                    {error}
                </div>
            )}

            <form
                className="auth-card"
                onSubmit={handleSubmit}
            >
                <div className="form-group">
                    <label htmlFor="name">
                        Name
                    </label>

                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        required
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
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="role">
                        Role
                    </label>

                    <select
                        id="role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                    >
                        <option value="Client">
                            Client
                        </option>

                        <option value="Freelancer">
                            Freelancer
                        </option>

                        <option value="Admin">
                            Admin
                        </option>
                    </select>
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
                        placeholder="React, JavaScript, Design"
                    />

                    <small>
                        Separate skills with commas.
                    </small>
                </div>

                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={form.isActive}
                            onChange={handleChange}
                        />

                        {" "}Account active
                    </label>
                </div>

                <div className="gig-management-actions">
                    <button
                        type="submit"
                        className="button button-primary"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </button>

                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={() =>
                            void navigate("/admin/users")
                        }
                        disabled={saving}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </main>
    );
}

export default AdminEditUser;
