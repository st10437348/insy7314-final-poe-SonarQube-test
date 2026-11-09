import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function GigDetails() {
    const { id } = useParams();
    const { user, loading: authLoading } = useAuth();
    const userRole = user?.role;

    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [historical, setHistorical] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (authLoading) return;
        async function loadGig() {
            try {
                setLoading(true);
                setError("");

                let response = await fetch(
                    `${API_URL}/api/gigs/${id}`
                );

                let historyView = false;
                if (response.status === 404 && userRole) {
                    response = await fetch(`${API_URL}/api/gigs/history/${id}`, {
                        credentials: "include"
                    });
                    historyView = response.ok;
                }

                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error("You do not have access to this gig.");
                    }
                    if (response.status === 404) {
                        throw new Error("Gig not found.");
                    }

                    throw new Error("Failed to load gig.");
                }

                const data = await response.json();

                setGig(data.gig || data);
                setHistorical(historyView);
            } catch (err) {
                console.error("Failed to load gig:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        void loadGig();
    }, [API_URL, id, userRole, authLoading]);

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
    const backTo = historical
        ? userRole === "Freelancer" ? "/my-gigs" : userRole === "Admin" ? "/admin/gigs" : "/bookings"
        : "/marketplace";
    const backLabel = historical
        ? userRole === "Freelancer" ? "My Gigs" : userRole === "Admin" ? "Gig Management" : "Bookings"
        : "Marketplace";

    return (
        <main className="page-container">

            <Link
                to={backTo}
                className="back-link"
            >
                ← Back to {backLabel}
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
                                    {gig.status === "completed"
                                        ? "Completed"
                                        : gig.status === "paused"
                                            ? "Paused"
                                            : historical
                                                ? "Booked"
                                                : gig.isActive ? "Available" : "Unavailable"}
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

                    {gig.status === "completed" ? (
                        <p className="booking-notice">This gig is completed and cannot be booked again.</p>
                    ) : historical || !gig.isActive || gig.status !== "active" ? (
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
