import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient({
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : "http://localhost:3002"),
});
