import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import axiosClient from "../api/axiosClient";
import { authApi } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const saveAuthData = useCallback((authData) => {
        const authUser = {
            userId: authData.userId,
            fullName: authData.fullName,
            email: authData.email,
            role: authData.role,
        };

        localStorage.setItem("skillsync_user", JSON.stringify(authUser));
        setUser(authUser);

        return authUser;
    }, []);

    useEffect(() => {
        let cancelled = false;

        const storedUser = localStorage.getItem("skillsync_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem("skillsync_user");
            }
        }

        const loadCurrentProfile = async () => {
            try {
                const response = await axiosClient.get("/profile", {
                    skipAuthRedirect: true,
                });

                if (!cancelled) {
                    saveAuthData(response.data);
                }
            } catch {
                if (!cancelled) {
                    localStorage.removeItem("skillsync_user");
                    setUser(null);
                }
            } finally {
                if (!cancelled) {
                    setAuthLoading(false);
                }
            }
        };

        loadCurrentProfile();

        return () => {
            cancelled = true;
        };
    }, [saveAuthData]);

    const updateAuthData = useCallback(
        (authData) => {
            return saveAuthData(authData);
        },
        [saveAuthData]
    );

    const login = useCallback(
        async ({ email, password }) => {
            const response = await axiosClient.post("/auth/login", {
                email,
                password,
            });

            const authData = response.data;

            saveAuthData(authData);

            return authData;
        },
        [saveAuthData]
    );

    const register = useCallback(
        async ({ fullName, email, password, role, organizationName }) => {
            const response = await axiosClient.post("/auth/register", {
                fullName,
                email,
                password,
                role,
                organizationName,
            });

            return response.data;
        },
        []
    );

    const logout = useCallback(() => {
        authApi.logout().catch(() => {
            // Local logout should still complete if the session is already expired.
        });
        localStorage.removeItem("skillsync_user");
        setUser(null);
    }, []);

    const isAuthenticated = Boolean(user);

    const value = useMemo(
        () => ({
            user,
            authLoading,
            isAuthenticated,
            login,
            register,
            logout,
            updateAuthData,
        }),
        [
            user,
            authLoading,
            isAuthenticated,
            login,
            register,
            logout,
            updateAuthData,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}
