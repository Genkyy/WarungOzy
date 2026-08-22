# Desain.md — Panduan Desain UI KasirKu

## 0. Konteks Produk (dasar semua keputusan di bawah)

- **Subjek**: aplikasi kasir desktop untuk **satu warung kelontong**, dijalankan di **tablet**, dioperasikan langsung oleh **owner tanpa login**.
- **Pengguna**: pemilik warung, kemungkinan tidak terlalu melek teknologi, bekerja cepat di tengah pelanggan yang mengantre.
- **Satu tugas terpenting halaman utama (POS)**: dari barang di tangan pembeli sampai struk tercetak, secepat dan seminim-error mungkin. Kecepatan baca angka dan besar area sentuh lebih penting daripada keindahan visual murni.
- Ini adalah alat kerja (tool), bukan halaman promosi — kemewahan visual mockup referensi perlu disaring, hanya diambil yang menunjang kecepatan kerja.

---

## 1. Analisis Mockup Referensi (kasir.ai)

Mockup yang dikirim adalah UI **pemesanan makanan kafetaria**, bukan POS ritel kelontong. Berikut yang **diadopsi** dan yang **sengaja tidak dipakai**, beserta alasannya:

| Elemen di mockup | Keputusan | Alasan |
|---|---|---|
| Layout 2 panel: grid produk (kiri/tengah) + panel order tetap (kanan) | ✅ Diadopsi | Pola ini memang pola dasar POS yang benar — kasir perlu melihat keranjang tanpa pindah halaman. |
| Sidebar ikon di kiri | ✅ Diadopsi, disederhanakan | KasirKu cuma perlu 4 menu (Kasir, Stok, Laporan, Pengaturan) — tidak sebanyak menu kafetaria. |
| Foto besar & artistik tiap item makanan | ❌ Tidak dipakai apa adanya | Barang kelontong (sabun, minyak goreng, mie instan) tidak "menjual" lewat foto estetik seperti makanan. Diganti thumbnail kemasan kecil — fungsinya beda: bukan menggugah selera, tapi **mempercepat pengenalan visual kemasan** saat kasir mencari manual tanpa scan. |
| Kolom pencarian jadi elemen utama di header | ⚠️ Diturunkan prioritasnya | Input utama KasirKu adalah **scan barcode**, bukan ketik cari. Search tetap ada tapi jadi opsi kedua, bukan hero. |
| Badge "50% OFF" kuning-hitam | ✅ Diadopsi konsepnya | Dipakai ulang sebagai badge status stok (menipis/habis), bukan cuma diskon — bahasa visual "badge menempel di pojok kartu" itu berguna untuk KasirKu. |
| Avatar + nama user di header | ❌ Tidak dipakai | Tidak ada sistem login/user. |
| Tombol hijau besar "Confirm Order" di bawah panel | ✅ Diadopsi | Pola CTA utama tetap di panel kanan, sudah tepat secara ergonomi tablet (dekat ibu jari saat panel dipegang/disentuh). |
| Warna hijau sebagai accent | ✅ Diadopsi, hue diubah | Hijau cocok secara budaya (identik "toko/buka/uang" di Indonesia), tapi diganti ke hijau yang lebih dalam & khas — bukan hijau mint SaaS generik di mockup. |

**Kesimpulan**: struktur layout mockup ini kuat dan layak dipakai sebagai kerangka, tapi bahasa visualnya (foto besar, search-first) perlu diterjemahkan ulang ke konteks scan-first, data-dense, single-tablet.

---

## 2. Filosofi Desain

> **"Struk, bukan etalase."**

KasirKu tidak berjualan lewat layar — layar ini alat kerja harian. Referensi rasa visualnya bukan aplikasi food-delivery, tapi **nota/struk toko kelontong**: bersih, kontras tinggi, angka besar dan jujur, tidak banyak ornamen. Warna hijau dipakai secukupnya seperti tinta stempel toko, bukan gradient dekoratif.

Prinsip kerja:
1. **Angka adalah konten utama** — harga, stok, total harus jadi elemen paling menonjol di setiap layar, bukan judul atau ikon.
2. **Scan-first, tap-second** — semua alur dirancang berasumsi input datang dari scanner, UI sentuh adalah fallback yang tetap harus cepat.
3. **Area sentuh besar** — tablet dipegang/diletakkan miring di meja kasir, jari sering "meleset" saat buru-buru melayani pembeli.
4. **Tidak ada state tersembunyi yang penting** — owner bekerja sendirian tanpa tim IT; status (stok habis, transaksi belum tersimpan, dsb) harus terlihat langsung di layar, bukan perlu diklik dulu.

---

## 3. Design Tokens

### 3.1 Warna

| Token | Hex | Penggunaan |
|---|---|---|
| `bg-paper` | `#F5F6F2` | Latar utama — dasar warna "kertas nota", sedikit abu-hijau, bukan krem hangat generik |
| `surface` | `#FFFFFF` | Kartu produk, panel, modal |
| `primary` | `#1F8A5F` | Aksi utama (Bayar, Konfirmasi), state aktif, ikon nav terpilih |
| `primary-dark` | `#14563C` | Hover/pressed state tombol utama, header sidebar |
| `accent-amber` | `#E0A100` | Peringatan non-kritis: stok menipis, badge diskon |
| `danger` | `#C4432B` | Stok habis, void transaksi, hapus item, angka minus |
| `text-primary` | `#1C1F1B` | Teks utama, angka harga/total |
| `text-muted` | `#6B7268` | Label sekunder, keterangan kecil, placeholder |
| `border` | `#E4E6DF` | Garis pemisah tabel/kartu |

Kontras `text-primary` di atas `bg-paper` dan `surface` sengaja dijaga tinggi (>10:1) — layar tablet sering kena silau lampu warung atau matahari dari pintu depan.

### 3.2 Tipografi

| Peran | Font | Alasan |
|---|---|---|
| **Angka & harga** (display) | **Sora**, bold, tabular numbers | Geometris, angka lebar seragam — penting supaya kolom harga/stok rata dan cepat dipindai mata |
| **UI & label** (body) | **Plus Jakarta Sans**, regular/medium | Netral, sangat terbaca di ukuran kecil pada layar tablet |
| **Barcode/kode** (utility) | **JetBrains Mono** | Dipakai khusus untuk menampilkan string barcode, supaya digit mudah dicocokkan manual bila perlu |

Skala: Total belanja & harga satuan besar (28–40px), label UI 14–16px, keterangan/meta 12px. Jangan pernah menampilkan angka uang di bawah 14px.

### 3.3 Radius, Spacing, Shadow

- Radius kartu/tombol: **12px** — cukup lunak untuk kesan ramah sentuh tablet, tidak sebulat pill penuh (biar tetap terasa "alat kerja", bukan app konsumen kasual).
- Radius badge status (stok habis/menipis): **6px**, kotak lebih tegas — beda dari kartu, karena badge harus terbaca sebagai "peringatan", bukan dekorasi.
- Spacing dasar: kelipatan 8px. Padding minimum dalam area sentuh: 12px.
- Shadow sangat tipis (`0 1px 3px rgba(28,31,27,0.08)`) hanya untuk membedakan panel kasir dari latar — hindari shadow tebal/dekoratif.

---

## 4. Layout per Halaman

### 4.1 Kasir / POS (halaman utama)

```
┌──────┬────────────────────────────────────────┬───────────────────┐
│ NAV  │  [🔍 cari nama/kategori]  [📷 scan cam] │  KERANJANG (5)    │
│ ikon │                                          │  ─────────────    │
│      │  [Kategori: Semua][Sembako][Minuman]…   │  Aqua 600ml   x2  │
│ Kasir│                                          │  Rp 10.000    [🗑]│
│ Stok │  ┌────┐ ┌────┐ ┌────┐ ┌────┐             │  Indomie      x1  │
│ Lap. │  │thumb│ │thumb│ │thumb│ │thumb│         │  Rp 3.500     [🗑]│
│ Atur │  │Nama │ │Nama │ │Nama │ │Nama │         │  ...              │
│      │  │Rp xx│ │Rp xx│ │Rp xx│ │Rp xx│         │  ─────────────    │
│      │  │stok │ │stok │ │stok │ │stok │         │  Subtotal  Rp xxx │
│      │  └────┘ └────┘ └────┘ └────┘             │  Diskon   -Rp xxx │
│      │        (grid produk, scroll)             │  TOTAL    Rp xxxx │
│      │                                          │  ┌───────────────┐│
│      │                                          │  │   BAYAR    →  ││
│      │                                          │  └───────────────┘│
└──────┴────────────────────────────────────────┴───────────────────┘
```

- Input scan **selalu aktif** di latar belakang (global keydown listener sesuai PRD) — tidak perlu klik field apapun dulu.
- Panel keranjang di kanan **fixed**, tidak ikut scroll, tombol Bayar selalu terlihat tanpa scroll.
- Kartu produk menampilkan: thumbnail kecil, nama, harga, dan **badge stok** kalau menipis/habis (lihat 5.2).

### 4.2 Stok (Laporan Stok Barang)

- Kartu ringkasan (Total Produk / Stok Habis / Stok Menipis) tetap di atas, tapi jadi **filter cepat yang bisa diklik** — klik "Stok Menipis" langsung menyaring tabel di bawahnya.
- Tabel: kolom Masuk, Keluar, Sisa **sejajar**, bukan bertumpuk (perbaikan dari review sebelumnya).
- Tombol "Atur Stok" dipindah ke halaman produk, bukan di tabel laporan — halaman ini read-only murni.

### 4.3 Laporan & Ringkasan

- Kartu metrik utama: **Laba Kotor** dijadikan kartu pertama (paling menonjol), disusul Omzet, Total Transaksi, Rata-rata Struk.
- Grafik Top Produk & breakdown tetap dipakai, default periode mingguan (bukan harian) supaya data cukup bermakna.

### 4.4 Pengaturan

- Layout form sederhana satu kolom, grup per bagian (Info Toko, Pajak, Struk, Backup Data). Tombol simpan sticky di bawah form.

---

## 5. Komponen Kunci

### 5.1 Kartu Produk (grid POS)
- Thumbnail 64×64px (foto kemasan asli bila ada, fallback: blok warna kategori + inisial nama produk).
- Nama produk 2 baris max, dipotong dengan ellipsis.
- Harga dalam `Sora bold`, warna `text-primary`.
- Tap di kartu = langsung tambah 1 ke keranjang (bukan buka halaman detail) — sesuai prinsip kecepatan.

### 5.2 Badge Status Stok
| Kondisi | Warna | Label |
|---|---|---|
| Stok > 5 | tidak ada badge | — |
| Stok ≤ 5 | `accent-amber` | "Sisa X" |
| Stok = 0 | `danger`, kartu diberi opacity 60% & tidak bisa ditambah ke keranjang | "Habis" |

### 5.3 Baris Keranjang
- Nama, qty stepper (`-` `qty` `+`), subtotal baris, ikon hapus (`danger`).
- Item yang baru ditambah dari hasil **scan** mendapat highlight sesaat (lihat signature element di bawah).

### 5.4 Tombol
- Primary (Bayar/Konfirmasi/Simpan): `primary` fill, teks putih, radius 12px, tinggi minimum 48px (target sentuh tablet).
- Danger (Void/Hapus): outline `danger`, fill saat ditekan.
- Secondary: outline `border`, teks `text-primary`.

---

## 6. Signature Element — "Scan Pulse"

Karena input utama KasirKu adalah **scanner barcode**, bukan klik, elemen paling khas dari UI ini adalah umpan balik saat scan berhasil:

- Saat barcode terbaca, baris baru di keranjang muncul dengan **flash hijau tipis 200ms** lalu memudar ke warna normal (bukan animasi besar/playful — cukup untuk memastikan kasir yakin scan-nya kebaca tanpa perlu lihat layar terus-menerus).
- Kalau barcode **tidak ditemukan** di database, muncul toast merah singkat di atas panel keranjang: `"Barcode 8991xxxx tidak ditemukan"` — tanpa memblokir alur, kasir bisa lanjut cari manual.

Ini pengganti dari elemen "Ask AI" di mockup referensi (yang tidak relevan untuk konteks scan-driven kelontong) — signature KasirKu bukan asisten AI, tapi kepercayaan diri kasir terhadap alat scan-nya.

---

## 7. Standar Kualitas Minimum

- Semua target sentuh minimum **44×44px**.
- Kontras teks-latar minimum **4.5:1**, untuk angka harga/total diusahakan **>7:1** (dipakai di lingkungan cahaya tidak terkontrol).
- Semua state penting (stok habis, transaksi gagal, belum tersimpan) harus **terlihat tanpa interaksi tambahan** — tidak boleh disembunyikan di balik hover/klik, karena ini touchscreen.
- Animasi/transisi dibatasi maksimum 200ms, tidak ada animasi dekoratif yang memperlambat alur checkout.

---

## 8. Ringkasan Do / Don't

**Do**
- Angka besar, tegas, tabular.
- Warna hijau dipakai hemat — hanya untuk aksi utama & status positif.
- Semua alur bisa selesai tanpa menyentuh search bar sama sekali (scan-first).

**Don't**
- Jangan pakai foto besar bergaya "food photography" untuk produk kelontong biasa.
- Jangan taruh aksi penting di belakang menu tersembunyi/hover.
- Jangan pakai gradient atau shadow tebal dekoratif — ini alat kerja, bukan halaman promosi.