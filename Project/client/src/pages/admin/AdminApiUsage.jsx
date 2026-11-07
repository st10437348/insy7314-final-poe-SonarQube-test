/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- Initial API loads update state asynchronously; API_URL is fixed at build time. */
import { useEffect, useMemo, useState } from "react";
import AdminPagination from "../../components/dashboard/AdminPagination.jsx";

function AdminApiUsage() {
    const API_URL = import.meta.env.VITE_API_URL;
    
    const [currentPage, setCurrentPage] = useState(1);

    const [usage, setUsage] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [selectedDay, setSelectedDay] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");

    
    async function loadUsage() {

        try {
            const response = await fetch(
                `${API_URL}/api/admin/api-usage`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to load API usage."
                );
            }

            setUsage(data.usage || data || []);
        } catch (err) {
            console.error(
                "Failed to load API usage:",
                err
            );

            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadUsage();
    }, []);

    function getDateValue(date) {
        if (!date) {
            return "";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }

        const year = parsedDate.getFullYear();
        const month = String(
            parsedDate.getMonth() + 1
        ).padStart(2, "0");
        const day = String(
            parsedDate.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function getMonthValue(date) {
        if (!date) {
            return "";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }

        const year = parsedDate.getFullYear();
        const month = String(
            parsedDate.getMonth() + 1
        ).padStart(2, "0");

        return `${year}-${month}`;
    }

    function formatDate(date) {
        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleDateString(
            "en-ZA",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }

    const filteredUsage = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        return usage.filter((item) => {
            const endpoint =
                item.endpoint?.toLowerCase() || "";

            const method =
                item.method?.toLowerCase() || "";

            const matchesSearch =
                !searchValue ||
                endpoint.includes(searchValue) ||
                method.includes(searchValue);

            let matchesDate = true;

            if (filterType === "day") {
                matchesDate =
                    getDateValue(item.date) ===
                    selectedDay;
            }

            if (filterType === "month") {
                matchesDate =
                    getMonthValue(item.date) ===
                    selectedMonth;
            }

            return (
                matchesSearch &&
                matchesDate
            );
        });
    }, [
        usage,
        search,
        filterType,
        selectedDay,
        selectedMonth
    ]);

    const rowsPerPage = 10;

    const startIndex = (currentPage - 1) * rowsPerPage;

    const currentUsage = filteredUsage.slice(
        startIndex,
        startIndex + rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterType, selectedDay, selectedMonth]);
    
    const totalRequests = filteredUsage.reduce(
        (total, item) =>
            total + Number(item.requests || 0),
        0
    );

    const totalSuccessful = filteredUsage.reduce(
        (total, item) =>
            total +
            Number(item.successful || 0),
        0
    );

    const totalFailed = filteredUsage.reduce(
        (total, item) =>
            total + Number(item.failed || 0),
        0
    );

    /*
     * Build daily data for the line chart.
     *
     * Each point represents one day.
     */
    const chartData = useMemo(() => {
        const daily = {};

        filteredUsage.forEach((item) => {
            const date = getDateValue(item.date);

            if (!date) {
                return;
            }

            if (!daily[date]) {
                daily[date] = {
                    date,
                    requests: 0,
                    successful: 0,
                    failed: 0
                };
            }

            daily[date].requests +=
                Number(item.requests || 0);

            daily[date].successful +=
                Number(item.successful || 0);

            daily[date].failed +=
                Number(item.failed || 0);
        });

        return Object.values(daily).sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );
    }, [filteredUsage]);

    function clearFilters() {
        setSearch("");
        setFilterType("all");
        setSelectedDay("");
        setSelectedMonth("");
    }

    function handleFilterTypeChange(event) {
        const value = event.target.value;

        setFilterType(value);

        if (value !== "day") {
            setSelectedDay("");
        }

        if (value !== "month") {
            setSelectedMonth("");
        }
    }

    /*
     * SVG line chart calculations.
     */
    const chartWidth = 900;
    const chartHeight = 320;

    const chartPadding = {
        top: 30,
        right: 30,
        bottom: 55,
        left: 55
    };

    const chartInnerWidth =
        chartWidth -
        chartPadding.left -
        chartPadding.right;

    const chartInnerHeight =
        chartHeight -
        chartPadding.top -
        chartPadding.bottom;

    const chartMax = Math.max(
        ...chartData.map(
            (item) => item.requests
        ),
        1
    );

    function getX(index) {
        if (chartData.length <= 1) {
            return (
                chartPadding.left +
                chartInnerWidth / 2
            );
        }

        return (
            chartPadding.left +
            (index /
                (chartData.length - 1)) *
                chartInnerWidth
        );
    }

    function getY(value) {
        return (
            chartPadding.top +
            chartInnerHeight -
            (value / chartMax) *
                chartInnerHeight
        );
    }

    function createLinePoints(valueKey) {
        return chartData
            .map(
                (item, index) =>
                    `${getX(index)},${getY(
                        item[valueKey]
                    )}`
            )
            .join(" ");
    }

    function formatChartDate(date) {
        return new Date(
            `${date}T00:00:00`
        ).toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short"
        });
    }

    if (loading) {
        return (
            <main className="page-container">
                <div className="page-heading">
                    <h1>API Usage</h1>
                    <p>
                        Loading API usage...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <div className="page-heading">
                <h1>API Usage</h1>

                <p>
                    Monitor API requests made by
                    the application.
                </p>
            </div>

            {error && (
                <div className="form-error">
                    {error}
                </div>
            )}

            {/* Summary */}
            <div className="dashboard-stats">
                <div className="stat-card">
                    <span>
                        Total Requests
                    </span>

                    <strong>
                        {totalRequests}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>
                        Successful
                    </span>

                    <strong>
                        {totalSuccessful}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>
                        Failed
                    </span>

                    <strong>
                        {totalFailed}
                    </strong>
                </div>
            </div>

            {/* Filters */}
            <div className="dashboard-panel">
                <h2>
                    Search & Filter
                </h2>

                <div className="admin-filters">
                    <div className="form-group">
                        <label htmlFor="api-search">
                            Search
                        </label>

                        <input
                            id="api-search"
                            type="text"
                            placeholder="Search endpoint or method..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="filter-type">
                            Filter By
                        </label>

                        <select
                            id="filter-type"
                            value={filterType}
                            onChange={
                                handleFilterTypeChange
                            }
                        >
                            <option value="all">
                                All Dates
                            </option>

                            <option value="day">
                                Specific Day
                            </option>

                            <option value="month">
                                Specific Month
                            </option>
                        </select>
                    </div>

                    {filterType === "day" && (
                        <div className="form-group">
                            <label htmlFor="api-day">
                                Day
                            </label>

<input
    id="api-day"
    type="date"
    value={selectedDay}
    onChange={(event) =>
        setSelectedDay(event.target.value)
    }
    onKeyDown={(event) => {
        if (
            event.key !== "ArrowUp" &&
            event.key !== "ArrowDown"
        ) {
            return;
        }

        event.preventDefault();

        const currentDate = selectedDay
            ? new Date(`${selectedDay}T00:00:00`)
            : new Date();

        if (event.key === "ArrowUp") {
            currentDate.setDate(
                currentDate.getDate() + 1
            );
        }

        if (event.key === "ArrowDown") {
            currentDate.setDate(
                currentDate.getDate() - 1
            );
        }

        const year = currentDate.getFullYear();

        const month = String(
            currentDate.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            currentDate.getDate()
        ).padStart(2, "0");

        setSelectedDay(
            `${year}-${month}-${day}`
        );
    }}
/>
                        </div>
                    )}

                    {filterType === "month" && (
                        <div className="form-group">
                            <label htmlFor="api-month">
                                Month
                            </label>

<input
    id="api-month"
    type="month"
    value={selectedMonth}
    onChange={(event) =>
        setSelectedMonth(event.target.value)
    }
    onKeyDown={(event) => {
        if (
            event.key !== "ArrowUp" &&
            event.key !== "ArrowDown"
        ) {
            return;
        }

        event.preventDefault();

        const currentDate = selectedMonth
            ? new Date(`${selectedMonth}-01T00:00:00`)
            : new Date();

        if (event.key === "ArrowUp") {
            currentDate.setMonth(
                currentDate.getMonth() + 1
            );
        }

        if (event.key === "ArrowDown") {
            currentDate.setMonth(
                currentDate.getMonth() - 1
            );
        }

        const year =
            currentDate.getFullYear();

        const month = String(
            currentDate.getMonth() + 1
        ).padStart(2, "0");

        setSelectedMonth(
            `${year}-${month}`
        );
    }}
/>
                        </div>
                    )}

                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Line Chart */}
            <div className="dashboard-panel">
                <div className="panel-heading">
                    <div>
                        <h2>
                            API Requests Over Time
                        </h2>

                        <p>
                            {filterType ===
                            "day"
                                ? selectedDay
                                    ? `Requests for ${formatDate(
                                        selectedDay
                                    )}`
                                    : "Select a day to view its requests."
                                : filterType ===
                                  "month"
                                ? selectedMonth
                                    ? `Daily requests for ${new Date(
                                        `${selectedMonth}-01T00:00:00`
                                    ).toLocaleDateString(
                                        "en-ZA",
                                        {
                                            month: "long",
                                            year: "numeric"
                                        }
                                    )}`
                                    : "Select a month to view daily requests."
                                : "Daily API request activity"}
                        </p>
                    </div>
                </div>

                {chartData.length === 0 ? (
                    <div className="admin-empty">
                        No API usage data found for
                        the selected filters.
                    </div>
                ) : (
                    <div className="api-line-chart">
                        <svg
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            preserveAspectRatio="none"
                        >
                            {/* Horizontal grid lines */}
                            {[0, 1, 2, 3, 4].map(
                                (line) => {
                                    const y =
                                        chartPadding.top +
                                        (line / 4) *
                                            chartInnerHeight;

                                    const value =
                                        Math.round(
                                            chartMax -
                                            (line /
                                                4) *
                                                chartMax
                                        );

                                    return (
                                        <g
                                            key={
                                                line
                                            }
                                        >
                                            <line
                                                x1={
                                                    chartPadding.left
                                                }
                                                y1={y}
                                                x2={
                                                    chartWidth -
                                                    chartPadding.right
                                                }
                                                y2={y}
                                                className="chart-grid-line"
                                            />

                                            <text
                                                x={
                                                    chartPadding.left -
                                                    10
                                                }
                                                y={
                                                    y +
                                                    4
                                                }
                                                textAnchor="end"
                                                className="chart-axis-label"
                                            >
                                                {
                                                    value
                                                }
                                            </text>
                                        </g>
                                    );
                                }
                            )}

                            {/* Successful line */}
                            <polyline
                                points={createLinePoints(
                                    "successful"
                                )}
                                fill="none"
                                className="chart-line-success"
                            />

                            {/* Failed line */}
                            <polyline
                                points={createLinePoints(
                                    "failed"
                                )}
                                fill="none"
                                className="chart-line-failed"
                            />

                            {/* Total requests line */}
                            <polyline
                                points={createLinePoints(
                                    "requests"
                                )}
                                fill="none"
                                className="chart-line-total"
                            />

                            {/* Data points */}
                            {chartData.map(
                                (
                                    item,
                                    index
                                ) => (
                                    <g
                                        key={
                                            item.date
                                        }
                                    >
                                        <circle
                                            cx={getX(
                                                index
                                            )}
                                            cy={getY(
                                                item.requests
                                            )}
                                            r="4"
                                            className="chart-point-total"
                                        />

                                        <circle
                                            cx={getX(
                                                index
                                            )}
                                            cy={getY(
                                                item.successful
                                            )}
                                            r="3"
                                            className="chart-point-success"
                                        />

                                        <circle
                                            cx={getX(
                                                index
                                            )}
                                            cy={getY(
                                                item.failed
                                            )}
                                            r="3"
                                            className="chart-point-failed"
                                        />

                                        <text
                                            x={getX(
                                                index
                                            )}
                                            y={
                                                chartHeight -
                                                20
                                            }
                                            textAnchor="middle"
                                            className="chart-axis-label"
                                        >
                                            {formatChartDate(
                                                item.date
                                            )}
                                        </text>
                                    </g>
                                )
                            )}
                        </svg>

                        <div className="chart-legend">
                            <span>
                                <i className="legend-total" />
                                Total Requests
                            </span>

                            <span>
                                <i className="legend-success" />
                                Successful
                            </span>

                            <span>
                                <i className="legend-failed" />
                                Failed
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="dashboard-panel">
                <div className="panel-heading">
                    <div>
                        <h2>
                            API Request Details
                        </h2>

                        <p>
                            Showing{" "}
                            {filteredUsage.length}{" "}
                            records.
                        </p>
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Endpoint</th>
                                <th>Method</th>
                                <th>Requests</th>
                                <th>Successful</th>
                                <th>Failed</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredUsage.length ===
                            0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="admin-empty"
                                    >
                                        No API usage
                                        data found.
                                    </td>
                                </tr>
                            ) : (
                                    currentUsage.map(
                                        (item, index) => (
                                        <tr
                                            key={
                                                item._id ??
                                                item.id ??
                                                `${item.date}-${item.endpoint}-${item.method}-${index}`
                                            }
                                        >
                                            <td>
                                                {formatDate(
                                                    item.date
                                                )}
                                            </td>

                                            <td>
                                                {item.endpoint ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {item.method ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {item.requests ||
                                                    0}
                                            </td>

                                            <td>
                                                {item.successful ||
                                                    0}
                                            </td>

                                            <td>
                                                {item.failed ||
                                                    0}
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
                        totalItems={filteredUsage.length}
                        rowsPerPage={rowsPerPage}
                        onPageChange={setCurrentPage}
                    />
            </div>
        </main>
    );
}

export default AdminApiUsage;
