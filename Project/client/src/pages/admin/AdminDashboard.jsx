/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Initial API loads update state asynchronously; API_URL is fixed at build time. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function AdminDashboard() {
    const API_URL = import.meta.env.VITE_API_URL;

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");



    async function loadDashboard() {

        try {
            const response = await fetch(
                `${API_URL}/api/admin/`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to load admin dashboard."
                );
            }

            setDashboard(data.dashboard || data);
        } catch (err) {
            console.error(
                "Failed to load admin dashboard:",
                err
            );

            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadDashboard();
    }, []);

    function formatCurrency(value) {
        return `R${Number(value || 0).toLocaleString(
            "en-ZA",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )}`;
    }

    if (loading) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>Admin Dashboard</h1>
                    <p>Loading dashboard...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>Admin Dashboard</h1>
                </div>

                <div className="form-error">
                    {error}
                </div>
            </main>
        );
    }

    const stats = dashboard || {};

    return (
        <main className="page-container">
            <div className="page-heading">
                <h1>Admin Dashboard</h1>
                <p>
                    Overview of HustleHub+ activity and
                    platform performance.
                </p>
            </div>

            <section className="stats-grid">
                <div className="stat-card">
                    <span className="stat-label">
                        Total Users
                    </span>

                    <strong className="stat-value">
                        {stats.totalUsers || 0}
                    </strong>
                </div>

                <div className="stat-card">
                    <span className="stat-label">
                        Freelancers
                    </span>

                    <strong className="stat-value">
                        {stats.totalFreelancers || 0}
                    </strong>
                </div>

                <div className="stat-card">
                    <span className="stat-label">
                        Clients
                    </span>

                    <strong className="stat-value">
                        {stats.totalClients || 0}
                    </strong>
                </div>

                <div className="stat-card">
                    <span className="stat-label">
                        Active Gigs
                    </span>

                    <strong className="stat-value">
                        {stats.activeGigs || 0}
                    </strong>
                </div>
            </section>

            <section className="stats-grid">
                <div className="stat-card">
                    <span className="stat-label">
                        Total Bookings
                    </span>

                    <strong className="stat-value">
                        {stats.totalBookings || 0}
                    </strong>
                </div>

                <div className="stat-card">
                    <span className="stat-label">
                        Completed Bookings
                    </span>

                    <strong className="stat-value">
                        {stats.completedBookings || 0}
                    </strong>
                </div>

                <div className="stat-card">
                    <span className="stat-label">
                        Platform Revenue
                    </span>

                    <strong className="stat-value">
                        {formatCurrency(
                            stats.platformRevenue
                        )}
                    </strong>
                </div>

                <div className="stat-card">
                    <span className="stat-label">
                        API Requests
                    </span>

                    <strong className="stat-value">
                        {stats.apiRequests || 0}
                    </strong>
                </div>
            </section>

            <section className="dashboard-panel">
                <div className="panel-heading">
                    <div>
                        <h2>Admin Management</h2>

                        <p>
                            Manage the platform from the
                            sections below.
                        </p>
                    </div>
                </div>

                <div className="admin-management-grid">
                    <Link
                        to="/admin/users"
                        className="admin-management-card"
                    >
                        <h3>User Management</h3>

                        <p>
                            View, edit, disable and delete
                            user accounts.
                        </p>
                    </Link>

                    <Link
                        to="/admin/gigs"
                        className="admin-management-card"
                    >
                        <h3>Gig Management</h3>

                        <p>
                            Review and manage gigs created
                            by freelancers.
                        </p>
                    </Link>

                    <Link
                        to="/admin/bookings"
                        className="admin-management-card"
                    >
                        <h3>Booking Management</h3>

                        <p>
                            View and manage platform
                            bookings.
                        </p>
                    </Link>

                    <Link
                        to="/admin/analytics"
                        className="admin-management-card"
                    >
                        <h3>Analytics</h3>

                        <p>
                            View platform usage and
                            business statistics.
                        </p>
                    </Link>

                    <Link
                        to="/admin/api-usage"
                        className="admin-management-card"
                    >
                        <h3>API Usage</h3>

                        <p>
                            Monitor API requests,
                            failures and response times.
                        </p>
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default AdminDashboard;
