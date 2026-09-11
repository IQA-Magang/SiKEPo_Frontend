# Panduan Perbaikan Backend SiKEPo

Dokumen ini merangkum perbaikan yang diperlukan pada backend Go Fiber & GORM (`SiKEPo_Backend`) untuk mengatasi masalah yang ditemukan pada frontend.

---

## 1. Perbaikan AutoMigrate Database — `config/database.go`

### Masalah
Pada file `config/database.go`, AutoMigrate dibatasi dengan kondisi `if !hasUserTable || ...`. Jika 4 tabel awal (`users`, `ruangan`, `labs`, `peralatan`) sudah ada, eksekusi AutoMigrate dilewati seluruhnya (`AutoMigrate dilewati`). Akibatnya:
- Tabel `peminjaman`, `detail_peminjaman`, `verifikasi`, dan `hasil_verifikasi` **tidak pernah dibuat**.
- Setiap permintaan ke endpoint peminjaman atau verifikasi menghasilkan error **500 Internal Server Error** ("table doesn't exist").

### Solusi
Hapus blok pengecekan `Migrator().HasTable(...)` dan jalankan `AutoMigrate` secara langsung untuk semua entitas model:

```go
// config/database.go
func ConnectDatabase() {
    // ... [Koneksi DSN database] ...

    log.Println("Menjalankan AutoMigrate seluruh tabel...")
    err = database.AutoMigrate(
        &models.User{},
        &models.Ruangan{},
        &models.Labs{},
        &models.Peralatan{},
        &models.Peminjaman{},
        &models.DetailPeminjaman{},
        &models.Verifikasi{},
        &models.HasilVerifikasi{},
    )
    if err != nil {
        log.Fatalf("Gagal melakukan AutoMigrate: %v", err)
    }

    DB = database
    log.Println("Database connected & migrated successfully!")
}
```

---

## 2. Registrasi Rute Verifikasi (Fix HTTP 404) — `main.go`

### Masalah
File rute `routes/verifikasi_routes.go` sudah dibuat dengan endpoint:
- `GET /api/v1/verifikasi`
- `GET /api/v1/verifikasi/:id`
- `POST /api/v1/verifikasi`
- `PUT /api/v1/verifikasi/:id`

Namun pada `main.go`, rute verifikasi **belum didaftarkan** ke aplikasi Fiber. Akibatnya, request dari halaman Verifikasi menghasilkan **HTTP 404 Not Found**.

### Solusi
Pada `main.go`, inisialisasi repository & controller verifikasi, lalu daftarkan rutenya:

```go
// main.go
// 1. Inisialisasi Repository & Controller Verifikasi
verifikasiRepo := repositories.NewVerifikasiRepository(config.DB)
verifikasiController := controllers.NewVerifikasiController(verifikasiRepo)

// 2. Daftarkan Rute
routes.VerifikasiRoutes(app, verifikasiController)
```

---

## 3. Tambah Ruangan Baru (Foreign Key & Validasi) — `controllers/ruangan_controller.go`

### Masalah
Saat menambahkan ruangan baru, beberapa kasus menghasilkan error:
1. `labs_id` bernilai `null` atau `0` sementara foreign key database mengharuskan relasi ke tabel `labs`.
2. Duplikasi `nama_ruangan` atau `kode_ruangan`.

### Solusi
1. Di frontend, pemilihan `Laboratorium Induk` kini diwajibkan (`*`).
2. Di backend `Create` controller:
   - Validasi bahwa `labs_id` merujuk ke ID lab yang benar-benar ada di database sebelum insert.
   - Kembalikan pesan error yang ramah pengguna jika terjadi duplikasi `kode_ruangan` atau `nama_ruangan`.

---

## 4. Status Integrasi Fitur PIC & Kategori

| Fitur | Status di Backend | Catatan |
|---|---|---|
| **Penetapan PIC** | **Tersedia (Real)** | Menggunakan field `pic` (boolean) pada tabel `users`. Endpoint `PUT /api/v1/users/:id` sudah berfungsi. Di frontend, antarmuka penetapan PIC telah disatukan ke dalam tab **Manajemen Pengguna**. |
| **Kategori Peralatan** | **Enum/String di Peralatan** | Saat ini kategori tersimpan sebagai string pada kolom `kategori` tabel `peralatan`. Jika ingin dijadikan tabel master dinamis, perlu dibuat tabel `kategori_peralatan` dan relasi foreign key pada `peralatan`. Menu Kategori telah dipindahkan ke dalam kelompok **Manajemen Alat**. |

---

## Checklist Eksekusi Backend
- [ ] Ubah `config/database.go` agar memigrasikan semua model tanpa kondisi pengecekan tabel.
- [ ] Daftarkan `routes.VerifikasiRoutes(app, verifikasiController)` di `main.go`.
- [ ] Restart server backend Go: `go run .`
