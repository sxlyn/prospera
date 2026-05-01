// 🔥 PRODUCTS
export const getProducts = () => {
  try {
    const data = localStorage.getItem("products");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveProducts = (data) => {
  localStorage.setItem("products", JSON.stringify(data));
};

// 🔥 TRANSACTIONS
export const getTransactions = () => {
  try {
    const data = localStorage.getItem("transactions");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveTransactions = (data) => {
  localStorage.setItem("transactions", JSON.stringify(data));
};