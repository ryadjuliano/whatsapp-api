import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import waRoutes from "./routes/waRoutes.js";
import generateKeyRoutes from "./routes/generateRoutes.js"

// ✅ Import semua model di sini
import "./models/Users.js";
import "./models/Device.js"
import "./models/GenerateKey.js"

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => res.send("🚀 WhatsApp Gateway Aktif!"));
app.use("/api", waRoutes);
app.use("/api/generate-keys", generateKeyRoutes);

const PORT = process.env.PORT || 3000;

// Sync DB dan start server
sequelize.sync({
 force: false,   // ❌ jangan drop & recreate table
  alter: false   
}).then(() => {
  app.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
  );
});
