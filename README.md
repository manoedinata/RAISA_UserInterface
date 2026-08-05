# RAISA User Interface

Antarmuka Electron untuk Robot RAISA yang terhubung ke ROS melalui rosbridge.

## Menjalankan aplikasi

- Instal dependensi dengan `npm install`.
- Produksi: `npm start` menggunakan jendela 1200×1920 dalam mode fullscreen.
- Development: `npm run dev` menggunakan jendela 640×960 tanpa fullscreen.

Mode development juga dapat diaktifkan dengan environment variable `NODE_ENV=development` atau argumen Electron `--dev`. Jika keduanya tidak diberikan, aplikasi otomatis menggunakan mode produksi.

## Menu Sapa Pengunjung

Menu layar penuh dapat dibuka dengan 10 kali tap tombol **INTERAKSI** dalam 3 detik atau ketika topic ROS `/vision/face_detected` (`std_msgs/Int8`) bernilai `1`. Saat menu dibuka, audio `assets/sayaraisa.mp3` diputar dari awal. Nilai `0` menghentikan audio, menutup menu, membatalkan cooldown, dan mengembalikan UI ke halaman **KONTEN**.

Jika pengunjung menekan **Tidak terima kasih (Eksplor fitur RAISA)**, menu ditutup dan tidak dapat dibuka kembali selama 10 menit. Cooldown berakhir lebih cepat jika `/vision/face_detected` mengirim nilai `0`; kondisi yang terjadi lebih dahulu yang berlaku.

Deteksi wajah hanya diproses ketika halaman aktif adalah **KONTEN**. Nilai wajah terakhir tetap disimpan; ketika user kembali ke **KONTEN**, nilai tersebut diproses kembali. Selama navigasi pengunjung menuju `titikantar` atau `titikjemput`, event `/vision/face_detected` diabaikan. Deteksi wajah aktif kembali setelah `/communication/nav_status = 1` menandakan tujuan tercapai.

Alur navigasi:

1. **Antar ke lokasi PT Optima Group** memublikasikan `titikantar` ke `/ui/goto_waypoint` (`std_msgs/String`).
2. `/communication/nav_status` (`std_msgs/Int8`) bernilai `1` menampilkan status tiba.
3. **Kembali ke Titik Jemput** memublikasikan `titikjemput`.
4. Status tiba berikutnya menutup menu dan kembali ke halaman **KONTEN**.

Tombol kembali ke Home Screen hanya menutup UI menu; navigasi robot yang sedang aktif tidak dibatalkan.

## Berkas utama

- `index.html`: struktur halaman dan overlay.
- `style.css`: tema dan layout layar sentuh.
- `app.js`: interaksi UI, publisher, subscriber, dan state perjalanan.
- `bridge.js`: koneksi rosbridge dan mekanisme reconnect/resubscribe.