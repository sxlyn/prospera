/**
 * useCart.js — Hook untuk manajemen keranjang belanja
 * REFACTOR (F-T02): Dipecah dari god-hook useTransactionLogic.js
 * 
 * Bertanggung jawab atas:
 * - State keranjang (cartItems)
 * - Validasi & penambahan item ke keranjang
 * - Perhitungan total
 * - Proses simpan transaksi ke backend
 */

import { useState, useMemo } from "react";
import { apiFetch, formatError } from "../utils/api";

export function useCart(products, fetchProducts, fetchHistory) {
    const [cartItems, setCartItems] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [transactionType, setTransactionType] = useState("sell");
    const [quantity, setQuantity] = useState("");
    const [modal, setModal] = useState("");
    const [hargaJual, setHargaJual] = useState("");
    const [datetime, setDatetime] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("warning");

    const [lastTransaction, setLastTransaction] = useState(null);
    const [saving, setSaving] = useState(false);

    // Pencarian produk
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // PERFORMANCE FIX (F-S19): Memoize derived state
    const selectedProduct = useMemo(() => 
        products.find((p) => String(p.product_id) === String(selectedProductId)),
        [products, selectedProductId]
    );

    // PERFORMANCE FIX (F-S19): Memoize filtered list
    const filteredProducts = useMemo(() => 
        products.filter((p) => p.product_name.toLowerCase().includes(searchTerm.toLowerCase())),
        [products, searchTerm]
    );

    // FIX: Hitung total berdasarkan tipe transaksi (selaras dengan backend)
    const totalAmount = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            const itemTotal = item.transactionType === 'buy'
                ? item.modal * item.quantity      // Pembelian: pakai harga modal
                : item.hargaJual * item.quantity;  // Penjualan: pakai harga jual
            return sum + itemTotal;
        }, 0);
    }, [cartItems]);

    const addItem = () => {
        if (!selectedProductId) {
            setMessage("Silakan pilih produk dari daftar terlebih dahulu sebelum menambah item.");
            setMessageType("warning");
            return;
        }
        const qty = Number(quantity);
        if (!qty || qty <= 0 || !Number.isInteger(qty)) {
            setMessage("Masukkan jumlah barang (Quantity) minimal 1 unit (bilangan bulat).");
            setMessageType("warning");
            return;
        }
        const mod = Number(modal);
        if (isNaN(mod) || mod < 0) {
            setMessage("Pastikan nominal modal terisi dengan benar (angka non-negatif).");
            setMessageType("warning");
            return;
        }
        const isSell = transactionType === "sell";
        const harga = Number(hargaJual || mod);
        if (isSell && (isNaN(harga) || harga < 0)) {
            setMessage("Pastikan nominal harga jual terisi dengan benar (angka non-negatif).");
            setMessageType("warning");
            return;
        }
        if (isSell && selectedProduct.product_stock < qty) {
            setMessage(`Sisa stok ${selectedProduct.product_name} hanya ${selectedProduct.product_stock} unit. Silakan kurangi quantity atau lakukan restock.`);
            setMessageType("warning");
            return;
        }

        setCartItems((current) => [
            ...current,
            {
                product_id: selectedProduct.product_id,
                product_name: selectedProduct.product_name,
                quantity: qty,
                modal: mod,
                hargaJual: harga,
                transactionType: transactionType,
                datetime: datetime || ""
            }
        ]);

        setSelectedProductId("");
        setSearchTerm("");
        setQuantity("");
        setModal("");
        setHargaJual("");
        setDatetime("");
        setMessage("");
    };

    const removeItem = (index) => {
        setCartItems((current) => current.filter((_, idx) => idx !== index));
    };

    const saveTransaction = async () => {
        if (cartItems.length === 0) {
            setMessage("Keranjang masih kosong. Yuk, tambahkan produk dulu sebelum menyimpan transaksi!");
            setMessageType("warning");
            return;
        }
        setSaving(true);
        setMessage("");

        try {
            const payload = {
                transaction_type: transactionType,
                items: cartItems.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    capital_cost: item.modal,
                    selling_price: item.hargaJual,
                    transaction_type: item.transactionType
                }))
            };

            const response = await apiFetch("/transactions/checkout", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            // Simpan data struk sebelum keranjang dikosongkan
            setLastTransaction({
                items: [...cartItems],
                total: totalAmount,
                date: new Date().toLocaleString('id-ID'),
                type: transactionType
            });

            setMessage(`Transaksi berhasil disimpan! Total belanja: Rp${response.total_belanja}`);
            setMessageType("success");
            setCartItems([]);
            fetchProducts();
            fetchHistory();
        } catch (error) {
            setMessageType("danger");
            setMessage(formatError(error));
        } finally {
            setSaving(false);
        }
    };

    return {
        cartItems, setCartItems,
        selectedProductId, setSelectedProductId,
        transactionType, setTransactionType,
        quantity, setQuantity,
        modal, setModal,
        hargaJual, setHargaJual,
        datetime, setDatetime,
        message, messageType,
        saving, lastTransaction,
        searchTerm, setSearchTerm,
        isDropdownOpen, setIsDropdownOpen,
        selectedProduct, filteredProducts,
        totalAmount,
        addItem, removeItem, saveTransaction
    };
}
