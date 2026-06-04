export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function validateImageFile(file) {
    if (!file) {
        return "Choose an image file.";
    }

    if (!IMAGE_TYPES.includes(file.type)) {
        return "Use a PNG, JPG, WebP, or SVG image.";
    }

    if (file.size >= MAX_IMAGE_BYTES) {
        return "Image must be smaller than 2 MB.";
    }

    return "";
}

export function readImageFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const error = validateImageFile(file);

        if (error) {
            reject(new Error(error));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Unable to read image file."));
        reader.readAsDataURL(file);
    });
}
