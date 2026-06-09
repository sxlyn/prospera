import { useEffect, useMemo, useState } from "react";
import { apiFetch, formatError } from "../utils/api";
import { getTransactionTypeLabel } from "../utils/transactionHelpers";

export function useTransactionLogic() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [transactionType, setTransactionType] = useState("sell");
  const [quantity, setQuantity] = useState("");
  const [modal, setModal] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [datetime, setDatetime] = useState("");
  
  const [message, setMessage] = useState(""); 
  const [messageType, setMessageType] = useState("warning"); 
  const [fetchError, setFetchError] = useState(null); 
  
  // State untuk menyimpan struk terakhir
  const [lastTransaction, setLastTransaction] = useState(null); 
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState("ALL");
  const [dateFilterType, setDateFilterType] = useState("ALL"); 
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState("");

  const fetchProducts = async () => {
    try {
      const data = await apiFetch("/products");
      // Use fallback if paginated format, since products dropdown doesn't need pagination here yet
      setProducts(data.products ? data.products : (Array.isArray(data) ? data : []));
    } catch (error) {
      setFetchError(formatError(error)); 
    }
  };

  // Pagination State for History
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalItems, setHistoryTotalItems] = useState(0);
  const historyLimit = 10;

  const fetchHistory = async (type = dateFilterType, start = customStartDate, end = customEndDate, page = 1) => {
    setLoading(true);
    try {
      let url = "/transactions/history";
      let queryParams = [`page=${page}`, `limit=${historyLimit}`];
      const today = new Date();

      if (type === "TODAY") {
        const offset = today.getTimezoneOffset() * 60000;
        const localDate = (new Date(today - offset)).toISOString().split('T')[0];
        queryParams.push(`start=${localDate}`);
        queryParams.push(`end=${localDate}`);
      } else if (type === "MONTH") {
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
        queryParams.push(`start=${year}-${month}-01`);
        queryParams.push(`end=${year}-${month}-${lastDay}`);
      } else if (type === "CUSTOM" && start && end) {
        queryParams.push(`start=${start}`);
        queryParams.push(`end=${end}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      const data = await apiFetch(url);
      if (data.transactions) {
        setHistory(data.transactions);
        setHistoryPage(data.currentPage);
        setHistoryTotalPages(data.totalPages);
        setHistoryTotalItems(data.totalItems);
      } else {
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      setFetchError(formatError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchHistory("ALL", "", "");
  }, []);

  const selectedProduct = products.find((p) => String(p.product_id) === String(selectedProductId));

  useEffect(() => {
    if (!selectedProduct) {
      setModal("");
      setHargaJual("");
      return;
    }
    if (!modal) setModal(String(selectedProduct.product_cost ?? ""));
    if (!hargaJual) {
      setHargaJual(
        String(transactionType === "sell" ? selectedProduct.product_price ?? selectedProduct.product_cost : selectedProduct.product_cost)
      );
    }
  }, [selectedProduct, transactionType]);

  const handleDateFilterChange = (type) => {
    setDateFilterType(type);
    if (type !== "CUSTOM") {
      setIsDateMenuOpen(false);
      setHistoryPage(1);
      fetchHistory(type, "", "", 1);
    }
  };

  const applyCustomDate = () => {
    setIsDateMenuOpen(false);
    setHistoryPage(1);
    fetchHistory("CUSTOM", customStartDate, customEndDate, 1);
  };

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

  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const closeTransactionModal = () => {
    setSelectedTransaction(null);
    setShowTransactionModal(false);
  };

  // FIX: Hitung total berdasarkan tipe transaksi (selaras dengan backend)
  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const itemTotal = item.transactionType === 'buy'
        ? item.modal * item.quantity      // Pembelian: pakai harga modal
        : item.hargaJual * item.quantity;  // Penjualan: pakai harga jual
      return sum + itemTotal;
    }, 0);
  }, [cartItems]);

  const saveTransaction = async () => {
    if (cartItems.length === 0) {
      setMessage("Keranjang masih kosong. Yuk, tambahkan produk dulu sebelum menyimpan transaksi!");
      setMessageType("warning");
      return;
    }
    setSaving(true);
    setMessage("");
    setFetchError(null); 

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

  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = history.filter((tx) => {
    const matchTab = activeTab === "ALL" || getTransactionTypeLabel(tx) === activeTab;
    const matchSearch = tx.TransactionDetails?.some(item => 
      item.Product?.product_name?.toLowerCase().includes(historySearchTerm.toLowerCase())
    );
    return matchTab && (historySearchTerm === "" || matchSearch);
  });

  return {
    cartItems, setCartItems, selectedProductId, setSelectedProductId,
    transactionType, setTransactionType, quantity, setQuantity,
    modal, setModal, hargaJual, setHargaJual, datetime, setDatetime,
    message, messageType, fetchError, loading, saving, lastTransaction,
    searchTerm, setSearchTerm, isDropdownOpen, setIsDropdownOpen,
    selectedTransaction, showTransactionModal, activeTab, setActiveTab,
    dateFilterType, customStartDate, setCustomStartDate,
    customEndDate, setCustomEndDate, isDateMenuOpen, setIsDateMenuOpen,
    historySearchTerm, setHistorySearchTerm,
    filteredProducts, filteredHistory, totalAmount,
    historyPage, historyTotalPages, historyTotalItems, fetchHistory,
    handleDateFilterChange, applyCustomDate, addItem, removeItem,
    getTransactionTypeLabel, openTransactionModal, closeTransactionModal, saveTransaction
  };
}