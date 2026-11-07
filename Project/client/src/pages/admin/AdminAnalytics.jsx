/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Initial API loads update state asynchronously; API_URL is fixed at build time. */
import { useEffect, useState } from "react";

import AdminPagination from "../../components/dashboard/AdminPagination.jsx";

function AdminAnalytics() {
    const API_URL = import.meta.env.VITE_API_URL;

    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const rowsPerPage = 10;
    
    const startIndex = (currentPage - 1) * rowsPerPage;

    const currentAnalytics = analytics.slice(
        startIndex,
        startIndex + rowsPerPage
    );

    async function loadAnalytics() {

        try {
            const response = await fetch(
                `${API_URL}/api/admin/analytics`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to load analytics."
                );
            }

            setAnalytics(
                data.analytics || data || []
            );
        } catch (err) {
            console.error(
                "Failed to load analytics:",
                err
            );

            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAnalytics();
        setCurrentPage(1);
    }, [analytics.length]);

    function formatDate(date) {
        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleDateString(
            "en-ZA"
        );
    }

    const totalActiveUsers = analytics.reduce(
        (total, item) =>
            total + Number(item.activeUsers || 0),
        0
    );

    const totalApiRequests = analytics.reduce(
        (total, item) =>
            total + Number(item.apiRequests || 0),
        0
    );

    const totalBookings = analytics.reduce(
        (total, item) =>
            total + Number(item.bookings || 0),
        0
    );

    const totalRevenue = analytics.reduce(
        (total, item) =>
            total + Number(item.revenue || 0),
        0
    );

    if (loading) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>Analytics</h1>
                    <p>
                        Loading analytics...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <h1>Analytics</h1>
                <p>
                    Platform usage and performance
                    information.
                </p>
            </div>

            {error && (
                <div className="form-error">
                    {error}
                </div>
            )}

            <div className="dashboard-stats">
                <div className="stat-card">
                    <span>
                        Active Users
                    </span>
                    <strong>
                        {totalActiveUsers}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>
                        API Requests
                    </span>
                    <strong>
                        {totalApiRequests}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>
                        Bookings
                    </span>
                    <strong>
                        {totalBookings}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>
                        Revenue
                    </span>
                    <strong>
                        R
                        {totalRevenue.toLocaleString(
                            "en-ZA"
                        )}
                    </strong>
                </div>
            </div>

            <div className="dashboard-panel">
                <h2>Daily Analytics</h2>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Active Users</th>
                                <th>API Requests</th>
                                <th>Bookings</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>

                        <tbody>
                            {analytics.length ===
                                0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="admin-empty"
                                    >
                                        No analytics
                                        data found.
                                    </td>
                                </tr>
                            ) : (
                                    currentAnalytics.map(
                                        (item, index) => (
                                        <tr
                                            key={
                                                item._id ||
                                                item.id || index
                                            }
                                        >
                                            <td>
                                                {formatDate(
                                                    item.date
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    item.activeUsers
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.apiRequests
                                                }
                                            </td>

                                            <td>
                                                {
                                                    item.bookings
                                                }
                                            </td>

                                            <td>
                                                R
                                                {Number(
                                                    item.revenue ||
                                                    0
                                                ).toLocaleString(
                                                    "en-ZA"
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>               
                </div>

                    <AdminPagination
                        currentPage={currentPage}
                        totalItems={analytics.length}
                        rowsPerPage={rowsPerPage}
                        onPageChange={setCurrentPage}
                    />
            </div>
        </main>
    );
}

export default AdminAnalytics;
