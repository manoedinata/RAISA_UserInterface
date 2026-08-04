# Menu Sapa Pengunjung

Buatkan sebuah page baru yang berisikan

Judul: Selamat datang
Isi:

```
Halo! Saya Robot asisten RAISA siap membantu. Apakah Anda ingin saya antar ke lokasi PT Optima Group?
```

Kemudian di bawahnya ada 2 tombol, yaitu:
1. Antar ke lokasi PT Optima Group
2. Tidak, terima kasih. Kembali ke Home Screen

Page ini bisa di trigger dengan dua cara, yaitu:

1. Dengan menekan tombol Interaksi berkali-kali di homescreen untuk membuka page ini. Sama seperti menekoan tombol Konten berkali-kali untuk membuka developer page tersembunyi.
2. Subscribe ke ROS Topic `/vision/face_detected`. Jika nilainya 1, maka page ini akan terbuka. Jika nilainya 0, maka page ini akan ditutup secara otomatis dan kembali ke home screen. Cek apakah page sudah terbuka sebelum membuka page ini, jika sudah terbuka maka tidak perlu membuka lagi. Jika page ini terbuka dan ROS Topic `/vision/face_detected` bernilai 0, maka page ini akan ditutup secara otomatis dan kembali ke home screen.

Kemudian, jika pengunjung menekan tombol "Antar ke lokasi PT Optima Group", maka akan men-trigger `sendWaypointToROS(name)` dari `app.js` dengan parameter `name` bernilai "titikantar". Robot akan navigasi ke titik antar yang sudah di set di ROS.

Selanjutnya, subscribe juga ke nav status seperti

```js
safeSubscribe("/communication/nav_status", "std_msgs/Int8", (msg) => {
  if (msg.data === 1) {
    // robot sudah sampai di titik antar
  }
});
```

Jika sudah sampai, update UI menjadi menampilkan pesan "Robot sudah sampai di titik antar." dan menampilkan tombol "Kembali ke Titik Jemput" dan "Kembali ke Home Screen". Jika pengunjung menekan tombol ini, maka akan men-trigger `sendWaypointToROS(name)` dari `app.js` dengan parameter `name` bernilai "titikjemput". Robot akan navigasi ke titik jemput yang sudah di set di ROS. Jika sudah sampai di titik jemput, kembali ke Home Screen secara otomatis.

