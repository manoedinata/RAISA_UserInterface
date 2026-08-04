# RAISA User Interface

Antarmuka Electron untuk Robot RAISA yang terhubung ke ROS melalui rosbridge.

## Menjalankan aplikasi

- Instal dependensi dengan `npm install`.
- Jalankan antarmuka dengan `npm start`.

## Menu Sapa Pengunjung

Menu layar penuh dapat dibuka dengan 10 kali tap tombol **INTERAKSI** dalam 3 detik atau ketika topic ROS `/vision/face_detected` (`std_msgs/Int8`) bernilai `1`. Saat menu dibuka, audio `assets/sayaraisa.mp3` diputar dari awal. Nilai `0` menghentikan audio, menutup menu, dan mengembalikan UI ke halaman **KONTEN**.

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