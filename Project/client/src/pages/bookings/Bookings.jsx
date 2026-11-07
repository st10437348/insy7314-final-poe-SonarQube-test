import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Bookings() {
    const { user } = useAuth();
    const location = useLocation();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    async function changeStatus(id, status) {
        setError("");
        try {
            const response = await fetch(`${API_URL}/api/bookings/${id}/status`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not update booking.");
            setBookings(current => current.map(booking =>
                booking._id === id ? { ...booking, status: data.booking.status } : booking
            ));
        } catch (err) {
            setError(err.message);
        }
    }

    useEffect(() => {
        async function loadBookings() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/bookings/my-bookings`,
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load bookings."
                    );
                }

                const data = await response.json();

                setBookings(data.bookings || data);
            } catch (err) {
                console.error(
                    "Failed to load bookings:",
                    err
                );

                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadBookings();
    }, [API_URL]);

    function formatDate(date) {
        if (!date) {
            return "Not specified";
        }

        return new Date(date).toLocaleDateString(
            "en-ZA",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
    }

    function getStatusClass(status) {
        return `booking-status booking-status-${status}`;
    }

    if (loading) {
        return (
            <main className="page-container">
                <h1>Bookings</h1>
                <p>Loading bookings...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page-container">
                <h1>Bookings</h1>

                <div className="form-error">
                    {error}
                </div>

                <p>
                    Make sure the API is running and the
                    bookings endpoint is available.
                </p>
            </main>
        );
    }

    return (
        <main className="page-container">

            <div className="page-heading">
                <h1>Bookings</h1>

                <p>
                    {user?.role === "Freelancer"
                        ? "Manage bookings for your services."
                        : "View and track your service bookings."}
                </p>
            </div>
            {location.state?.booked && <p role="status">Booking confirmed. A simulated transaction was recorded.</p>}
            {error && <div className="form-error" role="alert">{error}</div>}

            {bookings.length === 0 ? (
                <div className="empty-state">

                    <h2>No bookings yet</h2>

                    <p>
                        {user?.role === "Freelancer"
                            ? "Bookings for your gigs will appear here."
                            : "Your bookings will appear here."}
                    </p>

                    {user?.role === "Client" && (
                        <Link
                            to="/marketplace"
                            className="button empty-state-button"
                        >
                            Browse Marketplace
                        </Link>
                    )}

                </div>
            ) : (
                <div className="booking-list">

                    {bookings.map((booking) => {

                        const bookingId =
                            booking._id || booking.id;

                        const gig =
                            booking.gigId &&
                            typeof booking.gigId === "object"
                                ? booking.gigId
                                : null;

                        const gigTitle =
                            gig?.title ||
                            booking.gigTitle ||
                            "Gig";

                        return (
                            <article
                                className="booking-card"
                                key={bookingId}
                            >

                                <div className="booking-card-main">

                                    <div className="booking-card-header">

                                        <div>
                                            <span className="gig-category">
                                                {gig?.category ||
                                                    "Service"}
                                            </span>

                                            <h2>
                                                {gigTitle}
                                            </h2>
                                        </div>

                                        <span
                                            className={getStatusClass(
                                                booking.status
                                            )}
                                        >
                                            {booking.status?.replace(
                                                "_",
                                                " "
                                            )}
                                        </span>

                                    </div>

                                    <div className="booking-info-grid">

                                        <div>
                                            <span>
                                                Booking Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    booking.bookingDate
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Agreed Price
                                            </span>

                                            <strong>
                                                R
                                                {booking.agreedPrice ??
                                                    0}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Requested
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    booking.requestedAt
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Location
                                            </span>

                                            <strong>
                                                {booking.location
                                                    ?.address ||
                                                    "Not specified"}
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                                {gig?._id && (
                                    <div className="booking-card-footer">

                                        <Link
                                            to={`/gigs/${gig._id}`}
                                            className="button"
                                        >
                                            View Gig
                                        </Link>

                                        {user?.role === "Freelancer" && booking.status === "pending" &&
                                            <button type="button" className="button" onClick={() => changeStatus(bookingId, "accepted")}>Accept</button>}
                                        {user?.role === "Freelancer" && booking.status === "accepted" &&
                                            <button type="button" className="button" onClick={() => changeStatus(bookingId, "in_progress")}>Start work</button>}
                                        {user?.role === "Freelancer" && booking.status === "in_progress" &&
                                            <button type="button" className="button" onClick={() => changeStatus(bookingId, "completed")}>Mark completed</button>}
                                        {user?.role === "Client" && ["pending", "accepted"].includes(booking.status) &&
                                            <button type="button" className="button button-secondary" onClick={() => changeStatus(bookingId, "cancelled")}>Cancel</button>}

                                    </div>
                                )}

                            </article>
                        );
                    })}

                </div>
            )}

        </main>
    );
}

export default Bookings;
