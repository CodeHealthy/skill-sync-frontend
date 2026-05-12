import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("skillsync_user");

        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem("skillsync_user");
                localStorage.removeItem("skillsync_token");
            }
        }

        setAuthLoading(false);
    }, []);

    const login = async ({ email, password }) => {
        const response = await axiosClient.post("/auth/login", {
            email,
            password,
        });

        const authData = response.data;

        localStorage.setItem("skillsync_token", authData.token);
        localStorage.setItem(
            "skillsync_user",
            JSON.stringify({
                userId: authData.userId,
                fullName: authData.fullName,
                email: authData.email,
                role: authData.role,
            })
        );

        setUser({
            userId: authData.userId,
            fullName: authData.fullName,
            email: authData.email,
            role: authData.role,
        });

        return authData;
    };

    const register = async ({ fullName, email, password, role }) => {
        const response = await axiosClient.post("/auth/register", {
            fullName,
            email,
            password,
            role,
        });

        const authData = response.data;

        localStorage.setItem("skillsync_token", authData.token);
        localStorage.setItem(
            "skillsync_user",
            JSON.stringify({
                userId: authData.userId,
                fullName: authData.fullName,
                email: authData.email,
                role: authData.role,
            })
        );

        setUser({
            userId: authData.userId,
            fullName: authData.fullName,
            email: authData.email,
            role: authData.role,
        });

        return authData;
    };

    const logout = () => {
        localStorage.removeItem("skillsync_token");
        localStorage.removeItem("skillsync_user");
        setUser(null);
    };

    const isAuthenticated = Boolean(user);

    const value = useMemo(
        () => ({
            user,
            authLoading,
            isAuthenticated,
            login,
            register,
            logout,
        }),
        [user, authLoading, isAuthenticated]
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