/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Initial API loads update state asynchronously; API_URL is fixed at build time. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminPagination from "../../components/dashboard/AdminPagination.jsx";

function AdminGigs() {
    const API_URL = import.meta.env.VITE_API_URL;

    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const rowsPerPage = 10;

    const startIndex = (currentPage - 1) * rowsPerPage;

    const currentGigs = gigs.slice(
        startIndex,
        startIndex + rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [gigs.length]);

    async function loadGigs() {

        try {
            const response = await fetch(
                `${API_URL}/api/admin/gigs`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load gigs."
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
        loadGigs();
    }, []);

    async function handleDelete(gig) {
        const gigId = gig._id || gig.id;

        const confirmed = window.confirm(
            `Delete "${gig.title}"? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/admin/gigs/${gigId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to delete gig."
                );
            }

            setGigs((currentGigs) =>
                currentGigs.filter(
                    (currentGig) =>
                        (currentGig._id ||
                            currentGig.id) !== gigId
                )
            );
        } catch (err) {
            console.error("Failed to delete gig:", err);
            setError(err.message);
        }
    }

    async function handleStatusChange(gig, status) {
        const gigId = gig._id || gig.id;

        try {
            const response = await fetch(
                `${API_URL}/api/admin/gigs/${gigId}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
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
                    "Failed to update gig."
                );
            }

            setGigs((currentGigs) =>
                currentGigs.map((currentGig) =>
                    (currentGig._id ||
                        currentGig.id) === gigId
                        ? {
                            ...currentGig,
                            ...(data.gig || {}),
                            status
                        }
                        : currentGig
                )
            );
        } catch (err) {
            console.error(
                "Failed to update gig:",
                err
            );

            setError(err.message);
        }
    }

    if (loading) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>Gig Management</h1>
                    <p>Loading gigs...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <h1>Gig Management</h1>
                <p>
                    View and manage gigs across the
                    platform.
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
                            <th>Title</th>
                            <th>Freelancer</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Views</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {gigs.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="admin-empty"
                                >
                                    No gigs found.
                                </td>
                            </tr>
                        ) : (
                                currentGigs.map((gig) => {
                                  const gigId =
                                    gig._id || gig.id;

                                const freelancer =
                                    gig.freelancerId;

                                const freelancerName =
                                    typeof freelancer ===
                                        "object"
                                        ? freelancer.name
                                        : gig.freelancerName ||
                                        "Unknown";

                                return (
                                    <tr key={gigId}>
                                        <td>
                                            {gig.title}
                                        </td>

                                        <td>
                                            {
                                                freelancerName
                                            }
                                        </td>

                                        <td>
                                            {gig.category}
                                        </td>

                                        <td>
                                            R
                                            {Number(
                                                gig.price || 0
                                            ).toLocaleString(
                                                "en-ZA"
                                            )}
                                        </td>

                                        <td>
                                            <select
                                                value={
                                                    gig.status ||
                                                    "active"
                                                }
                                                onChange={(event) =>
                                                    handleStatusChange(
                                                        gig,
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            >
                                                <option value="active">
                                                    Active
                                                </option>

                                                <option value="paused">
                                                    Paused
                                                </option>

                                                <option value="deleted">
                                                    Deleted
                                                </option>
                                            </select>
                                        </td>

                                        <td>
                                            {gig.views ||
                                                0}
                                        </td>

                                        <td>
                                            <div className="admin-table-actions">
                                                <Link
                                                    to={`/gigs/${gigId}`}
                                                    className="button button-secondary"
                                                >
                                                    View
                                                </Link>

                                                <button
                                                    type="button"
                                                    className="button button-danger"
                                                    onClick={() =>
                                                        handleDelete(
                                                            gig
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            <AdminPagination
                currentPage={currentPage}
                totalItems={gigs.length}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
            />
        </main>
    );
}

export default AdminGigs;
