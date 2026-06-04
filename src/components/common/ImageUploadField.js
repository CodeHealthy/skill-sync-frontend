import { useRef } from "react";
import { readImageFileAsDataUrl } from "../../utils/imageUtils";
import { showWarning } from "../../utils/toastUtils";

function ImageUploadField({
    id,
    label,
    value,
    onChange,
    previewName = "User",
    hint = "PNG, JPG, WebP, or SVG under 2 MB.",
}) {
    const inputRef = useRef(null);
    const initials = (previewName || "SS")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const dataUrl = await readImageFileAsDataUrl(file);
            onChange(dataUrl);
        } catch (error) {
            showWarning(error.message);
            event.target.value = "";
        }
    };

    const clearImage = () => {
        onChange("");

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <div className="image-upload-field">
            <label htmlFor={id}>{label}</label>
            <div className="image-upload-control">
                <span className="image-upload-preview" aria-hidden="true">
                    {value ? <img src={value} alt="" /> : initials}
                </span>

                <div className="image-upload-actions">
                    <input
                        id={id}
                        ref={inputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleFileChange}
                    />
                    <small>{hint}</small>
                    {value && (
                        <button
                            type="button"
                            className="secondary-button small-button"
                            onClick={clearImage}
                        >
                            Remove image
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ImageUploadField;
