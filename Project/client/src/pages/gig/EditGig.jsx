/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Initial API loads update state asynchronously; API_URL is fixed at build time. */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function EditGig() {
    const { id } = useParams();
    const navigate = useNavigate();

    const API_URL = import.meta.env.VITE_API_URL;

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
        price: "",
        deliveryDays: "",
        address: "",
        status: "active",
        imageUrl: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [completed, setCompleted] = useState(false);



    async function loadGig() {

        try {
            const response = await fetch(
                `${API_URL}/api/gigs/my-gigs/${id}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load gig."
                );
            }

            const gig = data.gig || data;

            if (gig.status === "completed") {
                setCompleted(true);
                return;
            }

            setForm({
                title: gig.title || "",
                description: gig.description || "",
                category: gig.category || "",
                price: gig.price ?? "",
                deliveryDays: gig.deliveryDays ?? "",
                address: gig.location?.address || "",
                status: gig.status || "active",
                imageUrl: gig.imageUrl || ""
            });
        } catch (err) {
            console.error("Failed to load gig:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadGig();
    }, [id]);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSaving(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/api/gigs/${id}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: form.title.trim(),
                        description: form.description.trim(),
                        category: form.category.trim(),
                        price: Number(form.price),
                        deliveryDays: Number(form.deliveryDays),
                        location: {
                            address: form.address.trim()
                        },
                        status: form.status,
                        imageUrl: form.imageUrl.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update gig."
                );
            }

            await navigate("/my-gigs");
        } catch (err) {
            console.error("Failed to update gig:", err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>Edit Gig</h1>
                    <p>Loading gig...</p>
                </div>
            </main>
        );
    }

    if (completed) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>Completed Gig</h1>
                    <p>This gig is completed and cannot be edited.</p>
                </div>
                <Link to={`/gigs/${id}`} className="button button-secondary">View Gig</Link>
            </main>
        );
    }

    if (error && !form.title) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>Edit Gig</h1>
                </div>

                <div className="form-error">
                    {error}
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <h1>Edit Gig</h1>
                <p>
                    Update your service information.
                </p>
            </div>

            {error && (
                <div className="form-error">
                    {error}
                </div>
            )}

            <form
                className="auth-card gig-form"
                onSubmit={handleSubmit}
            >
                <div className="form-group">
                    <label htmlFor="title">
                        Title
                    </label>

                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={form.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">
                        Description
                    </label>

                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows="6"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="category">
                        Category
                    </label>

                    <input
                        id="category"
                        name="category"
                        type="text"
                        value={form.category}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="price">
                            Price
                        </label>

                        <input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="deliveryDays">
                            Delivery Days
                        </label>

                        <input
                            id="deliveryDays"
                            name="deliveryDays"
                            type="number"
                            min="1"
                            value={form.deliveryDays}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="address">
                        Address
                    </label>

                    <input
                        id="address"
                        name="address"
                        type="text"
                        value={form.address}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="status">
                        Status
                    </label>

                    <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option value="active">
                            Active
                        </option>

                        <option value="paused">
                            Paused
                        </option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="imageUrl">
                        Image URL
                    </label>

                    <input
                        id="imageUrl"
                        name="imageUrl"
                        type="url"
                        value={form.imageUrl}
                        onChange={handleChange}
                        placeholder="https://..."
                    />
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
                        onClick={() => { void navigate("/my-gigs"); }}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </main>
    );
}

export default EditGig;
