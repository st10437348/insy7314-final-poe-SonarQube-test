import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

function Transactions() {
    const { user } = useAuth();
    const isClient = user?.role === "Client";
    const formatMoney = value => `R${Number(value || 0).toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({
        gross: 0,
        fees: 0,
        tax: 0,
        net: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        async function loadTransactions() {
            try {
                setLoading(true);
                setError("");


                // Fixed endpoint to /api/transactions/my-transactions and added Authorization header
                const response = await fetch(
                    `${API_URL}/api/transactions/my-transactions`,
                    {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        }
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || "Failed to load transactions.");
                }

                const data = await response.json();

                const list = data.transactions || data || [];
                const completed = list.filter(item => item.status === "completed" &&
                    item.bookingId?.status === "completed");

                setTransactions(list);

                setSummary({
                    gross:
                        data.summary?.gross ??
                        completed.reduce((total, item) => total + (item.amount || 0), 0),
                    fees:
                        data.summary?.fees ??
                        completed.reduce((total, item) => total + (item.platformFee || 0), 0),
                    tax:
                        data.summary?.tax ??
                        completed.reduce((total, item) => total + (item.taxAmount || 0), 0),
                    net:
                        data.summary?.net ??
                        completed.reduce((total, item) => total + (item.freelancerAmount || 0), 0)
                });
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        void loadTransactions();
    }, [API_URL]);

    function formatDate(date) {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    if (loading) {
        return (
            <main className="page-container">
                <h1>Transactions</h1>
                <p>Loading transactions...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page-container">
                <h1>Transactions</h1>
                <div className="form-error">{error}</div>
            </main>
        );
    }

    return (
        <main className="page-container">

            <div className="page-heading">
                <h1>Transactions</h1>
                <p>{isClient ? "Review transactions for your bookings." : "Completed earnings, fees and estimated tax."}</p>
            </div>

            {isClient ? (
                <div className="stats-grid">
                    <div className="stat-card">
                        <span>Transaction Records</span>
                        <strong>{transactions.length}</strong>
                    </div>
                    <div className="stat-card">
                        <span>Completed Booking Total</span>
                        <strong>{formatMoney(summary.gross)}</strong>
                    </div>
                </div>
            ) : <div className="stats-grid">

                <div className="stat-card">
                    <span>Gross</span>
                    <strong>{formatMoney(summary.gross)}</strong>
                </div>

                <div className="stat-card">
                    <span>Platform Fees</span>
                    <strong>{formatMoney(summary.fees)}</strong>
                </div>

                <div className="stat-card">
                    <span>Estimated Tax</span>
                    <strong>{formatMoney(summary.tax)}</strong>
                </div>

                <div className="stat-card">
                    <span>Net Income</span>
                    <strong>{formatMoney(summary.net)}</strong>
                </div>

            </div>}

            {transactions.length === 0 ? (
                <div className="empty-state">
                    <h2>No transactions yet</h2>
                    <p>Transactions for your bookings will appear here.</p>
                </div>
            ) : (
                <div className="transaction-table-wrapper">

                    <table className="transaction-table">

                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Booking</th>
                                <th>Status</th>
                                <th>Amount</th>
                                {!isClient && <th>Fee</th>}
                                {!isClient && <th>Tax</th>}
                                {!isClient && <th>Net</th>}
                            </tr>
                        </thead>

                        <tbody>

                            {transactions.map((transaction) => (
                                <tr key={transaction._id || transaction.id}>
                                    <td>{formatDate(transaction.createdAt)}</td>

                                    <td>{transaction.bookingId?.gigId?.title || transaction.bookingTitle || "Booking"}</td>

                                    <td>
                                        <span
                                            className={`booking-status booking-status-${transaction.status}`}
                                        >
                                            {transaction.status}
                                        </span>
                                    </td>

                                    <td>{formatMoney(transaction.amount)}</td>
                                    {!isClient && <td>{formatMoney(transaction.platformFee)}</td>}
                                    {!isClient && <td>{formatMoney(transaction.taxAmount)}</td>}
                                    {!isClient && <td>{formatMoney(transaction.freelancerAmount)}</td>}
                                </tr>
                            ))}

                        </tbody>

                    </table>

                </div>
            )}

        </main>
    );
}

export default Transactions;
