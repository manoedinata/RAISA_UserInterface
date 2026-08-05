# RAISA User Interface

Antarmuka Electron untuk Robot RAISA yang terhubung ke ROS melalui rosbridge.

## Menjalankan aplikasi

- Instal dependensi dengan `npm install`.
- Produksi: `npm start` menggunakan jendela 1200×1920 dalam mode fullscreen.
- Development: `npm run dev` menggunakan jendela 640×960 tanpa fullscreen.

Mode development juga dapat diaktifkan dengan environment variable `NODE_ENV=development` atau argumen Electron `--dev`. Jika keduanya tidak diberikan, aplikasi otomatis menggunakan mode produksi.

## Menu Sapa Pengunjung

Menu layar penuh dapat dibuka dengan 10 kali tap tombol **INTERAKSI** dalam 3 detik atau ketika topic ROS `/vision/face_detected` (`std_msgs/Int8`) bernilai `1`. Saat menu dibuka, audio `assets/sayaraisa.mp3` diputar dari awal. Nilai `0` menghentikan audio, menutup menu, dan mengembalikan UI ke halaman **KONTEN**.

Jika pengunjung menekan **Tidak terima kasih (Eksplor fitur RAISA)**, menu hanya ditutup dan dapat dibuka kembali melalui trigger yang tersedia.

Deteksi wajah hanya diproses ketika halaman aktif adalah **KONTEN**, termasuk saat robot sedang menjalankan loop navigasi. Nilai wajah terakhir tetap disimpan; ketika user kembali ke **KONTEN**, nilai tersebut diproses kembali. Jika wajah tidak terdeteksi, page Sapa ditutup tetapi loop navigasi tetap berjalan.

Mode **AUTO** pada menu Navigasi menjalankan loop `titikjemput → tunggu 5 detik → titikantar → tunggu 5 detik` secara terus-menerus. Mode ini dapat dihentikan dengan tombol **CANCEL**. Jika pengunjung memilih pengantaran ke PT Optima Group, navigasi pengunjung mengambil alih sementara status navigasi loop.

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