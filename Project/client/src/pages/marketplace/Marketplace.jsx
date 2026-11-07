import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Marketplace() {
    const [gigs, setGigs] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        async function loadGigs() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/gigs`
                );

                if (!response.ok) {
                    throw new Error("Failed to load gigs.");
                }

                const data = await response.json();

                setGigs(data.gigs || data);
            } catch (err) {
                console.error("Failed to load gigs:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        void loadGigs();
    }, [API_URL]);

    const categories = [
        ...new Set(
            gigs
                .map((gig) => gig.category)
                .filter(Boolean)
        )
    ];

    const filteredGigs = gigs.filter((gig) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            gig.title?.toLowerCase().includes(searchText) ||
            gig.description?.toLowerCase().includes(searchText) ||
            gig.category?.toLowerCase().includes(searchText);

        const matchesCategory =
            !category || gig.category === category;

        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <main className="page-container">
                <h1>Marketplace</h1>
                <p>Loading gigs...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page-container">
                <h1>Marketplace</h1>

                <div className="form-error">
                    {error}
                </div>

                <p>
                    Make sure the API is running and the
                    `/api/gigs` endpoint is available.
                </p>
            </main>
        );
    }

    return (
        <main className="page-container">

                        <div className="marketplace-hero">
                <div className="marketplace-hero-content">
                    <span className="marketplace-eyebrow">
                        HUSTLEHUB+ MARKETPLACE
                    </span>

                    <h1>
                        Find the right talent
                        <span> for your next project.</span>
                    </h1>

                    <p>
                        Discover talented freelancers offering services
                        across design, development, writing, marketing and more.
                    </p>
                </div>

                <div className="marketplace-hero-accent">
                    <span>✦</span>
                    <strong>{gigs.length}</strong>
                    <small>services available</small>
                </div>
            </div>

            <div className="marketplace-filters">

                <div className="form-group">
                    <label htmlFor="gig-search">
                        Search
                    </label>

                    <input
                        id="gig-search"
                        type="search"
                        placeholder="Search gigs..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="gig-category">
                        Category
                    </label>

                    <select
                        id="gig-category"
                        value={category}
                        onChange={(event) =>
                            setCategory(event.target.value)
                        }
                    >
                        <option value="">
                            All categories
                        </option>

                        {categories.map((item) => (
                            <option
                                key={item}
                                value={item}
                            >
                                {item}
                            </option>
                        ))}
                    </select>
                </div>

            </div>

            {filteredGigs.length === 0 ? (
                <div className="empty-state">
                    <h2>No gigs found</h2>
                    <p>
                        Try changing your search or category
                        filter.
                    </p>
                </div>
            ) : (
                <div className="gig-grid">

                    {filteredGigs.map((gig) => (
                        <article
                            className="gig-card"
                            key={gig._id || gig.id}
                        >
                            <div className="gig-card-content">

                                <span className="gig-category">
                                    {gig.category}
                                </span>

                                <h2>{gig.title}</h2>

                                <p>
                                    {gig.description}
                                </p>

                                <div className="gig-card-details">
                                    <span>
                                        From R{gig.price}
                                    </span>

                                    <span>
                                        {gig.deliveryDays} days
                                    </span>
                                </div>

                            </div>

                            <div className="gig-card-footer">
                                <Link
                                    to={`/gigs/${gig._id || gig.id}`}
                                    className="button"
                                >
                                    View Gig
                                </Link>
                            </div>
                        </article>
                    ))}

                </div>
            )}

        </main>
    );
}

export default Marketplace;
