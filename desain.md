# Desain.md — Acuan UI KasirKu

Dokumen ini adalah acuan desain untuk aplikasi KasirKu (POS warung kelontong tunggal). Tujuannya: memastikan UI terasa dibuat dengan niat untuk warung sungguhan, bukan template generic yang di-generate massal.

---

## 1. Prinsip Desain

1. **Jujur, bukan generic.** Lebih baik tampilan sederhana yang jujur (icon polos, warna solid) daripada foto/elemen yang terlihat "AI generic" tapi salah konteks.
2. **Cepat dibaca saat sibuk.** Kasir dipakai sambil melayani pembeli antre — kontras tinggi, target tap besar, informasi penting (harga, stok habis) harus kebaca dalam <1 detik.
3. **Terasa milik warung ini.** Bukan dashboard SaaS generic. Warna, nama toko, dan detail kecil (satuan produk, kategori lokal) harus menonjol sebagai identitas.
4. **Konsisten, bukan seragam kaku.** Card boleh punya treatment berbeda sesuai state (habis, stok menipis, promo) — jangan semua terlihat identik.

---

## 2. Palet Warna

Hindari kombinasi navy-gelap + cyan-terang (terlalu umum dipakai template AI/SaaS generic). Gunakan palet yang lebih grounded dan hangat, cocok untuk konteks retail Indonesia.

### Mode Terang (default, direkomendasikan untuk kasir siang hari)
| Peran | Warna | Hex (contoh) |
|---|---|---|
| Background utama | Off-white hangat | `#FAF7F2` |
| Background card | Putih | `#FFFFFF` |
| Border/divider | Abu hangat tipis | `#E8E2D8` |
| Teks utama | Charcoal | `#2A2622` |
| Teks sekunder | Abu coklat | `#8A8175` |
| Aksen utama | Oranye/amber (bukan cyan) | `#D97706` atau `#C2410C` |
| Sukses/stok aman | Hijau zaitun | `#3F7D4F` |
| Peringatan/stok menipis | Kuning mustard | `#D4A017` |
| Bahaya/habis | Merah bata | `#B84B3E` |

### Mode Gelap (opsional, untuk warung yang buka malam)
| Peran | Warna | Hex (contoh) |
|---|---|---|
| Background utama | Coklat-charcoal gelap (bukan navy) | `#1E1B18` |
| Background card | `#2A2521` |
| Aksen utama | Amber tetap sama, sedikit lebih terang | `#F59E0B` |

**Aturan:** hanya satu warna aksen (amber/oranye) yang dipakai secara konsisten untuk elemen interaktif (tombol utama, tab aktif, harga). Jangan campur cyan + hijau + biru sekaligus seperti di versi sekarang.

---

## 3. Tipografi

- Gunakan satu font family dengan karakter, bukan default system-ui polos. Rekomendasi: **Inter** atau **Plus Jakarta Sans** (gratis, mendukung Rupiah/angka dengan baik, terasa modern tapi tidak generic-SaaS).
- Hierarki jelas:
  - Nama produk: 16px, semi-bold
  - Harga: 18px, bold, warna aksen
  - Satuan (/Botol, /Kg): 12px, teks sekunder, jangan bold
  - Label kategori/tab: 14px, medium
- Angka harga selalu format Rupiah konsisten: `Rp 3.500` (titik ribuan, tanpa desimal ,00).

---

## 4. Foto & Ikon Produk — ATURAN PALING PENTING

Ini yang paling merusak kesan aplikasi saat ini (foto iPhone untuk pulsa, foto bunga untuk rokok, foto gummy bear untuk Kopiko).

**Wajib:**
- Setiap produk **harus** pakai salah satu dari dua opsi berikut, tidak ada opsi ketiga:
  1. **Foto asli produk** — difoto sendiri, background polos (putih/abu muda), pencahayaan konsisten, rasio 1:1.
  2. **Icon kategori generik yang jujur** — kalau foto belum ada, pakai icon sederhana (mis. icon mie untuk makanan instan, icon botol untuk minuman) di atas warna solid sesuai kategori. Jangan pernah pakai foto stok yang "kelihatan mirip" tapi salah produk.
- Background foto produk: seragam (disarankan putih polos) supaya grid terlihat rapi, bukan campur-campur foto dengan gaya berbeda.
- Ukuran & crop foto konsisten di semua card (rasio 1:1, produk di tengah, tidak terpotong).

**Dilarang:**
- Foto stok/generic dari internet yang tidak menampilkan produk aslinya.
- Foto dengan gaya lifestyle/editorial (tangan pegang laptop, orang minum, dsb) untuk produk fisik seperti pulsa atau rokok.

---

## 5. Komponen

### Card Produk
- Foto (1:1) di atas, nama produk, harga, satuan.
- Badge stok (jumlah/status) diletakkan di pojok kanan atas foto, dengan **background solid + padding cukup**, jangan menumpuk dengan teks lain (bug saat ini: badge "16 Botol" ketutup teks "Botol" di kartu Aqua).
- **State habis stok:** foto di-grayscale + overlay gelap transparan + label "HABIS" di tengah foto (bukan cuma teks abu-abu kecil di badge).
- **State stok menipis** (misal <5): badge warna kuning mustard, bukan hijau.
- **State stok normal:** badge warna hijau zaitun, teks putih, tidak mencolok berlebihan.

### Tombol Utama ("Bayar Sekarang")
- Warna aksen solid (amber/oranye), teks putih, bold.
- Hindari efek gradient mengambang generic — flat color dengan sedikit shadow saja lebih clean dan terasa "product", bukan "AI landing page".

### Sidebar Navigasi
- Icon custom bergaya konsisten (outline, ketebalan sama) — bukan campuran icon library berbeda gaya.
- Item aktif: background aksen soft (amber muda), bukan cuma teks biru terang di atas gelap.

### Tab Kategori
- Tab aktif: background solid aksen + teks putih.
- Badge jumlah item di tab: kontras jelas, ukuran kecil, di kanan atas label.

### Header/Search Bar
- Search bar dengan border jelas (bukan sekadar field gelap tanpa batas), placeholder text jelas dalam Bahasa Indonesia natural: "Cari produk atau scan barcode..."
- Status koneksi (Scanner Ready, Printer Ready) — pakai icon + dot indikator warna hijau/merah, teks singkat, jangan berlebihan menonjol karena ini info sekunder.

---

## 6. Identitas Warung

- Nama warung ("Warung Ozy") tampil jelas di pojok kiri atas dengan logo/icon toko sederhana — bukan generic shopping-cart icon default.
- Kalau owner punya elemen brand sendiri (warna khas, logo custom), utamakan itu dibanding palet default di atas.
- Pertimbangkan menambahkan foto warung asli sebagai background halaman login/splash (jika ada), memperkuat kesan "ini toko sungguhan".

---

## 7. Checklist Sebelum Anggap Satu Halaman "Selesai"

- [ ] Semua foto produk = foto asli atau icon kategori jujur (tidak ada stock photo asal comot)
- [ ] Tidak ada badge/teks yang tertumpuk/terpotong
- [ ] Hanya 1 warna aksen dipakai konsisten di seluruh halaman
- [ ] State habis stok terlihat jelas beda dari state normal (bukan cuma teks pudar)
- [ ] Font sama di seluruh aplikasi, hierarki ukuran jelas
- [ ] Format Rupiah konsisten (`Rp 3.500`, titik ribuan)
- [ ] Tidak ada elemen dekoratif tanpa fungsi (gradient/shadow berlebihan ala landing page AI)