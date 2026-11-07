import { useEffect, useState } from "react";

const money = (value) => new Intl.NumberFormat("en-ZA", {
    style: "currency", currency: "ZAR"
}).format(Number(value) || 0);

function Income() {
    const API_URL = import.meta.env.VITE_API_URL || "https://localhost:5000";
    const [income, setIncome] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        async function loadIncome() {
            try {
                const response = await fetch(`${API_URL}/api/income`, {
                    credentials: "include", signal: controller.signal
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to load income.");
                setIncome(data.income);
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        void loadIncome();
        return () => controller.abort();
    }, [API_URL]);

    if (loading || error) return (
        <main className="page-container"><div className="page-heading"><h1>Income</h1></div>
            {error ? <p role="alert" className="form-error">{error}</p> : <p>Loading your income...</p>}
        </main>
    );

    const { summary, monthlyIncome, period, taxMethod } = income;
    const maxMonth = Math.max(1, ...monthlyIncome.map(({ amount }) => amount));
    const hasIncome = summary.gross > 0;

    return (
        <main className="page-container income-page">
            <header className="page-heading">
                <h1>Income and tax</h1>
                <p>Completed earnings for the {period.taxYear} tax year · 1 March {period.taxYear - 1} – 28 February {period.taxYear}</p>
            </header>

            <section className="stats-grid" aria-label="Income summary">
                {[
                    ["Gross earnings", summary.gross],
                    ["Platform fees", summary.fees],
                    ["Estimated income tax", summary.tax],
                    ["After estimated tax", summary.net]
                ].map(([label, value]) => (
                    <div className="stat-card" key={label}><span>{label}</span><strong>{money(value)}</strong></div>
                ))}
            </section>

            <section className="dashboard-panel">
                <div className="panel-heading"><div><h2>Monthly earnings</h2>
                    <p>Completed gig income after platform fees, before estimated tax.</p></div></div>
                {!hasIncome ? <p>No completed earnings in this tax year yet.</p> : (
                    <div className="income-chart" role="img" aria-label="Monthly earnings chart">
                        {monthlyIncome.map(({ month, amount }) => (
                            <div className="income-chart-item" key={month}>
                                <strong>{money(amount)}</strong>
                                <div className="income-bar-container">
                                    <div className="income-bar" style={{ height: `${amount > 0 ? Math.max(3, amount / maxMonth * 100) : 0}%` }} />
                                </div>
                                <span>{month}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="dashboard-panel">
                <div className="panel-heading"><div><h2>Income breakdown</h2>
                    <p>How the estimate is calculated for this tax year.</p></div></div>
                <div className="income-breakdown">
                    <div className="income-breakdown-row"><span>Gross completed earnings</span><strong>{money(summary.gross)}</strong></div>
                    <div className="income-breakdown-row"><span>Platform fees</span><strong>−{money(summary.fees)}</strong></div>
                    <div className="income-breakdown-row"><span>Estimated taxable platform income</span><strong>{money(summary.taxable)}</strong></div>
                    <div className="income-breakdown-row"><span>Estimated personal income tax</span><strong>−{money(summary.tax)}</strong></div>
                    <div className="income-breakdown-total"><span>Income after estimated tax</span><strong>{money(summary.net)}</strong></div>
                </div>
            </section>

            <section className="dashboard-panel tax-explainer">
                <h2>How we estimate tax</h2>
                <p>We add completed gig earnings in the South African tax year (1 March to the following 28 February), subtract platform fees, apply the progressive SARS {taxMethod.ratesYear} individual income tax brackets, then subtract the {money(taxMethod.primaryRebate)} primary rebate. The estimate never goes below zero.</p>
                <p>{taxMethod.note}</p>
                {summary.recordedTax > 0 && <p>Older transactions recorded {money(summary.recordedTax)} in simulated tax deductions. This is separate from the estimate above.</p>}
                <a href={taxMethod.source} target="_blank" rel="noreferrer">View SARS tax rates and rebates</a>
            </section>
        </main>
    );
}

export default Income;
