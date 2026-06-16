const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_EXPIRY } = require('../config/appConfig');

/**
 * Register — Pendaftaran publik untuk UMKM / Toko Baru
 * Siapapun yang mendaftar melalui endpoint ini akan otomatis menjadi 'owner'.
 */
const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Cek duplikasi email
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "Email tersebut sudah terdaftar." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Buat akun Owner pertama
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'owner'  // Pendaftar pertama SELALU jadi Owner
        });

        res.status(201).json({ 
            message: "Akun Owner berhasil dibuat. Silakan login.", 
            userId: newUser.user_id 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login — Autentikasi pengguna dan pemberian token JWT
 * Token payload kini menyertakan 'role' untuk otorisasi di frontend & backend.
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        // KEAMANAN: Pesan generik untuk mencegah User Enumeration Attack
        if (!user) {
            return res.status(401).json({ message: "Email atau kata sandi yang Anda masukkan salah." });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Email atau kata sandi yang Anda masukkan salah." });
        }

        // JWT payload kini menyertakan ROLE dan OWNER_ID untuk multi-tenant
        const token = jwt.sign(
            { id: user.user_id, email: user.email, role: user.role, owner_id: user.owner_id },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        res.status(200).json({
            message: "Login berhasil.",
            token: token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role  // Frontend butuh ini untuk render sidebar
            }
        });
    } catch (error) {
        next(error);
    }
};

// ===================== USER MANAGEMENT (Owner Only) =====================

/**
 * createUser — Owner membuat akun Karyawan baru
 * Endpoint ini HANYA bisa diakses oleh Owner (dilindungi authorizeRole di route).
 */
const createUser = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;

        // Hanya boleh membuat akun 'karyawan' (Owner tidak bisa membuat Owner lain)
        const assignedRole = 'karyawan';

        // Cek duplikasi email
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "Email tersebut sudah digunakan." });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: assignedRole,
            owner_id: req.user.id // SaaS ISOLATION: Karyawan ini milik Owner yang sedang login
        });

        res.status(201).json({ 
            message: `Akun ${assignedRole} "${username}" berhasil dibuat.`,
            user: {
                id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * getAllUsers — Owner melihat daftar semua user
 */
const getAllUsers = async (req, res, next) => {
    try {
        // SaaS ISOLATION: Hanya tampilkan karyawan milik Owner ini
        const users = await User.findAll({
            where: { owner_id: req.user.id },
            attributes: ['user_id', 'username', 'email', 'role'],
            order: [['user_id', 'ASC']]
        });

        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

/**
 * deleteUserById — Owner menghapus akun Karyawan
 * Owner TIDAK bisa menghapus dirinya sendiri.
 * SECURITY: Filter by owner_id untuk mencegah IDOR (cross-tenant deletion).
 */
const deleteUserById = async (req, res, next) => {
    try {
        const targetId = Number(req.params.id);
        const currentUserId = req.user.id;

        // Cegah Owner menghapus diri sendiri
        if (targetId === currentUserId) {
            return res.status(400).json({ message: "Anda tidak dapat menghapus akun Anda sendiri." });
        }

        // SECURITY FIX (B-T03): Cari user target HANYA dalam lingkup toko Owner ini
        // Sebelumnya: User.findByPk(targetId) — bisa mengakses user milik toko lain
        const targetUser = await User.findOne({
            where: {
                user_id: targetId,
                owner_id: req.user.id  // Isolasi tenant: hanya karyawan milik Owner ini
            }
        });

        if (!targetUser) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        // Cegah menghapus Owner lain (lapisan pertahanan tambahan)
        if (targetUser.role === 'owner') {
            return res.status(403).json({ message: "Tidak dapat menghapus akun Owner." });
        }

        await targetUser.destroy();

        res.status(200).json({ message: `Akun "${targetUser.username}" berhasil dihapus.` });
    } catch (error) {
        next(error);
    }
};

/**
 * deleteUser — User menghapus akun sendiri
 * SECURITY FIX (B-T04): Menambahkan safeguard dan cascade cleanup.
 * - Owner tidak bisa menghapus diri jika masih punya karyawan aktif
 * - Semua produk milik user akan ikut terhapus (cascade)
 */
const deleteUser = async (req, res, next) => {
    try {
        const idTarget = req.user.id;
        const user = await User.findByPk(idTarget);

        if (!user) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        // Safeguard: Jika Owner, cek apakah masih punya karyawan aktif
        if (user.role === 'owner') {
            const { User: UserModel } = require('../models');
            const activeEmployees = await UserModel.count({ where: { owner_id: idTarget } });
            if (activeEmployees > 0) {
                return res.status(400).json({ 
                    message: `Anda masih memiliki ${activeEmployees} karyawan aktif. Hapus semua karyawan terlebih dahulu sebelum menghapus akun Owner.` 
                });
            }
        }

        // Cascade cleanup: Hapus produk milik user ini
        const { Product } = require('../models');
        await Product.destroy({ where: { user_id_fk: req.user.store_id }, force: true });

        // Hapus user
        await user.destroy();

        res.status(200).json({ message: "Akun Anda berhasil dihapus beserta seluruh data terkait." });
    } catch (error) {
        next(error);
    }
};

/**
 * changePassword — User (Owner/Karyawan) mengganti password mereka sendiri
 */
const changePassword = async (req, res, next) => {
    try {
        const { old_password, new_password } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Pengguna tidak ditemukan." });
        }

        // Verifikasi password lama
        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password lama tidak sesuai." });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        // Update database
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password berhasil diubah." });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, createUser, getAllUsers, deleteUserById, deleteUser, changePassword };