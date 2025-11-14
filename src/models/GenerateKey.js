import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const GenerateKey = sequelize.define("generate_key", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  key: { type: DataTypes.STRING(255), allowNull: false, unique: true }, // ✅ FIXED
  status: { type: DataTypes.INTEGER },
});

export default GenerateKey;
