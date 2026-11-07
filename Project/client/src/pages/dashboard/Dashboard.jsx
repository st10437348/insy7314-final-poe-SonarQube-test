import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Dashboard() {
    const API_URL = import.meta.env.VITE_API_URL;
    const money = value => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(value) || 0);

    const [dashboard, setDashboard] = useState({
        activeGigs: 0,
        bookingsCount: 0,
        grossIncome: 0,
        platformFees: 0,
        taxAmount: 0,
        netIncome: 0,
        recentBookings: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoading(true);
                setError("");

                const authHeaders = { "Content-Type": "application/json" };

                // Fetch Gigs, Bookings, and Transactions concurrently
                const [gigsRes, bookingsRes, incomeRes] = await Promise.all([
                    fetch(`${API_URL}/api/gigs/my-gigs`, {
                        credentials: "include",
                        headers: authHeaders
                    }).catch(() => null),
                    fetch(`${API_URL}/api/bookings/my-bookings`, {
                        credentials: "include",
                        headers: authHeaders
                    }).catch(() => null),
                    fetch(`${API_URL}/api/income`, {
                        credentials: "include",
                        headers: authHeaders
                    }).catch(() => null)
                ]);

                // Parse responses
                const gigsData = gigsRes && gigsRes.ok ? await gigsRes.json() : [];
                const bookingsData = bookingsRes && bookingsRes.ok ? await bookingsRes.json() : [];
                const incomeData = incomeRes && incomeRes.ok ? await incomeRes.json() : null;

                const gigsList = Array.isArray(gigsData) ? gigsData : gigsData.gigs || [];
                const bookingsList = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || [];
                if (!incomeData) throw new Error("Income data is unavailable.");
                const { gross, fees, tax, net } = incomeData.income.summary;

                setDashboard({
                    activeGigs: gigsList.length,
                    bookingsCount: bookingsList.length,
                    grossIncome: gross,
                    platformFees: fees,
                    taxAmount: tax,
                    netIncome: net,
                    recentBookings: bookingsList.slice(0, 5)
                });
            } catch (err) {
                console.error("Dashboard calculation error:", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, [API_URL]);

    if (loading) {
        return (
            <main className="page-container">
                <h1>Dashboard</h1>
                <p>Loading dashboard...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page-container">
                <h1>Dashboard</h1>
                <div className="form-error">{error}</div>
            </main>
        );
    }

    return (
        <main className="page-container">

            <div className="page-heading">
                <h1>Freelancer Dashboard</h1>
                <p>Manage your gigs, bookings and income.</p>
            </div>

            <div className="stats-grid">

                <div className="stat-card">
                    <span>Active Gigs</span>
                    <strong>{dashboard.activeGigs}</strong>
                </div>

                <div className="stat-card">
                    <span>Bookings</span>
                    <strong>{dashboard.bookingsCount}</strong>
                </div>

                <div className="stat-card">
                    <span>Gross Income</span>
                    <strong>{money(dashboard.grossIncome)}</strong>
                </div>

                <div className="stat-card">
                    <span>Estimated Tax</span>
                    <strong>{money(dashboard.taxAmount)}</strong>
                </div>

            </div>

            <div className="dashboard-grid">

                <section className="dashboard-panel">

                    <h2>Income Summary</h2>

                    <div className="income-summary">

                        <div>
                            <span>Gross Income</span>
                            <strong>{money(dashboard.grossIncome)}</strong>
                        </div>

                        <div>
                            <span>Platform Fees</span>
                            <strong>{money(dashboard.platformFees)}</strong>
                        </div>

                        <div>
                            <span>Estimated Tax</span>
                            <strong>{money(dashboard.taxAmount)}</strong>
                        </div>

                        <div className="income-total">
                            <span>Estimated Net</span>
                            <strong>{money(dashboard.netIncome)}</strong>
                        </div>

                    </div>

                    <p><Link to="/income">View tax calculation and monthly earnings</Link></p>

                </section>

                <section className="dashboard-panel">

                    <h2>Quick Actions</h2>

                    <div className="quick-actions">

                        <Link
                            to="/create-gig"
                            className="button"
                        >
                            Create New Gig
                        </Link>

                        <Link
                            to="/bookings"
                            className="button button-secondary"
                        >
                            View Bookings
                        </Link>

                        <Link
                            to="/transactions"
                            className="button button-secondary"
                        >
                            View Transactions
                        </Link>

                    </div>

                </section>

            </div>

            <section className="dashboard-panel">

                <h2>Recent Activity</h2>

                {!dashboard.recentBookings.length ? (
                    <p>No recent activity.</p>
                ) : (
                    <div className="activity-list">

                        {dashboard.recentBookings.map((booking) => (
                            <div
                                className="activity-item"
                                key={booking._id || booking.id}
                            >
                                <div>
                                    <strong>{booking.gigTitle || booking.gigId?.title || "Gig Booking"}</strong>
                                    <p>{booking.clientName || booking.clientId?.name || "Client"}</p>
                                </div>

                                <span>
                                    {booking.status}
                                </span>
                            </div>
                        ))}

                    </div>
                )}

            </section>

        </main>
    );
}

export default Dashboard;
