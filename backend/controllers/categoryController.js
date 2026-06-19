const { Category, Product } = require('../models');

// GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const owner_id = req.user.store_id;
    
    const categories = await Category.findAll({
      where: { user_id_fk: owner_id },
      order: [['category_name', 'ASC']]
    });

    res.json({ categories });
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil kategori' });
  }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    const owner_id = req.user.store_id;
    const { category_name, requires_expired_date } = req.body;

    if (!category_name) {
      return res.status(400).json({ message: 'Nama kategori tidak boleh kosong' });
    }

    const category = await Category.create({
      user_id_fk: owner_id,
      category_name,
      requires_expired_date: requires_expired_date || false
    });

    res.status(201).json({ message: 'Kategori berhasil ditambahkan', category });
  } catch (error) {
    console.error('Error in createCategory:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat membuat kategori' });
  }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const owner_id = req.user.store_id;
    const { id } = req.params;
    const { category_name, requires_expired_date } = req.body;

    const category = await Category.findOne({
      where: { category_id: id, user_id_fk: owner_id }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    category.category_name = category_name || category.category_name;
    if (requires_expired_date !== undefined) {
      category.requires_expired_date = requires_expired_date;
    }

    await category.save();

    res.json({ message: 'Kategori berhasil diperbarui', category });
  } catch (error) {
    console.error('Error in updateCategory:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat memperbarui kategori' });
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const owner_id = req.user.store_id;
    const { id } = req.params;

    const category = await Category.findOne({
      where: { category_id: id, user_id_fk: owner_id }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    // Cek apakah ada produk yang masih memakai kategori ini
    const productsUsingCategory = await Product.count({
      where: { category_id_fk: id }
    });

    if (productsUsingCategory > 0) {
      return res.status(400).json({ 
        message: `Tidak dapat menghapus kategori. Ada ${productsUsingCategory} produk yang masih menggunakan kategori ini.` 
      });
    }

    await category.destroy();

    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat menghapus kategori' });
  }
};
