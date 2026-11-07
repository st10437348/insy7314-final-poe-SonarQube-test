/* eslint-disable react-refresh/only-export-components -- Provider and its hook share one context module. */
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        async function restoreSession() {
            try {
                const response = await fetch(
                    `${API_URL}/api/auth/me`,
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );

                if (!response.ok) {
                    setUser(null);
                    return;
                }

                const data = await response.json();

                setUser(data.user);

            } catch (error) {
                console.error("Failed to restore session:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        void restoreSession();
    }, []);

    function login(userData) {
        setUser(userData);
    }

    async function logout() {
        try {
            await fetch(
                `${API_URL}/api/auth/logout`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            setUser(null);
        }
    }

    const value = {
        user,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}



//Just for dev. 
// import { createContext, useContext, useState } from "react";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//     const [user, setUser] = useState({
//         name: "Test Freelancer",
//         email: "test@hustlehub.test",
//         role: "Admin"
//     });

//     const [loading, setLoading] = useState(false);

//     function login(userData) {
//         setUser(userData);
//     }

//     async function logout() {
//         setUser(null);
//     }

//     const value = {
//         user,
//         loading,
//         login,
//         logout
//     };

//     return (
//         <AuthContext.Provider value={value}>
//             {children}
//         </AuthContext.Provider>
//     );
// }

// export function useAuth() {
//     return useContext(AuthContext);
// }
