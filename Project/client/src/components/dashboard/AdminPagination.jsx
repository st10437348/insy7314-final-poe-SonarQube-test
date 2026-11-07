
import "../../index.css";
import { useRef } from "react";

function AdminPagination({
    currentPage,
    totalItems,
    rowsPerPage,
    onPageChange
}) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    const pageInputRef = useRef(null);

    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * rowsPerPage + 1;
    const endItem = Math.min(
        currentPage * rowsPerPage,
        totalItems
    );

    function goToPage() {
        const requestedPage = Number(pageInputRef.current.value);

        if (!Number.isInteger(requestedPage)) {
            pageInputRef.current.value = String(currentPage);
            return;
        }

        const validPage = Math.min(
            Math.max(requestedPage, 1),
            totalPages
        );

        onPageChange(validPage);
        pageInputRef.current.value = String(validPage);
    }

    function handleKeyDown(event) {
        if (event.key === "Enter") {
            goToPage();
        }
    }

    // Limit visible page numbers
    const getVisiblePages = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(
            totalPages,
            start + maxVisible - 1
        );

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (
        <div className="admin-pagination">

            <span className="pagination-info">
                Showing {startItem} - {endItem} of {totalItems} records
            </span>

            <div className="pagination-buttons">

                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    Previous
                </button>

                {getVisiblePages().map(page => (
                    <button
                        key={page}
                        className={
                            currentPage === page
                                ? "active"
                                : ""
                        }
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ))}

                <div className="pagination-goto">
                    <label htmlFor="pagination-page">
                        Go to:
                    </label>

                    <input
                        id="pagination-page"
                        type="number"
                        min="1"
                        max={totalPages}
                        key={currentPage}
                        ref={pageInputRef}
                        defaultValue={currentPage}
                        onKeyDown={handleKeyDown}
                    />

                    <button
                        type="button"
                        onClick={goToPage}
                    >
                        Go
                    </button>
                </div>
                
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next
                </button>

            </div>
        </div>
    );
}

export default AdminPagination;
