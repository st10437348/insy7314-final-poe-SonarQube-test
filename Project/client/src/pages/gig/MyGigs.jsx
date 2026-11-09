/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Initial API loads update state asynchronously; API_URL is fixed at build time. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MyGigs() {
    const API_URL = import.meta.env.VITE_API_URL;

    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);



    async function loadGigs() {

        try {

            // Updated endpoint from /api/gigs/my to /api/gigs/my-gigs
            const response = await fetch(
                `${API_URL}/api/gigs/my-gigs`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load your gigs."
                );
            }

            setGigs(data.gigs || data || []);

        } catch (err) {
            console.error("Failed to load gigs:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadGigs();
    }, []);

    async function handleDelete(gigId) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this gig?"
        );

        if (!confirmed) {
            return;
        }

        setDeletingId(gigId);
        setError("");

        try {

            const response = await fetch(
                `${API_URL}/api/gigs/${gigId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to delete gig."
                );
            }

            setGigs((currentGigs) =>
                currentGigs.filter(
                    (gig) => (gig._id || gig.id) !== gigId
                )
            );
        } catch (err) {
            console.error("Failed to delete gig:", err);
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>My Gigs</h1>
                    <p>Loading your gigs...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <div>
                    <h1>My Gigs</h1>
                    <p>
                        Manage the services you offer to clients.
                    </p>
                </div>

                <Link
                    to="/create-gig"
                    className="button button-primary"
                >
                    Create New Gig
                </Link>
            </div>

            {error && (
                <div className="form-error">
                    {error}
                </div>
            )}

            {gigs.length === 0 ? (
                <section className="dashboard-panel">
                    <h2>No gigs yet</h2>

                    <p>
                        You have not created any gigs yet.
                    </p>

                    <Link
                        to="/create-gig"
                        className="button button-primary"
                    >
                        Create Your First Gig
                    </Link>
                </section>
            ) : (
                <section className="my-gigs-grid">
                    {gigs.map((gig) => {
                        const gigId = gig._id || gig.id;

                        return (
                            <article
                                className="gig-management-card"
                                key={gigId}
                            >
                                <div className="gig-management-header">
                                    <div>
                                        <h2>{gig.title}</h2>

                                        <span className="gig-category">
                                            {gig.category}
                                        </span>
                                    </div>

                                    <span
                                        className={
                                            gig.status === "paused"
                                                ? "status-badge status-warning"
                                                : "status-badge status-success"
                                        }
                                    >
                                        {gig.status === "completed" ? "Completed" : gig.status || "active"}
                                    </span>
                                </div>

                                <p className="gig-management-description">
                                    {gig.description}
                                </p>

                                <div className="gig-management-details">
                                    <div>
                                        <strong>
                                            R{Number(gig.price || 0).toLocaleString()}
                                        </strong>
                                        <span>Price</span>
                                    </div>

                                    <div>
                                        <strong>
                                            {gig.deliveryDays}
                                        </strong>
                                        <span>Days</span>
                                    </div>

                                    <div>
                                        <strong>
                                            {gig.views || 0}
                                        </strong>
                                        <span>Views</span>
                                    </div>

                                    <div>
                                        <strong>
                                            {gig.averageRating
                                                ? Number(
                                                    gig.averageRating
                                                ).toFixed(1)
                                                : "0.0"}
                                        </strong>
                                        <span>Rating</span>
                                    </div>
                                </div>

                                {gig.location?.address && (
                                    <p className="gig-location">
                                        {gig.location.address}
                                    </p>
                                )}

                                <div className="gig-management-actions">
                                    <Link
                                        to={`/gigs/${gigId}`}
                                        className="button button-secondary"
                                    >
                                        View
                                    </Link>

                                    {gig.status !== "completed" && (
                                        <>
                                            <Link
                                                to={`/gigs/${gigId}/edit`}
                                                className="button button-primary"
                                            >
                                                Edit
                                            </Link>

                                            <button
                                                type="button"
                                                className="button button-danger"
                                                disabled={deletingId === gigId}
                                                onClick={() => handleDelete(gigId)}
                                            >
                                                {deletingId === gigId ? "Deleting..." : "Delete"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}

export default MyGigs;
