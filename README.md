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

## Berkas utama

- `index.html`: struktur halaman dan overlay.
- `style.css`: tema dan layout layar sentuh.
- `app.js`: interaksi UI, publisher, subscriber, dan state perjalanan.
- `bridge.js`: koneksi rosbridge dan mekanisme reconnect/resubscribe.