# Panduan dan Dokumentasi Aplikasi SiKEPo

Sistem Informasi Kepegawaian dan Penilaian Kinerja (SiKEPo) merupakan aplikasi berbasis web yang dirancang untuk memfasilitasi pengelolaan data kepegawaian, autentikasi berbasis hak akses, serta pemantauan dan pencatatan kinerja pegawai secara terstruktur dan terpadu.

Aplikasi ini dibangun dengan arsitektur terpisah antara layanan pemrosesan data di sisi server dan tampilan antarmuka interaktif di sisi pengguna.

---

## Prasyarat Sistem

Sebelum memulai proses pemasangan dan menjalankan aplikasi, pastikan perangkat Anda telah memenuhi prasyarat berikut:

1. **Sistem Kontrol Versi Git**  
   Digunakan untuk mengunduh dan menyinkronkan repositori proyek ke perangkat lokal.
2. **Bahasa Pemrograman dan Lingkungan Eksekusi Server**  
   Perangkat harus memiliki lingkungan pengembangan Go yang telah terpasang dengan versi modern untuk menjalankan layanan server.
3. **Lingkungan Eksekusi Antarmuka Pengguna**  
   Perangkat harus memiliki lingkungan Node.js beserta manajer paket pendukungnya untuk memasang pustaka dan menjalankan antarmuka web.
4. **Server Basis Data Relasional**  
   Layanan basis data MySQL atau MariaDB yang aktif dan dapat diakses secara lokal maupun jarak jauh.
5. **Peramban Web Modern**  
   Peramban seperti Google Chrome, Mozilla Firefox, atau Microsoft Edge untuk mengakses antarmuka pengguna.
6. **Koneksi Internet**  
   Diperlukan pada tahap awal untuk mengunduh seluruh pustaka pihak ketiga dan modul pendukung.

---

## Langkah 1: Mengunduh Proyek (Cloning)

1. Buka aplikasi terminal atau baris perintah pada komputer Anda.
2. Arahkan ke folder penyimpanan yang Anda inginkan di komputer lokal.
3. Lakukan proses penggandaan repositori dari tautan repositori resmi yang telah disediakan oleh penyedia kode sumber.
4. Setelah proses pengunduhan selesai, masuk ke dalam folder utama proyek yang baru saja dibuat.
5. Di dalam folder utama, Anda akan menemukan dua bagian utama, yaitu bagian pengelola server dan bagian tampilan antarmuka.

---

## Langkah 2: Persiapan Basis Data

1. Jalankan layanan basis data di komputer Anda melalui panel kontrol basis data atau layanan sistem.
2. Buka aplikasi manajemen basis data yang biasa Anda gunakan.
3. Buat sebuah basis data baru dengan nama yang sesuai untuk menampung seluruh tabel dan data aplikasi.
4. Catat informasi akses basis data Anda, meliputi:
   - Alamat host server basis data
   - Port koneksi
   - Nama pengguna basis data
   - Kata sandi basis data
   - Nama basis data yang baru saja dibuat

---

## Langkah 3: Konfigurasi dan Menjalankan Layanan Server

Layanan server bertugas mengelola logika bisnis, autentikasi pengguna, otorisasi peran, serta komunikasi langsung dengan basis data.

### Persiapan Konfigurasi Server
1. Masuk ke dalam direktori layanan server.
2. Salin template konfigurasi lingkungan yang tersedia untuk membuat konfigurasi lingkungan kerja aktif Anda.
3. Sesuaikan seluruh parameter konfigurasi lingkungan dengan informasi sistem Anda, khususnya:
   - Port jaringan yang digunakan oleh server untuk menerima koneksi
   - Kredensial koneksi basis data (host, port, pengguna, kata sandi, nama basis data)
   - Kunci rahasia untuk pembuatan dan verifikasi token keamanan sesi pengguna

### Pemasangan Dependensi Server
1. Melalui jendela baris perintah di dalam direktori server, jalankan perintah sinkronisasi dependensi untuk mengunduh seluruh pustaka yang dibutuhkan oleh server.
2. Tunggu hingga semua pustaka eksternal selesai diunduh dan diverifikasi secara otomatis oleh sistem.

### Menjalankan Layanan Server
1. Eksekusi perintah untuk mengompilasi dan menyalakan server aplikasi.
2. Amati pesan status pada baris perintah. Apabila koneksi basis data berhasil terhubung dan server sukses berjalan, akan muncul pemberitahuan bahwa server siap mendengarkan permintaan jaringan pada port yang telah ditentukan.
3. Biarkan jendela baris perintah ini tetap menyala selama Anda menggunakan aplikasi.

---

## Langkah 4: Konfigurasi dan Menjalankan Tampilan Antarmuka

Antarmuka pengguna bertugas menyajikan visual interaktif, formulir input, dan navigasi bagi pegawai maupun administrator.

### Pemasangan Dependensi Antarmuka
1. Buka jendela terminal atau baris perintah baru tanpa menutup jendela server yang sedang aktif.
2. Masuk ke dalam direktori tampilan antarmuka.
3. Jalankan perintah instalasi paket agar seluruh pustaka grafis, kerangka kerja tampilan, dan ikon yang dibutuhkan terpasang lengkap di komputer Anda.
4. Tunggu hingga proses pengunduhan seluruh modul selesai dengan sukses.

### Pengaturan Alamat Komunikasi Server
1. Secara bawaan pada lingkungan pengembangan lokal, antarmuka telah dikonfigurasi untuk terhubung langsung ke layanan server lokal.
2. Apabila server dijalankan pada alamat jaringan atau port yang berbeda, sesuaikan pengaturan alamat koneksi pada variabel lingkungan antarmuka dengan alamat tujuan server Anda.

### Menjalankan Antarmuka Pengguna
1. Jalankan perintah untuk memulai server pengembangan antarmuka web lokal.
2. Baris perintah akan menampilkan alamat web lokal yang siap dikunjungi.
3. Buka peramban web pilihan Anda, lalu masukkan alamat tersebut pada bilah pencarian peramban.
4. Halaman utama aplikasi akan langsung terbuka dan siap untuk digunakan.

---

## Peran dan Hak Akses Pengguna

Aplikasi ini menerapkan sistem keamanan bertingkat berdasarkan peran pengguna:

| Peran Pengguna | Kewenangan Utama |
| --- | --- |
| **Administrator** | Memiliki kendali penuh terhadap sistem, membuat akun pengguna baru, mengedit data pengguna, mereset kata sandi, mengubah hak akses peran, serta menghapus akun pengguna non-aktif. |
| **Pimpinan** | Memantau kinerja seluruh pegawai, melihat laporan agregat, menyetujui evaluasi berkala, dan meninjau pencapaian target organisasi. |
| **Pegawai / Staff** | Mengisi presensi atau catatan kehadiran harian, memperbarui profil pribadi, mengisi lembar pencapaian kinerja individu, serta melihat riwayat penilaian mandiri. |

---

## Alur Kerja Penggunaan Aplikasi

1. **Proses Masuk (Login)**  
   Pengguna memasukkan identitas berupa nomor induk pegawai atau alamat surat elektronik beserta kata sandi yang telah terdaftar.
2. **Validasi Keamanan**  
   Sistem memverifikasi kecocokan identitas dan menerbitkan token otentikasi digital yang disimpan dengan aman pada sesi peramban.
3. **Pengalihan Halaman Berdasarkan Peran**  
   Setelah berhasil masuk, pengguna akan diarahkan ke halaman beranda atau dashboard sesuai peran masing-masing.
4. **Pengelolaan Profil**  
   Pengguna dapat memperbarui informasi pribadi dan mengubah kata sandi secara mandiri pada menu pengaturan profil.
5. **Pengelolaan Pengguna (Khusus Administrator)**  
   Administrator dapat membuka menu manajemen pengguna untuk memfilter, mencari, menambah, memperbarui, atau menghapus pengguna sistem dengan konfirmasi keamanan.
6. **Keluar Sistem (Logout)**  
   Setelah selesai beraktivitas, pengguna disarankan untuk menekan tombol keluar guna menghapus sesi aktif dan menjaga keamanan data.

---

## Panduan Penanganan Kendala Umum

- **Koneksi Basis Data Gagal**  
  Pastikan mesin layanan basis data Anda dalam status berjalan, nomor port tidak terblokir oleh dinding api sistem, serta nama pengguna dan kata sandi basis data telah dimasukkan dengan benar pada konfigurasi lingkungan server.
- **Halaman Web Tidak Menampilkan Data**  
  Pastikan layanan server telah berjalan dan tidak mengalami kendala sebelum membuka antarmuka pengguna pada peramban.
- **Pesan Akses Ditolak**  
  Pastikan Anda masuk menggunakan akun yang memiliki tingkatan hak akses yang sesuai dengan halaman atau fungsi yang ingin dibuka. Jika sesi kedaluwarsa, lakukan proses masuk ulang ke dalam sistem.
