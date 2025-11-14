import GenerateKey from "../models/GenerateKey";

export const findAllKeys = async () => await GenerateKey.findAll();

export const createNewKey = async (data) => await GenerateKey.create(data);

export const updateExistingKey = async (id, data) => {
  const record = await GenerateKey.findByPk(id);
  if (!record) throw new Error("Data tidak ditemukan");
  return await record.update(data);
};

export const deleteKeyById = async (id) => {
  const record = await GenerateKey.findByPk(id);
  if (!record) throw new Error("Data tidak ditemukan");
  await record.destroy();
  return true;
};
