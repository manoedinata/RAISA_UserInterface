# Video Promo dengan Navigasi Otomatis

Video promo dan navigasi otomatis menggunakan alur berikut:

1. Membuka menu **VIDEO** memutar playlist promo dan mengirim `titikjemput` ke `/ui/goto_waypoint` (`std_msgs/String`).
2. Ketika `/communication/nav_status` (`std_msgs/Int8`) bernilai `1`, tunggu lima detik lalu kirim tujuan sebaliknya.
3. Ulangi navigasi `titikjemput` dan `titikantar` selama video tetap terbuka.
4. Menutup video mengirim `cancel`, menghentikan timer, dan menyimpan tujuan yang tertunda.
5. Membuka video kembali melanjutkan tujuan yang tertunda. Jika loop ditutup ketika sedang menunggu, mulai ulang jeda lima detik.
6. Pemutaran video tidak boleh terhenti atau menampilkan dialog ketika ROS tidak tersedia.

Fitur Sapa Pengunjung, deteksi wajah, audio sapaan, dan navigasi berbasis pilihan pengunjung tidak digunakan.

