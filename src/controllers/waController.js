import Device from "../models/Device.js";
import { startSock } from "../service/waService.js"

export const pairDevice = async (req, res) => {
  const { number } = req.body;
  console.log('number', number)
  if (!number) return res.status(400).json({ error: "Nomor wajib diisi" });

  try {
    const code = await startSock(number);
    await Device.upsert({
      number,
      pairingCode: '223',
      status: "pairing",
    });

    res.json({ success: true, number, pairingCode: '223' });
  } catch (err) {
    console.error("❌ Gagal pairing:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getDevices = async (_, res) => {
  const devices = await Device.findAll();
  res.json(devices);
};

export const disconnectDevice = async (req, res) => {
  const { number } = req.body;
  await Device.update({ status: "disconnected" }, { where: { number } });
  res.json({ success: true, message: "Device disconnected" });
};

// import { getQRCode } from './waService.js'

// router.get('/qr', (req, res) => {
//   const qrData = getQRCode()
//   res.json(qrData)
// })
