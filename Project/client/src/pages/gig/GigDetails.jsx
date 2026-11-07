import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function GigDetails() {
    const { id } = useParams();
    const { user } = useAuth();

    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        async function loadGig() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/gigs/${id}`
                );

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Gig not found.");
                    }

                    throw new Error("Failed to load gig.");
                }

                const data = await response.json();

                setGig(data.gig || data);
            } catch (err) {
                console.error("Failed to load gig:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        void loadGig();
    }, [API_URL, id]);

    if (loading) {
        return (
            <main className="page-container">
                <p>Loading gig...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page-container">
                <div className="form-error">
                    {error}
                </div>

                <Link to="/marketplace">
                    Back to Marketplace
                </Link>
            </main>
        );
    }

    if (!gig) {
        return (
            <main className="page-container">
                <h1>Gig not found</h1>

                <Link to="/marketplace">
                    Back to Marketplace
                </Link>
            </main>
        );
    }

    const gigId = gig._id || gig.id;

    return (
        <main className="page-container">

            <Link
                to="/marketplace"
                className="back-link"
            >
                ← Back to Marketplace
            </Link>

            <div className="gig-details">

                <div className="gig-details-main">

                    <span className="gig-category">
                        {gig.category}
                    </span>

                    <h1>{gig.title}</h1>

                    <p className="gig-description">
                        {gig.description}
                    </p>

                    <div className="gig-details-section">
                        <h2>Service Details</h2>

                        <div className="gig-info-grid">

                            <div>
                                <span className="gig-info-label">
                                    Price
                                </span>

                                <strong>
                                    R{gig.price}
                                </strong>
                            </div>

                            <div>
                                <span className="gig-info-label">
                                    Delivery
                                </span>

                                <strong>
                                    {gig.deliveryDays} days
                                </strong>
                            </div>

                            <div>
                                <span className="gig-info-label">
                                    Category
                                </span>

                                <strong>
                                    {gig.category}
                                </strong>
                            </div>

                            <div>
                                <span className="gig-info-label">
                                    Status
                                </span>

                                <strong>
                                    {gig.isActive
                                        ? "Available"
                                        : "Unavailable"}
                                </strong>
                            </div>

                        </div>
                    </div>

                    {gig.location && (
                        <div className="gig-details-section">

                            <h2>Location</h2>

                            <p>
                                {gig.location.address}
                            </p>

                        </div>
                    )}

                </div>

                <aside className="gig-booking-card">

                    <div>
                        <span className="gig-booking-label">
                            Starting from
                        </span>

                        <div className="gig-price">
                            R{gig.price}
                        </div>

                        <p>
                            Delivery in {gig.deliveryDays} days
                        </p>
                    </div>

                    {!gig.isActive || gig.status !== "active" ? (
                        <button
                            type="button"
                            disabled
                        >
                            Gig Unavailable
                        </button>
                    ) : !user ? (
                        <Link
                            to="/login"
                            state={{
                                from: `/gigs/${gigId}`
                            }}
                            className="button"
                        >
                            Login to Book
                        </Link>
                    ) : user.role !== "Client" ? (
                        <p className="booking-notice">
                            Only clients can book gigs.
                        </p>
                    ) : (
                        <Link
                            to={`/bookings/new?gigId=${gigId}`}
                            className="button"
                        >
                            Book This Gig
                        </Link>
                    )}

                </aside>

            </div>

        </main>
    );
}

export default GigDetails;
