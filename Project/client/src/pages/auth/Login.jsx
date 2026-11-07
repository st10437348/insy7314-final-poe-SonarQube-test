import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const registered = location.state?.registered;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Login failed.");
            
        login(data.user);

        if (data.user.role === "Admin") await navigate("/admin");
        else if (data.user.role === "Freelancer") await navigate("/dashboard");
        else await navigate("/");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }

        
    }

    return (
        <section className="login-page">
            {
                registered && (
                    <div className="success-message">
                        Registration successful! Please log in with your new account.
                    </div>
                )
            }

            <div className="login-card">
                <h1>Welcome Back</h1>

                <p className="login-subtitle">
                    Log in to your HustleHub+ account.
                </p>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="login-signup">
                    Don't have an account?{" "}
                    <Link to="/signup">
                        Sign Up
                    </Link>
                </p>
            </div>
        </section>
    );
}

export default Login;
