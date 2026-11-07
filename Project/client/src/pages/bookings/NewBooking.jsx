import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function NewBooking() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const gigId = params.get("gigId");
    const API_URL = import.meta.env.VITE_API_URL;
    const [gig, setGig] = useState(null);
    const [bookingDate, setBookingDate] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(Boolean(gigId));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!gigId) return;
        fetch(`${API_URL}/api/gigs/${gigId}`)
            .then(async response => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Gig unavailable.");
                setGig(data.gig);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [API_URL, gigId]);

    async function confirmBooking(event) {
        event.preventDefault();
        setError("");
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/bookings`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gigId, bookingDate })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not book this gig.");
            await navigate("/bookings", { replace: true, state: { booked: true } });
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <h1>Book a gig</h1>
                <p>Payment is simulated. Confirming creates a booking and transaction record.</p>
            </div>
            {error && <div className="form-error" role="alert">{error}</div>}
            {loading && <p>Loading gig...</p>}
            {!gigId && <p>Select a gig from the <Link to="/marketplace">marketplace</Link>.</p>}
            {gig && (
                <form className="auth-card" onSubmit={confirmBooking}>
                    <h2>{gig.title}</h2>
                    <p>{gig.description}</p>
                    <p><strong>Agreed price: R{Number(gig.price).toFixed(2)}</strong></p>
                    <p>Location: {gig.location?.address || "Not specified"}</p>
                    <div className="form-group">
                        <label htmlFor="bookingDate">Preferred booking date</label>
                        <input id="bookingDate" type="date" required value={bookingDate}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={event => setBookingDate(event.target.value)} />
                    </div>
                    <button type="submit" disabled={saving || !gig.isActive || gig.status !== "active"}>
                        {saving ? "Confirming..." : "Confirm booking"}
                    </button>
                </form>
            )}
        </main>
    );
}

export default NewBooking;
