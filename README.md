# RAISA User Interface

Antarmuka Electron untuk Robot RAISA yang terhubung ke ROS melalui rosbridge.

## Menjalankan aplikasi

- Instal dependensi dengan `npm install`.
- Produksi: `npm start` menggunakan jendela 1200×1920 dalam mode fullscreen.
- Development: `npm run dev` menggunakan jendela 640×960 tanpa fullscreen.

Mode development juga dapat diaktifkan dengan environment variable `NODE_ENV=development` atau argumen Electron `--dev`. Jika keduanya tidak diberikan, aplikasi otomatis menggunakan mode produksi.

## Video Promo dan Navigasi Otomatis

Membuka **VIDEO** memutar playlist promo sekaligus mengaktifkan navigasi otomatis. Robot bergerak bolak-balik dengan urutan `titikjemput → tunggu 5 detik → titikantar → tunggu 5 detik`, lalu mengulang urutan selama video promo terbuka.

Menutup video memublikasikan `cancel` ke `/ui/goto_waypoint` (`std_msgs/String`) dan menghentikan timer tunggu. Tujuan aktif tetap disimpan. Ketika video dibuka kembali, robot melanjutkan tujuan yang tertunda; jika loop dihentikan saat menunggu, jeda lima detik dimulai kembali sebelum waypoint berikutnya dikirim.

Status kedatangan dibaca dari `/communication/nav_status` (`std_msgs/Int8`). Nilai `1` menandai waypoint aktif telah tercapai dan memulai jeda lima detik. Video tetap diputar selama perjalanan dan jeda. Kegagalan koneksi ROS tidak menghentikan pemutaran video.

Menu Navigasi tetap tersedia untuk memilih waypoint secara manual, tetapi loop otomatis hanya dikendalikan oleh buka/tutup video promo.

## Lock Screen Idle (Mode Pameran)

Ketika tidak ada interaksi pada UI utama (menu Konten, Informasi, dan Interaksi) selama 60 detik, aplikasi otomatis meluncurkan Mode Pameran sebagai "lock screen" sederhana melalui `POST /api/pameran/spawn`.

Interaksi apa pun (`pointerdown`, `keydown`, `touchstart`, atau `wheel`) mereset penghitung idle. Peluncuran ditunda selama konten fullscreen (video promo atau kamera) sedang ditampilkan agar tidak menginterupsi pemutaran. Ambang waktu diatur oleh konstanta `PAMERAN_IDLE_TIMEOUT_MS` di `app.js`.

## API Lokal

Proses Electron (`main.js`) menjalankan server HTTP lokal di `http://localhost:9999` untuk mengendalikan pemutaran musik latar dan memulai Mode Pameran. Server hanya mendengarkan di `localhost` sehingga tidak terekspos ke jaringan.

Daftar musik didefinisikan sekali di `music.js` dan dipakai bersama oleh menu UI (`renderMusicList`) dan API, sehingga nama yang diterima API sama persis dengan yang ditampilkan di daftar musik.

- `GET /api/music` mengembalikan daftar nama musik.

  ```json
  { "music": ["- - Stop Music - -", "rek-ayo-rek", "Hymne-ITS"] }
  ```

- `POST /api/music/play` memutar musik melalui `playMusic()` di `app.js`. Body JSON berisi `name` yang harus cocok dengan salah satu nama dari `GET /api/music`. Mengirim `"- - Stop Music - -"` menghentikan pemutaran.

  ```bash
  curl -X POST http://localhost:9999/api/music/play \
    -H "Content-Type: application/json" \
    -d '{"name": "Hymne-ITS"}'
  ```

  Respons: `202` dengan `{ "success": true, "name": "Hymne-ITS" }` bila diterima, `400` bila nama tidak valid (menyertakan daftar `music`), atau `503` bila renderer belum siap.

- `POST /api/pameran/spawn` memulai Chrome kiosk untuk Mode Pameran pada URL `http://localhost:8090`.

  ```bash
  curl -X POST http://localhost:9999/api/pameran/spawn
  ```

  Respons: `202` dengan `{ "success": true, "message": "Mode Pameran kiosk launched", "url": "http://localhost:8090" }` bila proses peluncuran diterima.

## Berkas utama

- `index.html`: struktur halaman dan overlay.
- `style.css`: tema dan layout layar sentuh.
- `app.js`: interaksi UI, publisher, subscriber, dan state perjalanan.
- `music.js`: katalog musik bersama (dipakai `app.js` dan `main.js`).
- `bridge.js`: koneksi rosbridge dan mekanisme reconnect/resubscribe.
- `pameran.html`: halaman display pameran mandiri berbasis Bootstrap dengan orb besar, ikon Lucide, dan transisi ikon/teks otomatis setiap lima detik.

## Display Pameran

`pameran.html` saat ini hanya mengimplementasikan UI dan tidak terhubung ke ROS atau WebSocket. Halaman menampilkan empat state contoh (suara, percakapan, musik, dan wajah) untuk mendemonstrasikan animasi transisi. Bootstrap 5.3.3 dan Lucide 0.468.0 dimuat dari CDN, sehingga koneksi internet diperlukan agar styling Bootstrap dan ikon tersedia.