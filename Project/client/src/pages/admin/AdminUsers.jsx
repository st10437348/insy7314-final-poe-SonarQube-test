/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Initial API loads update state asynchronously; API_URL is fixed at build time. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminPagination from "../../components/dashboard/AdminPagination.jsx";

function AdminUsers() {
    const API_URL = import.meta.env.VITE_API_URL;

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const rowsPerPage = 10;

    const startIndex = (currentPage - 1) * rowsPerPage;

    const currentUsers = users.slice(
        startIndex,
        startIndex + rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [users.length]);

    async function loadUsers() {

        try {
            const response = await fetch(
                `${API_URL}/api/admin/users`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load users."
                );
            }

            setUsers(data.users || data || []);
        } catch (err) {
            console.error("Failed to load users:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    async function handleToggleActive(user) {
        const userId = user._id || user.id;

        try {
            const response = await fetch(
                `${API_URL}/api/admin/users/${userId}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        isActive: !user.isActive
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update user."
                );
            }

            setUsers((currentUsers) =>
                currentUsers.map((currentUser) =>
                    (currentUser._id || currentUser.id) ===
                        userId
                        ? {
                            ...currentUser,
                            ...(data.user || {}),
                            isActive: !currentUser.isActive
                        }
                        : currentUser
                )
            );
        } catch (err) {
            console.error(
                "Failed to update user:",
                err
            );

            setError(err.message);
        }
    }

    async function handleDelete(user) {
        const userId = user._id || user.id;

        const confirmed = window.confirm(
            `Delete ${user.name}? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/admin/users/${userId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to delete user."
                );
            }

            setUsers((currentUsers) =>
                currentUsers.filter(
                    (currentUser) =>
                        (currentUser._id ||
                            currentUser.id) !== userId
                )
            );
        } catch (err) {
            console.error(
                "Failed to delete user:",
                err
            );

            setError(err.message);
        }
    }

    if (loading) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>User Management</h1>
                    <p>Loading users...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <h1>User Management</h1>
                <p>
                    View and manage HustleHub+ user
                    accounts.
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
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Provider</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="admin-empty"
                                >
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            currentUsers.map((user) => {
                                const userId =
                                    user._id || user.id;

                                return (
                                    <tr key={userId}>
                                        <td>
                                            {user.name}
                                        </td>

                                        <td>
                                            {user.email}
                                        </td>

                                        <td>
                                            {user.role}
                                        </td>

                                        <td>
                                            {user.provider ||
                                                "local"}
                                        </td>

                                        <td>
                                            {user.isActive ? (
                                                <span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span>
                                                    Disabled
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            <div className="admin-table-actions">
                                                <Link
                                                    to={`/admin/users/${userId}/edit`}
                                                    className="button button-secondary"
                                                >
                                                    Edit
                                                </Link>

                                                <button
                                                    type="button"
                                                    className="button button-secondary"
                                                    onClick={() =>
                                                        handleToggleActive(
                                                            user
                                                        )
                                                    }
                                                >
                                                    {user.isActive
                                                        ? "Disable"
                                                        : "Enable"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="button button-danger"
                                                    onClick={() =>
                                                        handleDelete(
                                                            user
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
                totalItems={users.length}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
            />
        </main>
    );
}

export default AdminUsers;
