/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Initial API loads update state asynchronously; API_URL is fixed at build time. */
import { useEffect, useState } from "react";
import AdminPagination from "../../components/dashboard/AdminPagination.jsx";

function AdminBookings() {
    const API_URL = import.meta.env.VITE_API_URL;

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const rowsPerPage = 10;

    const startIndex = (currentPage - 1) * rowsPerPage;

    const currentBookings = bookings.slice(
        startIndex,
        startIndex + rowsPerPage
    );
    useEffect(() => {
        setCurrentPage(1);
    }, [bookings.length]);

    async function loadBookings() {

        try {
            const response = await fetch(
                `${API_URL}/api/admin/bookings`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to load bookings."
                );
            }

            setBookings(
                data.bookings || data || []
            );
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

    useEffect(() => {
        loadBookings();
    }, []);

    async function handleStatusChange(
        booking,
        status
    ) {
        const bookingId =
            booking._id || booking.id;

        try {
            const response = await fetch(
                `${API_URL}/api/admin/bookings/${bookingId}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        status
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update booking."
                );
            }

            setBookings((currentBookings) =>
                currentBookings.map(
                    (currentBooking) =>
                        (
                            currentBooking._id ||
                            currentBooking.id
                        ) === bookingId
                            ? {
                                ...currentBooking,
                                ...(data.booking ||
                                    {}),
                                status
                            }
                            : currentBooking
                )
            );
        } catch (err) {
            console.error(
                "Failed to update booking:",
                err
            );

            setError(err.message);
        }
    }

    function getUserName(user, fallback) {
        if (
            user &&
            typeof user === "object"
        ) {
            return user.name || fallback;
        }

        return fallback;
    }

    function formatDate(date) {
        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleDateString(
            "en-ZA"
        );
    }

    if (loading) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>Booking Management</h1>
                    <p>
                        Loading bookings...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <h1>Booking Management</h1>
                <p>
                    View and manage bookings across
                    the platform.
                </p>
            </div>

            {error && (
                <div className="form-error">
                    {error}
                </div>
            )}

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Gig</th>
                            <th>Client</th>
                            <th>Freelancer</th>
                            <th>Price</th>
                            <th>Booking Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {bookings.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="admin-empty"
                                >
                                    No bookings found.
                                </td>
                            </tr>
                        ) : (
                                currentBookings.map(
                                    (booking) => {
                                    const bookingId =
                                        booking._id ||
                                        booking.id;

                                    const gig =
                                        booking.gigId;

                                    const gigTitle =
                                        gig &&
                                            typeof gig ===
                                            "object"
                                            ? gig.title
                                            : booking.gigTitle ||
                                            "Unknown";

                                    const clientName =
                                        getUserName(
                                            booking.clientId,
                                            booking.clientName ||
                                            "Unknown"
                                        );

                                    const freelancerName =
                                        getUserName(
                                            booking.freelancerId,
                                            booking.freelancerName ||
                                            "Unknown"
                                        );

                                    return (
                                        <tr
                                            key={
                                                bookingId
                                            }
                                        >
                                            <td>
                                                {
                                                    gigTitle
                                                }
                                            </td>

                                            <td>
                                                {
                                                    clientName
                                                }
                                            </td>

                                            <td>
                                                {
                                                    freelancerName
                                                }
                                            </td>

                                            <td>
                                                R
                                                {Number(
                                                    booking.agreedPrice ||
                                                    0
                                                ).toLocaleString(
                                                    "en-ZA"
                                                )}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    booking.bookingDate
                                                )}
                                            </td>

                                            <td>
                                                <select
                                                    value={
                                                        booking.status ||
                                                        "pending"
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleStatusChange(
                                                            booking,
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    <option value="pending">
                                                        Pending
                                                    </option>

                                                    <option value="accepted">
                                                        Accepted
                                                    </option>

                                                    <option value="in_progress">
                                                        In Progress
                                                    </option>

                                                    <option value="completed">
                                                        Completed
                                                    </option>

                                                    <option value="cancelled">
                                                        Cancelled
                                                    </option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                }
                            )
                        )}
                    </tbody>
                </table>
            </div>
            <AdminPagination
                currentPage={currentPage}
                totalItems={bookings.length}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
            />
        </main>
    );
}

export default AdminBookings;
