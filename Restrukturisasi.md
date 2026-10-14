## 1. Rencana Restrukturisasi Folder Frontend

Bagian ini adalah rencana penataan kode frontend React + Vite. Tujuannya memisahkan konfigurasi aplikasi, komponen bersama, dan fitur berdasarkan domain agar file lebih mudah ditemukan dan dikembangkan. Rencana ini **belum memindahkan atau mengubah kode**; implementasikan bertahap dan pertahankan URL serta perilaku aplikasi yang sudah ada.

### 1.1 Prinsip Penataan

- Kelompokkan halaman dan kode yang hanya digunakan satu domain di dalam folder fitur terkait.
- Letakkan komponen yang dipakai lintas fitur di folder bersama (`shared`).
- Pertahankan pemisahan antara kerangka aplikasi, halaman, UI, dan akses data.
- Jangan mengubah nama route, aturan role/permission, atau kontrak API sebagai bagian dari pemindahan file.
- Pertahankan pemuatan halaman dengan `React.lazy` dan batas chunk route-level yang sudah ada.
- Pindahkan file sedikit demi sedikit, perbarui seluruh import terkait, lalu jalankan build sebelum melanjutkan.

### 1.2 Struktur Folder yang Diusulkan

```text
src/
├── app/
│   ├── App.jsx
│   ├── router/
│   │   └── Router.jsx
│   └── providers/
│       ├── ConfirmContext.jsx
│       └── ToastContext.jsx
├── assets/
│   └── logo/
│       └── tth-logo.png
├── features/
│   ├── admin/
│   │   ├── users/
│   │   │   └── UserManagement.jsx
│   │   ├── laboratories/
│   │   │   └── LabsManagement.jsx
│   │   ├── rooms/
│   │   │   └── RuanganManagement.jsx
│   │   ├── asset-groups/
│   │   │   └── AssetGroupManagement.jsx
│   │   └── categories/
│   │       └── CategoryManagement.jsx
│   ├── auth/
│   │   └── Login.jsx
│   ├── dashboard/
│   │   └── Dashboard.jsx
│   ├── equipment/
│   │   ├── EquipmentCreate.jsx
│   │   ├── EquipmentDetail.jsx
│   │   └── EquipmentList.jsx
│   ├── guest-equipment/
│   │   ├── GuestEquipmentPage.jsx
│   │   └── guest-equipment.css
│   ├── settings/
│   │   └── Settings.jsx
│   └── verification/
│       └── VerificationManagement.jsx
├── pages/
│   ├── Forbidden.jsx
│   ├── LandingPage.jsx
│   └── NotFound.jsx
├── shared/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Topbar.jsx
│   │   ├── ui/
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── TableFilters.jsx
│   │   │   └── Toast.jsx
│   │   ├── Captcha.jsx
│   │   ├── LogoSiKEPo.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── QRScannerModal.jsx
│   │   ├── TelkomTestHouseLogo.jsx
│   │   └── WaveBackground.jsx
│   ├── lib/
│   │   └── verificationPdf.js
│   ├── services/
│   │   └── api.js
│   └── utils/
│       └── permissions.js
├── styles/
│   ├── components.css
│   ├── landing-page.css
│   ├── layout.css
│   ├── login.css
│   └── index.css
└── main.jsx
```

File konfigurasi dan aset publik seperti `index.html`, `vite.config.js`, `.env.example`, `public/`, `package.json`, serta lockfile tetap berada di root frontend. Folder hasil build (`dist/`) dan dependensi (`node_modules/`) bukan bagian dari source yang direstrukturisasi.

### 1.3 Pemetaan dari Struktur Saat Ini

| Lokasi sekarang | Tujuan yang disarankan |
|---|---|
| `src/App.jsx` | `src/app/App.jsx` |
| `src/router/Router.jsx` | `src/app/router/Router.jsx` |
| `src/context/*.jsx` | `src/app/providers/` |
| `src/pages/equipment/*.jsx` | `src/features/equipment/` |
| `src/pages/guest/*` | `src/features/guest-equipment/` |
| `src/pages/admin/LabsManagement.jsx` | `src/features/admin/laboratories/` |
| `src/pages/admin/RuanganManagement.jsx` | `src/features/admin/rooms/` |
| `src/pages/admin/AssetGroupManagement.jsx` | `src/features/admin/asset-groups/` |
| `src/pages/admin/CategoryManagement.jsx` | `src/features/admin/categories/` |
| `src/pages/UserManagement.jsx` | `src/features/admin/users/` |
| `src/pages/VerificationManagement.jsx` | `src/features/verification/` |
| `src/pages/Dashboard.jsx` | `src/features/dashboard/` |
| `src/pages/Login.jsx` | `src/features/auth/` |
| `src/pages/Settings.jsx` | `src/features/settings/` |
| `src/pages/{LandingPage,Forbidden,NotFound}.jsx` | `src/pages/` |
| `src/components/**` | `src/shared/components/` (kelompokkan layout dan UI seperti pada struktur usulan) |
| `src/utils/api.js` | `src/shared/services/api.js` |
| `src/utils/permissions.js` | `src/shared/utils/permissions.js` |
| `src/utils/verificationPdf.js` | `src/shared/lib/verificationPdf.js` |
| `src/index.css` | `src/styles/index.css` |
| `src/styles/*.css` | `src/styles/` |
| `src/assets/**` | `src/assets/` |

### 1.4 Tahapan Pelaksanaan

1. **Inventarisasi dan baseline** — catat semua import, route, lazy import, serta pastikan `npm run build` berhasil sebelum pemindahan.
2. **Pindahkan shell aplikasi** — pindahkan `App.jsx`, router, dan providers; perbarui import di `main.jsx` dan seluruh konsumen.
3. **Pindahkan kode bersama** — kelompokkan layout, komponen UI, API, permission, utilitas PDF, dan style. Pastikan urutan import CSS dan tampilan tidak berubah.
4. **Pindahkan halaman per domain** — mulai dari equipment dan admin, lalu auth, dashboard, verification, settings, dan guest. Sesuaikan lazy import di `App.jsx` setelah setiap kelompok dipindahkan.
5. **Validasi dan rapikan** — jalankan `npm run build`, cek route publik dan terproteksi, alur login/role, halaman peralatan, verifikasi, scanner QR, serta tampilan desktop dan mobile. Hapus folder lama hanya setelah tidak ada referensi yang tersisa.

### 1.5 Kriteria Selesai

- Build produksi berhasil tanpa import yang tidak ditemukan.
- Semua route dan URL tetap sama, termasuk route dengan parameter dan route guest.
- Hak akses, navigasi, fallback loading, dan pemuatan lazy halaman tetap berjalan.
- Tidak ada file source yang tertinggal di lokasi lama setelah pemindahan domainnya selesai.
- README dan instruksi pengembangan telah menunjuk ke struktur yang baru.
