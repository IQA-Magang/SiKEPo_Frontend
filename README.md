# Panduan & Dokumentasi Sistem SiKEPo
## Sistem Informasi Manajemen Inventaris & Kelaikan Peralatan Laboratorium
### Telkom Test House (TTH)

---
>LINK UAT: https://docs.google.com/spreadsheets/d/1u_lhTPgeu1v1zg_AE8A51vEuSL6dXPRwAfQ4c6K_Q0s/edit?pli=1&gid=0#gid=0

>BUG REPORT : https://docs.google.com/spreadsheets/d/1QUUk6WC6CnAWe_wjUqPlzDBmprySkaFOPH5OqmWukh4/edit?gid=0#gid=0

>LINK WEBSITE : https://si-ke-po-frontend-delta.vercel.app/
---
| Role | Email | Password | Tujuan pengujian |
|---|---|---|---|
| Administrator | `admin@sikepo.local` | `password123` | Dashboard dan seluruh master data |
| Manajer | `manager@sikepo.local` | `password123` | Dashboard manajer dan notifikasi |
| Staff | `staff@sikepo.local` | `password123` | Akses operasional dan pembatasan role |
| energi | `ene@sikepo.local` | `password123` | Akses operasional dan pembatasan role |
| transmisi | `transmisi@sikepo.local` | `password123` | Akses operasional dan pembatasan role |

> Akun pada tabel di atas mengikuti seed backend. Jika environment memakai akun lain, catat kredensial aktual pada berita acara pengujian.
---
## 1. Tentang Aplikasi SiKEPo

SiKEPo adalah aplikasi berbasis web yang dirancang khusus untuk memodernisasi pengelolaan inventaris serta pengawasan kelaikan peralatan laboratorium di lingkungan Telkom Test House (TTH). 

Aplikasi ini menyatukan seluruh siklus hidup peralatan pengujian—mulai dari pencatatan identitas aset, penempatan ruangan dan laboratorium, pelacakan riwayat kalibrasi, pengunggahan dokumen teknis, pelabelan menggunakan kode respon cepat (QR Code), hingga proses birokrasi verifikasi kelaikan alat yang terintegrasi secara digital.

Dengan penerapan sistem ini, proses inspeksi berkala, peninjauan status alat, dan audit standar akreditasi laboratorium dapat dijalankan secara terpusat, transparan, cepat, dan tanpa penggunaan berkas fisik yang berceceran.

---

## 2. Hak Akses & Peran Pengguna

Aplikasi SiKEPo mengelompokkan hak penggunaan ke dalam beberapa tingkatan peran demi menjaga keamanan dan keabsahan data:

### Administrator
- Memiliki kendali penuh terhadap seluruh modul sistem.
- Berwenang mendaftarkan, memperbarui, dan menonaktifkan akun pengguna lain.
- Mengelola data master institusi: daftar laboratorium, data ruangan, kelompok aset, serta kategori peralatan.
- Memantau inventaris dan aktivitas operasional secara menyeluruh.

### Manager Laboratorium
- Menerima notifikasi pengajuan verifikasi peralatan baru dari staf atau penanggung jawab lab.
- Memeriksa dokumen kelengkapan, riwayat kalibrasi, dan kesesuaian fisik peralatan.
- Memberikan keputusan persetujuan akhir atau penolakan disertai catatan evaluasi.
- Menandatangani berkas verifikasi kelaikan secara digital di dalam sistem.

### Petugas / Penanggung Jawab Laboratorium (PIC)
- Mendaftarkan peralatan laboratorium baru ke dalam sistem.
- Melengkapi data spesifikasi, foto fisik alat, dan mengunggah dokumen pedoman serta sertifikat kalibrasi.
- Membuat draf pengajuan kelaikan peralatan berkala dan membubuhkan tanda tangan verifikasi awal.
- Mengunduh dan mencetak label QR Code untuk ditempelkan pada fisik peralatan.
- Menggunakan kamera ponsel atau laptop untuk memindai label QR alat di lapangan.

### Staff tanpa akses PIC
- Memiliki hak akses terbatas untuk melihat katalog peralatan laboratorium yang berstatus aktif tanpa izin mengubah data atau menyetujui dokumen.

---

## 3. Fitur-Fitur Utama Aplikasi

### A. Autentikasi dan Keamanan Pengguna
- **Gerbang Masuk Terproteksi**: Akses masuk hanya diperuntukkan bagi personel yang telah terdaftar dengan kombinasi alamat email dan kata sandi yang valid.
- **Verifikasi Anti-Bot**: Dilengkapi pemeriksaan keamanan visual untuk mencegah upaya akses otomatis atau serangan siber.
- **Manajemen Sesi Otomatis**: Apabila pengguna tidak beraktivitas dalam durasi waktu tertentu atau kredensial kedaluwarsa, sesi akan ditutup otomatis dan pengguna diarahkan kembali ke layar masuk.

### B. Dasbor Analitik & Informasi Ringkas
- **Ringkasan Inventaris**: Menampilkan kartu jumlah total peralatan, peralatan aktif yang siap digunakan, alat yang sedang dipinjam, alat dalam masa kalibrasi, alat berkondisi rusak, hingga alat yang dikarantina.
- **Peringatan Masa Uji**: Informasi dini mengenai peralatan yang mendekati batas waktu verifikasi kelaikan atau jadwal kalibrasi ulang.
- **Jalan Pintas Cepat**: Tombol navigasi instan untuk penambahan inventaris baru atau membuka pemindai kamera.

### C. Manajemen Data Peralatan Laboratorium
- **Pencarian Komprehensif**: Menemukan peralatan seketika berdasarkan nama alat, merk, tipe, nomor model, maupun nomor inventaris aset.
- **Penyaringan Fleksibel**: Menyaring daftar peralatan berdasarkan laboratorium pengampu, ruangan penempatan, kelompok aset, kategori peralatan, serta status operasionalnya.
- **Buku Detail Peralatan**: Menampilkan lembar informasi lengkap mengenai spesifikasi teknis, batas ketelitian, nama penanggung jawab, tanggal pengadaan, galeri foto alat, serta berkas sertifikat yang dapat diunduh langsung.

### D. Sistem Pelabelan & Pemindaian QR Code
- **Pembuatan Label Instan**: Setiap peralatan yang berhasil terdaftar secara otomatis memiliki tanda pengenal unik berupa gambar QR Code.
- **Cetak Label Fisik**: Lembar khusus berformat siap cetak dengan tata letak rapi berisi logo resmi, nomor aset, nama alat, dan kode identifikasi untuk ditempelkan pada fisik alat.
- **Pemindai Kamera Terintegrasi**: Pengguna dapat mengaktifkan kamera pada gawai (ponsel pintar, tablet, atau webcam laptop) untuk langsung membaca kode QR fisik alat tanpa membutuhkan aplikasi pihak ketiga.

### E. Alur Verifikasi Kelaikan Peralatan
- **Pencatatan Lembar Uji Kelaikan**: Form digital pengujian kelaikan fungsi alat yang mencakup kondisi fisik, fungsionalitas tombol, akurasi pembacaan, dan kelengkapan aksesoris.
- **Tanda Tangan Digital Langsung**: Formulir persetujuan menyediakan papan tanda tangan digital interaktif di layar gawai yang dapat digoreskan menggunakan jari, stylus pen, atau tetikus (mouse).
- **Penolakan Transparan**: Bila pengajuan ditolak oleh Manager, sistem mewajibkan pengisian alasan penolakan agar staf lab dapat segera melakukan perbaikan fisik alat atau melengkapi berkas yang kurang.

### F. Manajemen Master Data
- **Pengelolaan Laboratorium**: Pengaturan daftar laboratorium spesifik yang terdapat pada institusi pengujian.
- **Pengelolaan Ruangan**: Pemetaan ruangan kerja di setiap lab beserta penentuan penanggung jawab ruangan.
- **Pengelompokan Aset**: Standarisasi kelompok aset (Alat Ukur, Alat Bantu, Artefak Acuan, Komponen Pendukung).
- **Kategori Peralatan**: Klasifikasi detail tipe peralatan untuk mempermudah inventarisasi berkala.
- **Kelola Pengguna**: Penambahan staf baru, perubahan peran kerja, pengaturan ulang kata sandi, serta penonaktifan akun personel yang mutasi atau berhenti tugas.

---

## 4. Alur & Cara Berjalannya Aplikasi

Berikut adalah alur lengkap operasional aplikasi SiKEPo dari awal hingga akhir dalam skenario penggunaan nyata di laboratorium:

### Tahap 1: Masuk ke Sistem
1. Pengguna membuka alamat situs web aplikasi SiKEPo melalui peramban web (seperti Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari).
2. Di halaman masuk, masukkan alamat email dinas dan kata sandi yang telah didaftarkan oleh Administrator.
3. Berikan centang pada kotak validasi keamanan anti-bot.
4. Tekan tombol Masuk. Sistem akan memeriksa kredensial dan mengarahkan pengguna ke halaman Dasbor sesuai peran masing-masing.

### Tahap 2: Menavigasi Antarmuka
1. Menu di bilah samping kiri akan menyesuaikan secara otomatis berdasarkan hak akses akun.
2. Di bagian atas layar terdapat nama akun yang sedang aktif, lonceng pemberitahuan pesan, serta tombol pemindai cepat.
3. Pada tampilan ponsel pintar, menu bilah samping dapat disembunyikan dan dimunculkan kembali menggunakan tombol menu garis tiga di pojok kiri atas.

### Tahap 3: Pendaftaran Peralatan Baru (Tugas PIC)
1. Buka menu Inventaris Peralatan, lalu pilih Tambah Peralatan.
2. Isi formulir identitas alat: nama peralatan, nomor inventaris aset, merk dagang, tipe atau model, nomor seri pabrikan, dan tahun pengadaan.
3. Tentukan letak laboratorium, ruangan spesifik, kategori alat, serta tetapkan nama penanggung jawab alat tersebut.
4. Masukkan parameter teknis seperti rentang ukur, kapasitas kerja, dan interval kebutuhan kalibrasi.
5. Unggah foto fisik peralatan agar mempermudah pengenalan visual.
6. Unggah dokumen pendukung penting, misalnya buku petunjuk operasional atau sertifikat kalibrasi terakhir dalam format PDF.
7. Simpan data. Peralatan akan masuk ke dalam katalog inventaris dan sistem secara langsung menghasilkan identitas QR Code unik untuk alat bersangkutan.

### Tahap 4: Pencetakan & Penempelan Label QR Code
1. Pada daftar inventaris, cari peralatan yang telah didaftarkan, kemudian pilih opsi Lihat QR atau Cetak QR.
2. Halaman khusus cetak akan menampilkan kartu label standar institusi.
3. Pilih tombol Cetak untuk mengirimkan tampilan ke printer kertas stiker, atau gunakan opsi Unduh Gambar jika ingin menyimpannya terlebih dahulu.
4. Tempelkan stiker QR Code pada badan peralatan laboratorium di lokasi yang mudah terlihat dan aman dari gesekan.

### Tahap 5: Pengoperasian Pemindai Kamera di Lapangan
1. Saat teknisi atau petugas berada di laboratorium dan ingin mengecek kondisi alat tertentu, tekan tombol ikon Kamera Pemindai di bilah atas aplikasi.
2. Berikan izin akses kamera pada peramban gawai bila muncul permintaan konfirmasi.
3. Arahkan lensa kamera gawai ke stiker QR Code yang terpasang pada fisik alat.
4. Sistem membaca kode secara instan dan langsung membuka lembar detail informasi peralatan tersebut di layar tanpa perlu mengetikkan nomor aset secara manual.

### Tahap 6: Siklus Verifikasi Kelaikan Alat (Rutin & Berkala)
Siklus verifikasi kelaikan merupakan inti dari penjaminan mutu laboratorium di Telkom Test House. Proses ini berjalan melalui empat fase:

1. **Pembuatan Draf Pengajuan**:
   - Staf penanggung jawab membuka detail peralatan, lalu memilih menu Pengajuan Verifikasi Kelaikan.
   - Periksa kondisi fisik, catat tanggal pelaksanaan pemeriksaan, periksa keabsahan kalibrasi, dan tentukan rekomendasi kelaikan (Laik Pakai, Karantina, atau Perlu Perbaikan).
   - Simpan sebagai Draf apabila berkas masih perlu diperiksa ulang, atau lanjutkan ke tahap tanda tangan.

2. **Tanda Tangan Digital Petugas (PIC)**:
   - Pada lembar pengajuan, petugas membubuhkan tanda tangan digital pada kotak tanda tangan yang tersedia di layar.
   - Setelah tanda tangan dibubuhkan, ajukan berkas verifikasi. Status pengajuan otomatis berubah menjadi Menunggu Peninjauan / Diajukan.
   - Sistem secara otomatis mengirimkan notifikasi kepada akun Manager Laboratorium terkait.

3. **Peninjauan oleh Manager Laboratorium**:
   - Manager membuka menu Verifikasi Kelaikan atau mengklik lonceng notifikasi pengajuan baru.
   - Manager menelaah rincian pengujian, memeriksa kelengkapan dokumen kalibrasi yang dilampirkan, serta mengkaji catatan rekomendasi dari staf lab.

4. **Keputusan Akhir Manager**:
   - **Bila Disetujui**: Manager membubuhkan tanda tangan digital persetujuan dan menekan tombol Setujui. Status verifikasi berubah menjadi Disetujui, dan status peralatan di katalog inventaris otomatis diperbarui menjadi Aktif Laik Pakai.
   - **Bila Ditolak**: Manager menekan tombol Tolak, kemudian mengetikkan alasan penolakan secara rinci (misalnya sertifikat kalibrasi sudah kedaluwarsa atau foto fisik belum jelas). Status berubah menjadi Ditolak dan berkas dikembalikan ke staf untuk diperbaiki.

### Tahap 7: Pengelolaan Pengguna & Master Data (Tugas Administrator)
1. **Pembaruan Laboratorium & Ruangan**:
   - Jika terdapat penambahan fasilitas baru di Telkom Test House, Administrator membuka menu Laboratorium atau Ruangan untuk menambah lokasi baru serta menetapkan penanggung jawabnya.
2. **Pengelolaan Personel**:
   - Ketika ada staf baru atau pergantian posisi manajer, Administrator masuk ke menu Manajemen Pengguna untuk membuatkan akun baru dengan menetapkan nama lengkap, alamat email, serta peran yang sesuai.
3. **Pengaturan Akun Mandiri**:
   - Setiap pengguna yang telah masuk dapat membuka menu Pengaturan Profil di pojok kanan atas untuk memperbarui nama tampilan, nomor kontak, serta mengubah kata sandi akun secara berkala demi keamanan.

---

## 5. Keunggulan Operasional Aplikasi

- **Kemudahan Akses**: Berjalan sepenuhnya pada peramban web modern tanpa kewajiban mengunduh aplikasi tambahan melalui toko aplikasi.
- **Dukungan Lintas Gawai**: Tata letak layar beradaptasi secara otomatis saat dibuka di monitor komputer kerja, laptop, tablet pengujian, maupun telepon genggam teknisi di lapangan.
- **Bebas Kertas (Paperless)**: Menghapus kebutuhan formulir cetak dan buku log fisik berkat pengarsipan berkas terpusat dan tanda tangan digital.
- **Kesiapan Audit ISO/IEC 17025**: Seluruh riwayat pengajuan, tanggal verifikasi, pencatat peninjauan, hingga persetujuan manajer tersimpan rapi dalam log riwayat yang tidak dapat dimanipulasi, siap disajikan kapan pun audit akreditasi berlangsung.
- **Kecepatan Identifikasi Lapangan**: Penggunaan stiker QR Code mempercepat proses inventarisasi dan inspeksi hingga hitungan detik per peralatan.

---

## 6. Hak Cipta & Kepemilikan
Dokumen dan sistem aplikasi ini merupakan aset resmi **Telkom Test House (TTH)**. Hak cipta dilindungi undang-undang.
