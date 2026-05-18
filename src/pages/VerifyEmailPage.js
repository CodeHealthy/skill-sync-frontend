import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../api/authApi";
import { getApiErrorMessage } from "../utils/errorUtils";

function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("VERIFYING");
    const [message, setMessage] = useState("Verifying your email address...");

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setStatus("ERROR");
            setMessage("Verification token is missing.");
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await authApi.verifyEmail(token);

                setStatus("SUCCESS");
                setMessage(
                    response.data?.message ||
                    "Email verified successfully. You can now log in."
                );
            } catch (err) {
                setStatus("ERROR");
                setMessage(getApiErrorMessage(err, "Email verification failed."));
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div className="page-container">
            <div className="form-card auth-result-card">
                <div
                    className={
                        status === "SUCCESS"
                            ? "auth-result-icon success"
                            : status === "ERROR"
                              ? "auth-result-icon error"
                              : "auth-result-icon"
                    }
                >
                    {status === "SUCCESS" ? "✓" : status === "ERROR" ? "!" : "…"}
                </div>

                <h2>
                    {status === "SUCCESS"
                        ? "Email Verified"
                        : status === "ERROR"
                          ? "Verification Failed"
                          : "Verifying Email"}
                </h2>

                <p>{message}</p>

                <div className="button-row">
                    <Link to="/login" className="primary-link">
                        Go to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default VerifyEmailPage;