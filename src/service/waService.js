import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import QRCode from 'qrcode'

let sock = null
let qrCodeData = null
let qrRawData = null // ✅ Simpan raw QR string
let connectionStatus = 'disconnected'

export async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_multi')
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    logger: pino({ level: 'silent' }),
    browser: ['MacOS', 'Chrome', '121.0.0'],
    syncFullHistory: false,
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // ✅ Generate QR code sebagai data URL untuk frontend
    if (qr) {
      console.log('📱 QR Code generated')
      console.log('QR Raw Data:', qr) // Debug: lihat QR string
      
      qrRawData = qr
      
      // Generate dengan error correction level HIGH untuk compatibility
      try {
        qrCodeData = await QRCode.toDataURL(qr, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 1,
          margin: 1,
          width: 512 // Ukuran lebih besar = lebih mudah di-scan
        })
        connectionStatus = 'qr_ready'
        console.log('✅ QR Code successfully generated for frontend')
      } catch (err) {
        console.error('❌ Error generating QR:', err)
      }
    }

    if (connection === 'connecting') {
      console.log('⏳ Menghubungkan ke WhatsApp...')
      connectionStatus = 'connecting'
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp Connected!')
      connectionStatus = 'connected'
      qrCodeData = null // Clear QR setelah connected
      qrRawData = null
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('⚠️ Connection closed:', reason)
      connectionStatus = 'disconnected'
      qrCodeData = null
      qrRawData = null
      
      if (reason === DisconnectReason.loggedOut) {
        console.log('❌ Session expired. Hapus folder auth_info_multi dan scan QR ulang.')
      } else {
        console.log('🔄 Reconnecting in 5s...')
        setTimeout(startSock, 5000)
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  return sock
}




// import makeWASocket, {
//   useMultiFileAuthState,
//   DisconnectReason,
//   fetchLatestBaileysVersion,
//   makeCacheableSignalKeyStore
// } from '@whiskeysockets/baileys'
// import express from 'express'
// import dotenv from 'dotenv'
// import { Boom } from '@hapi/boom'
// import pino from 'pino'
// import qrcode from 'qrcode-terminal'
//  import QRCode from 'qrcode'

// let sock = null
// let qrCodeData = null
// let qrRawData = null // ✅ Simpan raw QR string
// let connectionStatus = 'disconnected'


// export async function startSock() {
//   const { state, saveCreds } = await useMultiFileAuthState('./auth_info_multi')
//   const { version } = await fetchLatestBaileysVersion()

//   const sock = makeWASocket({
//     version,
//     auth: {
//       creds: state.creds,
//       keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
//     },
//     logger: pino({ level: 'silent' }),
//     browser: ['MacOS', 'Chrome', '121.0.0'],
//     syncFullHistory: false,
//   })

//   sock.ev.on('connection.update', async (update) => {
//     const { connection, lastDisconnect, qr } = update

//     // ✅ Tampilkan QR code di terminal
//     if (qr) {
//       console.log('\n📱 Scan QR Code ini dengan WhatsApp kamu:\n')
//       qrcode.generate(qr, { small: true })
//       //       // Generate dengan error correction level HIGH untuk compatibility
//       try {
//         qrCodeData = await QRCode.toDataURL(qr, {
//           errorCorrectionLevel: 'H',
//           type: 'image/png',    
//           quality: 1,
//           margin: 1,
//           width: 512 // Ukuran lebih besar = lebih mudah di-scan
//         })
//         connectionStatus = 'qr_ready'
//         console.log('✅ QR Code successfully generated for frontend')
//       } catch (err) {
//         console.error('❌ Error generating QR:', err)
//       }
//     }

//     if (connection === 'connecting') {
//       console.log('⏳ Menghubungkan ke WhatsApp...')
//     }

//     if (connection === 'open') {
//       console.log('✅ WhatsApp Connected!')
//     }

//     if (connection === 'close') {
//       const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
//       console.log('⚠️ Connection closed:', reason)
//       if (reason === DisconnectReason.loggedOut) {
//         console.log('❌ Session expired. Hapus folder auth_info_multi dan scan QR ulang.')
//       } else {
//         console.log('🔄 Reconnecting in 5s...')
//         setTimeout(startSock, 5000)
//       }
//     }
//   })

//   sock.ev.on('creds.update', saveCreds)
//   return sock
// }

// ✅ Function untuk mendapatkan QR Code
export function getQRCode() {
  return {
    status: connectionStatus,
    qr: qrCodeData,
    qrRaw: qrRawData, // Raw string untuk debugging
    connected: connectionStatus === 'connected'
  }
}

// ✅ Function untuk mendapatkan status
export function getStatus() {
  return {
    status: connectionStatus,
    connected: connectionStatus === 'connected'
  }
}

// ✅ Function untuk kirim pesan (single)
//  const { from, to, message } = req.body;
export async function sendMessage(number, message) {

  if (!sock || connectionStatus !== 'connected') {
    throw new Error('❌ WhatsApp belum terhubung');
  }

  if (!number || !message) {
    throw new Error('❌ Parameter "to" dan "message" wajib diisi.');
  }

  // Normalize phone number
  const phoneNumber = number.toString().replace(/\D/g, '');
  const jid = `${phoneNumber}@s.whatsapp.net`;

  try {
    await sock.sendMessage(jid, { text: message });
    console.log(`📩 Pesan terkirim ke ${phoneNumber}: ${message}`);
    return { success: true, to: phoneNumber, message };
  } catch (err) {
    console.error('❌ Gagal kirim pesan:', err.message || err);
    throw err;
  }
}


// ✅ Function untuk kirim pesan ke banyak nomor sekaligus
export async function sendBulkMessage(phoneNumbers, message) {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp belum terhubung')
  }

  if (!Array.isArray(phoneNumbers)) {
    throw new Error('phoneNumbers harus berupa array')
  }

  const results = []
  
  for (const number of phoneNumbers) {
    const jid = number.replace(/\D/g, '') + '@s.whatsapp.net'
    
    try {
      await sock.sendMessage(jid, { text: message })
      console.log(`📩 Pesan terkirim ke ${number}`)
      results.push({ success: true, number, message })
      
      // Delay 1 detik antar pesan biar aman
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (err) {
      console.error(`❌ Gagal kirim ke ${number}:`, err.message)
      results.push({ success: false, number, error: err.message })
    }
  }
  
  return results
}

// ✅ Function untuk restart koneksi
export async function restartConnection() {
  try {
    connectionStatus = "restarting";
    qrCodeData = null;
    qrRawData = null;

    console.log("🔄 Restarting WhatsApp connection...");

    // Jika sudah ada socket, tutup dulu
    if (sock) {
      try {
        await sock.ws.close();
      } catch (err) {
        console.warn("⚠️ Socket force-closed:", err.message);
      }
      sock = null;
    }

    // Start ulang koneksi
    const newSock = await startSock();

    connectionStatus = "connected";

    return {
      success: true,
      message: "WhatsApp berhasil direstart",
      status: connectionStatus,
      device: newSock.user || null,
    };

  } catch (error) {
    console.error("❌ Restart connection failed:", error);

    return {
      success: false,
      message: "Gagal restart koneksi WhatsApp",
      error: error.message || error,
    };
  }
}


// ✅ Function untuk mendapatkan socket instance
export function getSocket() {
  return sock
}