function CodeBlock({ title, value, maxHeight = "260px" }) {
    if (!value) {
        return null;
    }

    return (
        <div className="code-block">
            <p>
                <strong>{title}</strong>
            </p>
            <pre style={{ maxHeight }}>{value}</pre>
        </div>
    );
}

export default CodeBlock;