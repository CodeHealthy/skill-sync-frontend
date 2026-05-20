function Pagination({ page, totalItems, pageSize, onPageChange }) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return (
        <div className="pagination-row">
            <span>
                Page {page} of {totalPages} - {totalItems} result
                {totalItems === 1 ? "" : "s"}
            </span>

            <div className="pagination-actions">
                <button
                    className="secondary-button small-button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </button>

                <button
                    className="secondary-button small-button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default Pagination;
