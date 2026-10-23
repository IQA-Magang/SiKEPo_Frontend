# Warna di Website SiKEPos

Daftar ini menjelaskan warna yang terlihat di setiap halaman. Kode warna ditulis dalam format HEX, misalnya `#EE2E24`.

## Warna yang dipakai di halaman setelah login

Halaman dashboard, peralatan, verifikasi, jadwal, admin, dan pengaturan memakai tampilan dasar yang sama.

- Bagian atas website (header) — merah gradasi — `#E30613` ke `#B8000A`
- Latar halaman — abu-abu muda — `#F4F5F8`
- Menu samping, kartu, dan tabel — putih — `#FFFFFF`
- Tombol utama dan menu yang dipilih — merah — `#C92B21` atau `#EE2E24`
- Tombol utama saat ditekan/aktif — merah tua — `#991B1B`
- Teks utama — biru tua kehitaman — `#0F172A`, `#111111`, atau `#1E293B`
- Teks penjelas — abu-abu — `#475569`, `#64748B`, atau `#6B7280`
- Garis tabel dan kotak — abu-abu muda — `#E2E8F0` atau `#E5E7EB`
- Latar bagian yang tidak aktif — abu-abu sangat muda — `#F1F5F9`, `#F3F4F6`, atau `#F9FAFB`
- Tombol header dan pencarian — putih transparan di atas latar merah

## Halaman publik dan login

### Halaman depan (`/`)

- Latar halaman — gradasi putih kebiruan — `#F8FAFC` ke `#EDF3FF`
- Judul dan teks utama — biru tua — `#0F172A`
- Teks penjelas — abu-abu kebiruan — `#475569`
- Tombol utama dan bagian judul beraksen — gradasi merah — `#EE2E24` ke `#C81E1E`
- Tombol kedua — putih — `#FFFFFF`
- Tombol QR — putih dengan tulisan merah tua — `#991B1B`
- Penanda berhasil — hijau — `#22C55E` atau `#16A34A`
- Penanda error — merah — `#EF4444` atau `#FCA5A5`

### Halaman masuk (`/login`)

- Latar halaman — abu-abu sangat muda — `#F8F8F8`
- Kotak login dan kolom isian — putih — `#FFFFFF`
- Tombol dan garis kolom isian — merah — `#E30613`
- Kolom isian saat dipilih — merah tua — `#B8000A`
- Kolom isian yang salah dan pesan error — merah — `#DC2626`
- Latar kolom isian yang salah — merah muda — `#FEF2F2`
- Teks utama — hampir hitam — `#111111` atau `#111827`
- Teks tambahan — abu-abu — `#374151`, `#4B5563`, atau `#6B7280`
- Garis pemisah — abu-abu muda — `#E5E7EB`

### Halaman informasi alat untuk tamu (`/guest/peralatan/:nomor_aset`)

Halaman ini memakai warna hijau keabu-abuan yang berbeda dari halaman setelah login.

- Latar halaman — hijau keabu-abuan sangat muda — `#F2F6F4`
- Kartu dan tombol — putih — `#FFFFFF`
- Judul — biru kehijauan gelap — `#13242C` atau `#17252D`
- Teks tambahan — abu-abu kehijauan — `#61716F`, `#64737A`, atau `#647672`
- Garis dan pembatas — hijau keabu-abuan muda — `#D7E0DD`, `#DCE5E2`, atau `#E3EAE7`
- Tombol/aksen utama — merah — `#CF3428`
- Label kecil — merah tua — `#A32B22`
- Penanda dan aksen hijau — `#1D6849`, `#278253`, atau `#287452`
- Latar hijau sangat muda — `#C8E2D4`, `#D9E3DE`, `#E7EEEB`, `#EAF0ED`, atau `#EAF6EF`
- Warna dekorasi merah tambahan — `#BD3026` atau `#D65A4F`

## Halaman utama setelah login

Semua halaman di bagian ini menggunakan warna dasar setelah login yang dijelaskan di atas. Warna status digunakan pada label, ikon, dan pemberitahuan.

### Dashboard (`/dashboard`)

- Kartu ringkasan — putih — `#FFFFFF`
- Angka atau tanda berhasil — hijau — `#22C55E`
- Angka atau tanda peringatan — oranye — `#F59E0B`
- Angka atau tanda error — merah — `#EF4444`
- Angka atau tanda informasi — biru — `#3B82F6`

### Daftar, tambah, dan detail peralatan

Halaman: `/peralatan`, `/peralatan/tambah`, `/peralatan/detail/:id`, dan `/peralatan/qr/:id`.

- Formulir, kartu informasi, dan tabel — putih — `#FFFFFF`
- Nama dan informasi utama — biru tua — `#0F172A` atau `#1E293B`
- Informasi tambahan — abu-abu — `#64748B` atau `#94A3B8`
- Nomor aset — latar abu-abu muda — `#F1F5F9`
- Garis tabel dan form — abu-abu muda — `#E2E8F0` atau `#E5E7EB`

### Daftar alat menunggu verifikasi dan dalam peninjauan

Halaman: `/peralatan/menunggu-verifikasi` dan `/peralatan/dalam-peninjauan`.

- Tabel dan kartu — putih — `#FFFFFF`
- Status menunggu atau peringatan — oranye — `#F59E0B` atau `#D97706`
- Latar status peringatan — kuning muda — `#FEF3C7` atau `#FFFBEB`
- Status peninjauan — biru — `#3B82F6` atau `#1D4ED8`
- Latar status peninjauan — biru muda — `#DBEAFE` atau `#EFF6FF`
- Teks dan garis — memakai warna dasar setelah login

### Pengajuan peminjaman (`/peminjaman`)

- Latar halaman dan teks — memakai warna dasar setelah login
- Catatan bahwa halaman belum tersedia — abu-abu — `#475569` atau `#6B7280`

### Verifikasi alat

Halaman: `/verifikasi` dan `/verifikasi/:id`.

- Kartu, formulir, dan tabel — putih — `#FFFFFF`
- Tanda lulus atau tindak lanjut selesai — hijau — `#15803D`
- Latar tanda berhasil — hijau muda — `#F0FDF4` atau `#DCFCE7`
- Tanda menunggu — oranye — `#B45309`
- Tanda gagal atau perlu perbaikan — merah — `#B91C1C` atau `#EF4444`
- Latar tanda merah — merah muda — `#FFF1F2`, `#FECDD3`, atau `#FEE2E2`
- Informasi atau tautan — biru — `#3B82F6` atau `#4F46E5`
- Latar informasi — biru muda — `#E0E7FF` atau `#DBEAFE`
- Teks tambahan dan garis — abu-abu — `#64748B` atau `#E2E8F0`

### Jadwal pemeriksaan berkala (`/penjadwalan`)

- Kartu, tabel, dan formulir — putih — `#FFFFFF`
- Jadwal aman atau selesai — hijau — `#15803D`
- Latar jadwal aman — hijau muda — `#ECFDF3`
- Jadwal terlambat atau perlu tindakan — merah — `#DC2626` atau `#B91C1C`
- Latar jadwal terlambat — merah muda — `#FEE2E2` atau `#FEF2F2`
- Jadwal yang akan datang — oranye — `#92400E` atau `#C2410C`
- Latar jadwal yang akan datang — kuning/oranye muda — `#FEF3C7`, `#FEF9C3`, atau `#FFEDD5`
- Informasi pemeriksaan — biru — `#0369A1` atau `#1D4ED8`
- Latar informasi — biru muda — `#DBEAFE` atau `#E0F2FE`
- Garis dan teks tambahan — abu-abu — `#D1D5DB`, `#9CA3AF`, `#4B5563`, atau `#374151`
- Penanda grafik — merah `#DC2626` dan biru `#1D4ED8`

### Pengelolaan pengguna, laboratorium, ruangan, dan kelompok aset

Halaman: `/admin/users`, `/admin/labs`, `/admin/ruangan`, dan `/admin/kelompok-aset`.

- Formulir, tabel, dan kartu — putih — `#FFFFFF`
- Tombol utama — merah — `#EE2E24` atau `#C92B21`
- Teks utama — biru tua — `#0F172A`
- Teks tambahan — abu-abu — `#475569` atau `#6B7280`
- Latar kolom dan bagian nonaktif — abu-abu muda — `#F3F4F6` atau `#F9FAFB`
- Garis tabel dan formulir — abu-abu muda — `#E2E8F0` atau `#E5E7EB`
- Label berhasil, peringatan, error, dan informasi — memakai warna status yang dijelaskan di bagian Dashboard

### Pengelolaan kategori (`/admin/kategori`)

Setiap kategori alat memiliki warna pembeda:

- Alat utama — merah — teks `#EE2E24`, latar `#FEF2F2`, garis `#FCA5A5`
- Alat pendukung — biru — teks `#2563EB`, latar `#EFF6FF`, garis `#BFDBFE`
- Standar acuan — hijau — teks `#059669`, latar `#ECFDF5`, garis `#A7F3D0`
- Material operasional — oranye — teks `#D97706`, latar `#FFFBEB`, garis `#FDE68A`
- Kartu yang tidak dipilih — putih — `#FFFFFF`
- Teks dan garis kartu — biru tua/abu-abu — `#1E293B`, `#475569`, atau `#CBD5E1`

### Pengaturan (`/settings`)

- Latar halaman, kartu, dan formulir — memakai warna dasar setelah login
- Tombol atau bagian pengaturan yang beraksen — merah — `#E30613` atau `#B8000A`
- Pesan status — memakai warna berhasil, peringatan, error, atau informasi yang dijelaskan di bagian Dashboard

## Halaman kesalahan

### Akses ditolak (`/unauthorized`)

- Ikon peringatan — oranye — `#D97706`
- Latar ikon peringatan — kuning muda — `#FEF3C7`
- Label peringatan — menggunakan warna oranye dan kuning
- Kartu, teks, serta tombol — memakai warna dasar setelah login

### Halaman tidak ditemukan (alamat lain)

- Ikon bantuan — merah — `#E30613`
- Latar ikon — merah muda — `#FEF2F2`
- Label error — merah — `#EF4444` atau `#DC2626`
- Kartu, teks, serta tombol — memakai warna dasar setelah login

## Arti warna status

- Hijau — berhasil, aktif, atau aman — `#22C55E`, `#15803D`, latar `#DCFCE7`
- Oranye — peringatan, menunggu, atau dipinjam — `#F59E0B`, `#D97706`, latar `#FEF3C7`
- Merah — error, rusak, atau terlambat — `#EF4444`, `#DC2626`, latar `#FEE2E2`
- Biru — informasi atau kalibrasi — `#3B82F6`, `#1D4ED8`, latar `#DBEAFE`
- Abu-abu — nonaktif atau dihapuskan — `#94A3B8`, latar `#F1F5F9`

Warna dengan transparansi dipakai untuk bayangan, lapisan penutup, dan efek saat tombol dipilih. Tampilan akhirnya bisa tampak lebih muda atau lebih gelap karena warna di belakangnya.


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

## 7. Struktur Source Frontend

Kode aplikasi berada di `src/` dan dikelompokkan berdasarkan tanggung jawab:

- `src/app/` berisi shell aplikasi, router, dan providers.
- `src/features/` berisi halaman dan kode khusus domain seperti autentikasi, peralatan, dashboard, verifikasi, pengaturan, dan administrasi.
- `src/pages/` berisi halaman umum seperti landing, forbidden, dan not found.
- `src/shared/` berisi komponen bersama, layanan API, permission, dan utilitas PDF.
- `src/assets/` menyimpan aset source; `src/styles/` menyimpan stylesheet global.
- `src/main.jsx` adalah entry point React.

Pertahankan URL route dan pemuatan halaman berbasis `React.lazy` saat mengembangkan atau memindahkan kode. Jalankan `npm run build` dari folder frontend untuk memeriksa build produksi.

---