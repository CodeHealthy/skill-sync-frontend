function StatusBadge({ value }) {
    const normalizedValue = value || "UNKNOWN";
    const label = formatStatusLabel(normalizedValue);

    return (
        <span className={`status-badge status-${normalizedValue.toLowerCase()}`}>
            {label}
        </span>
    );
}

function formatStatusLabel(value) {
    if (value === "CODING_CHALLENGE") {
        return "Coding Challenge";
    }

    if (value === "MCQ" || value === "QUIZ") {
        return "MCQ / Short Answer";
    }

    return value.replaceAll("_", " ");
}

export default StatusBadge;
