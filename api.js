

import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import express from 'express'
import qrcode from 'qrcode-terminal'
import pino from 'pino'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_multi')

  const sock = makeWASocket({
    printQRInTerminal: false, // deprecated
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '22.04.4']
  })

  // ✅ Handle QR dan koneksi
  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update

    if (qr) {
      console.log('\n🔐 Scan QR di bawah ini untuk login WhatsApp:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp connected!')
    } else if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      if (reason === DisconnectReason.loggedOut) {
        console.log('❌ Session invalid, hapus folder auth_info_multi dan login ulang.')
      } else {
        console.log('⚠️ Connection closed, reconnecting...')
        startSock() // auto reconnect
      }
    }
  })

  // ✅ Simpan kredensial auth
  sock.ev.on('creds.update', saveCreds)

  return sock
}

startSock()

// ✅ Express Gateway
app.get('/', (req, res) => {
  res.send('🚀 Gateway aktif & menunggu koneksi WhatsApp...')
})

app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`)
})
