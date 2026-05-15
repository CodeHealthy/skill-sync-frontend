function StatusBadge({ value }) {
    const normalizedValue = value || "UNKNOWN";

    return (
        <span className={`status-badge status-${normalizedValue.toLowerCase()}`}>
            {normalizedValue.replaceAll("_", " ")}
        </span>
    );
}

export default StatusBadge;