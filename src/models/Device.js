import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Device = sequelize.define("device", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  number: { type: DataTypes.STRING, allowNull: false, unique: true },
  status: { type: DataTypes.STRING, defaultValue: "disconnected" },
  pairingCode: { type: DataTypes.STRING, allowNull: true },
});

export default Device;
