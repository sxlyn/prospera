import { Navigate } from "react-router-dom";
import { isTokenValid, clearAuthSession, getUserRole } from "../utils/api";

/**
 * Protected Route — Memeriksa keabsahan token JWT & otorisasi role.
 * @param {object} props
 * @param {React.ReactNode} props.children - Komponen yang diproteksi
 * @param {string[]} [props.allowedRoles] - Daftar role yang diizinkan (opsional)
 */
export default function Protected({ children, allowedRoles }) {
    // 1. Cek apakah token JWT ada DAN belum expired
    if (!isTokenValid()) {
        clearAuthSession();
        return <Navigate to="/login" replace />;
    }

    // 2. Cek role (jika allowedRoles didefinisikan)
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = getUserRole();
        if (!userRole || !allowedRoles.includes(userRole)) {
            // Karyawan mencoba akses halaman Owner → redirect ke /transaction
            return <Navigate to="/transaction" replace />;
        }
    }

    return children;
}