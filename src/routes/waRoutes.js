// import express from "express";
// import { pairDevice, getDevices, disconnectDevice } from "../controllers/waController.js";
// import { getQRCode,sendMessage } from '../service/waService.js'
// const router = express.Router();

// router.get("/devices", getDevices);
// router.post("/pair", pairDevice);
// router.post("/disconnect", disconnectDevice);
// router.get('/qrcode', (req, res) => {
//   const qrData = getQRCode()
//   res.json(qrData)
// })
// router.post("/send-message", sendMessage);


// export default router;

import express from "express";
import { pairDevice, getDevices, disconnectDevice } from "../controllers/waController.js";
import { getQRCode, sendMessage as sendMessageService } from "../service/waService.js";

const router = express.Router();

router.get("/devices", getDevices);
router.post("/pair", pairDevice);
router.post("/disconnect", disconnectDevice);

router.get("/qrcode", (req, res) => {
  const qrData = getQRCode();
  res.json(qrData);
});

// router.post("/send-message", sendMessageService);

// // ✅ Bungkus fungsi service jadi handler Express
// router.post("/send-message", async (req, res) => {
//   try {
//     const result = await sendMessageService(req); // tetap kirim req
//     res.json(result); // kirim hasilnya ke client
//   } catch (err) {
//     res.status(500).json({ error: err.message || "Gagal mengirim pesan" });
//   }
// });

router.post("/send-message", async (req, res) => {
  try {
    const { to, message } = req.body.from;
    console.log('req.body:', req.body.from);

    if (!to || !message) {
      return res.status(400).json({ success: false, message: "Parameter tidak lengkap" });
    }

    // Panggil fungsi service
    const result = await sendMessageService(to, message);
    console.log('result',result)
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('❌ Error sendMessage:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});


export default router;
