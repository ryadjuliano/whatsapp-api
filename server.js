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

// dotenv.config()

// const app = express()
// const port = process.env.PORT || 3000

// async function startSock() {
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
//     printQRInTerminal: false,
//     syncFullHistory: false,
//   })

//   sock.ev.on('connection.update', async (update) => {
//     const { connection, lastDisconnect } = update

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
//         console.log('❌ Session expired. Hapus folder auth_info_multi dan pairing ulang.')
//       } else {
//         console.log('🔄 Reconnecting in 5s...')
//         setTimeout(startSock, 5000)
//       }
//     }
//   })

//   // Tunggu socket siap (delay dikit biar aman)
//   await new Promise((resolve) => setTimeout(resolve, 2000))

//   // ✅ Pairing menggunakan kode (bukan QR)
//   if (!sock.authState.creds.registered) {
//     const phoneNumber = process.env.WA_NUMBER?.replace(/\D/g, '')
//     if (!phoneNumber) {
//       console.error('❌ Tambahkan nomor WA di file .env seperti: WA_NUMBER=62812xxxxxx')
//       process.exit(1)
//     }

//     try {
//       console.log('📡 Meminta pairing code...')
//       const code = await sock.requestPairingCode(phoneNumber)
//       console.log(`\n📱 Masukkan kode ini di WhatsApp kamu:\n👉 ${code}\n`)
//     } catch (err) {
//       console.error('❌ Gagal mendapatkan pairing code:', err.message)
//     }
//   }

//   sock.ev.on('creds.update', saveCreds)
//     // ✅ Endpoint kirim pesan via HTTP (Postman)
//   app.use(express.json())

//   app.post('/send-message', async (req, res) => {
//     const { number, message } = req.body

//     if (!number || !message)
//       return res.status(400).json({ error: 'number dan message wajib diisi' })

//     // Normalisasi nomor
//     const jid = number.replace(/\D/g, '') + '@s.whatsapp.net'

//     try {
//       await sock.sendMessage(jid, { text: message })
//       res.json({ success: true, to: number, message })
//       console.log(`📩 Pesan terkirim ke ${number}: ${message}`)
//     } catch (err) {
//       console.error('❌ Gagal kirim pesan:', err)
//       res.status(500).json({ error: 'Gagal kirim pesan', detail: err.message })
//     }
//   })

// }

// startSock()

// app.get('/', (_, res) => res.send('🚀 WhatsApp Gateway Aktif'))
// app.listen(port, () => console.log(`🌐 Server berjalan di http://localhost:${port}`))

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys'
import express from 'express'
import dotenv from 'dotenv'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode-terminal'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_multi')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
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

    // ✅ Tampilkan QR code di terminal
    if (qr) {
      console.log('\n📱 Scan QR Code ini dengan WhatsApp kamu:\n')
      qrcode.generate(qr, { small: true })
    }
    console.log('conkes', connection)

    if (connection === 'connecting') {
      console.log('⏳ Menghubungkan ke WhatsApp...')
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp Connected!')
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('⚠️ Connection closed:', reason)
      if (reason === DisconnectReason.loggedOut) {
        console.log('❌ Session expired. Hapus folder auth_info_multi dan scan QR ulang.')
      } else {
        console.log('🔄 Reconnecting in 5s...')
        setTimeout(startSock, 5000)
      }
    }
  })

  sock.ev.on('creds.update', saveCreds)

  // ✅ Endpoint kirim pesan via HTTP (Postman)
  app.use(express.json())

  app.post('/send-message', async (req, res) => {
    const { number, message } = req.body

    if (!number || !message)
      return res.status(400).json({ error: 'number dan message wajib diisi' })

    // Normalisasi nomor
    const jid = number.replace(/\D/g, '') + '@s.whatsapp.net'

    try {
      await sock.sendMessage(jid, { text: message })
      res.json({ success: true, to: number, message })
      console.log(`📩 Pesan terkirim ke ${number}: ${message}`)
    } catch (err) {
      console.error('❌ Gagal kirim pesan:', err)
      res.status(500).json({ error: 'Gagal kirim pesan', detail: err.message })
    }
  })
}

startSock()

app.get('/', (_, res) => res.send('🚀 WhatsApp Gateway Aktif'))
app.listen(port, () => console.log(`🌐 Server berjalan di http://localhost:${port}`))