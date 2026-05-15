import { toast } from "react-toastify";

export function showSuccess(message) {
    toast.success(message);
}

export function showError(message) {
    toast.error(message);
}

export function showWarning(message) {
    toast.warning(message);
}

export function showInfo(message) {
    toast.info(message);
}