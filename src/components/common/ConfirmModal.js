function ConfirmModal({
    open,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    loading = false,
    danger = false,
    onConfirm,
    onCancel,
}) {
    if (!open) {
        return null;
    }

    return (
        <div className="confirm-modal-backdrop" role="presentation">
            <div className="confirm-modal-card" role="dialog" aria-modal="true">
                <div className="confirm-modal-icon-wrap">
                    <div className={danger ? "confirm-modal-icon danger" : "confirm-modal-icon"}>
                        {danger ? "!" : "✓"}
                    </div>
                </div>

                <div className="confirm-modal-content">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>

                <div className="confirm-modal-actions">
                    <button
                        type="button"
                        className="confirm-modal-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        className={
                            danger
                                ? "confirm-modal-confirm danger"
                                : "confirm-modal-confirm"
                        }
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Working..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;