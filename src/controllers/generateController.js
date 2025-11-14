import GenerateKey from "../models/GenerateKey.js";

// ✅ Get all keys
export const getAllKeys = async (req, res) => {
  try {
    const keys = await GenerateKey.findAll();
    res.json(keys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Create new key
export const createKey = async (req, res) => {
  try {
    const { name, key, status } = req.body;
    if (!name || !key) return res.status(400).json({ message: "Name dan key wajib diisi" });

    const newKey = await GenerateKey.create({ name, key, status: status || 1 });
    res.status(201).json(newKey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update key
export const updateKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, key, status } = req.body;

    const existing = await GenerateKey.findByPk(id);
    if (!existing) return res.status(404).json({ message: "Data tidak ditemukan" });

    await existing.update({ name, key, status });
    res.json(existing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete key
export const deleteKey = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await GenerateKey.findByPk(id);
    if (!existing) return res.status(404).json({ message: "Data tidak ditemukan" });

    await existing.destroy();
    res.json({ message: "Data berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
