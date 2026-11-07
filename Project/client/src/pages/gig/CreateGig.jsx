import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateGig() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
        price: "",
        deliveryDays: "",
        address: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {

            // Safely parse numeric fields
            const parsedPrice = parseFloat(form.price);
            const parsedDeliveryDays = parseInt(form.deliveryDays, 10);

            if (isNaN(parsedPrice) || parsedPrice < 0) {
                throw new Error("Please enter a valid price.");
            }

            if (isNaN(parsedDeliveryDays) || parsedDeliveryDays < 1) {
                throw new Error("Delivery days must be at least 1.");
            }

            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                category: form.category.trim(),
                price: parsedPrice,
                deliveryDays: parsedDeliveryDays,
                location: {
                    address: form.address.trim()
                }
            };

            const response = await fetch(
                `${API_URL}/api/gigs`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create gig."
                );
            }

            setSuccess("Gig created successfully.");

            const createdGig = data.gig || data;
            const gigId = createdGig._id || createdGig.id;

            if (gigId) {
                navigate(`/gigs/${gigId}`);
            } else {
                navigate("/my-gigs");
            }
        } catch (err) {
            console.error("Failed to create gig:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <h1>Create a Gig</h1>
                <p>
                    Create a service that clients can discover and book.
                </p>
            </div>

            {error && (
                <div className="form-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="form-success">
                    {success}
                </div>
            )}

            <form
                className="form-card"
                onSubmit={handleSubmit}
            >
                <div className="form-group">
                    <label htmlFor="title">
                        Gig Title
                    </label>

                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="e.g. Build a React Website"
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
                        placeholder="Describe the service you provide..."
                        rows="6"
                        required
                    />
                </div>

                <div className="form-row">
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
                            placeholder="e.g. Web Development"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="price">
                            Price (R)
                        </label>

                        <input
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={handleChange}
                            placeholder="2500"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="deliveryDays">
                        Delivery Time (days)
                    </label>

                    <input
                        id="deliveryDays"
                        name="deliveryDays"
                        type="number"
                        min="1"
                        value={form.deliveryDays}
                        onChange={handleChange}
                        placeholder="7"
                        required
                    />
                </div>

                <div className="form-section">
                    <h2>Gig Location</h2>
                    <p>
                        This location will be associated with the service.
                    </p>
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
                        placeholder="Pretoria, South Africa"
                        required
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => navigate("/dashboard")}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Gig..."
                            : "Create Gig"}
                    </button>
                </div>
            </form>
        </main>
    );
}

export default CreateGig;
