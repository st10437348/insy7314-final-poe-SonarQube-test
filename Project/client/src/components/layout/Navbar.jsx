import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <div className="navbar-container">

                <Link to="/" className="navbar-logo">
                    HustleHub+
                </Link>

                <div className="navbar-links">
                    <Link to="/">Home</Link>

                    <Link to="/marketplace">
                        Marketplace
                    </Link>

                    {!user && (
                        <>
                            <Link to="/login">
                                Login
                            </Link>

                            <Link
                                to="/signup"
                                className="signup-link"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}

                    {user && (
                        <>
 
                            {user.role === "Freelancer" && (
                                <>
                                    <Link to="/dashboard">
                                        Dashboard
                                    </Link>

                                    <Link to="/bookings">
                                        Bookings
                                    </Link>

                                    <Link to="/my-gigs">
                                        My Gigs
                                    </Link>

                                    <Link to="/income">
                                        Income
                                    </Link>

                                    <Link to="/transactions">
                                        Transactions
                                    </Link>

                                    <Link to="/profile">
                                        Profile
                                    </Link>
                                </>
                            )}

                            {user.role === "Client" && (
                                <>

                                    <Link to="/bookings">
                                        Bookings
                                    </Link>

                                    <Link to="/transactions">
                                        Transactions
                                    </Link>

                                    <Link to="/profile">
                                        Profile
                                    </Link>
                                </>
                            )}

                            {user.role === "Admin" && (
                                <>
                                    <Link to="/admin">
                                        Admin
                                    </Link>

                                    <Link to="/admin/analytics">
                                        Analytics
                                    </Link>

                                    <Link to="/admin/api-usage">
                                        API Usage
                                    </Link>

                                    <Link to="/admin/bookings">
                                        Bookings
                                    </Link>

                                    <Link to="/admin/gigs">
                                        Gigs
                                    </Link>

                                    <Link to="/admin/users">
                                        Users
                                    </Link>

                                    <Link to="/profile">
                                        Profile
                                    </Link>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={logout}
                                className="logout-button"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>

            </div>
        </nav>
    );
}

export default Navbar;
