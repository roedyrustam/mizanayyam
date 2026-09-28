# Mizan Ayyam — Spesifikasi Arsitektur & Log Keputusan Pembaruan Waktu Shalat Real-Time

Dokumen ini disusun melalui protokol `/brainstorming` untuk memvalidasi pembaruan aplikasi **Mizan Ayyam** dari jadwal statis menjadi dinamis, akurat, dan adaptif berbasis lokasi.

---

## 1. Ringkasan Kebutuhan & Cakupan (Scope)
- **Tujuan Utama:** Mengintegrasikan waktu shalat astronomis riil (AlAdhan API) yang tersinkronisasi otomatis dengan posisi geografis pengguna (Browser Geolocation API) ke dalam antarmuka sirkadian Mizan Ayyam.
- **Batasan:** Tetap mempertahankan arsitektur *single-file* (HTML + Tailwind CSS + Vanilla JS), bebas dependensi kompilasi eksternal, hemat kuota internet (caching 24 jam), dan ramah offline.
- **Standar Fiqh:** Menggunakan metode hisab resmi Kementerian Agama Republik Indonesia (**Kemenag**, AlAdhan `method=20` dengan parameter sudut Subuh 20° dan Isya 18°).

---

## 2. Keputusan Arsitektur & Log Desain

| # | Domain / Masalah | Pilihan Desain | Rasional & Standar |
|---|---|---|---|
| 1 | **Metode Hisab** | AlAdhan `method=20` (Kemenag RI) | Sesuai ketetapan resmi Hisab Rukyat Kemenag RI untuk wilayah Nusantara. |
| 2 | **Fallback Lokasi** | Koordinat Kota Makassar (`lat: -5.1477, lng: 119.4327`) | Digunakan ketika GPS browser dinonaktifkan/ditolak pengguna atau terjadi timeout koneksi. |
| 3 | **Format Kartu Duha-Dzuhur** | Rentang Syuruq s.d. Ashar | Mengharmonisasikan slot aktivitas Duha dan shalat Dzuhur sesuai filosofi kurikulum harian Mizan Ayyam. |
| 4 | **Header Countdown** | Badge terpisah beraksen emerald neon | Memberikan visibilitas instan terhadap waktu shalat fardhu berikutnya tanpa memadati badge hari. |
| 5 | **Indikator Kartu Aktif** | Glowing border emerald + badge status denyut (*pulse*) | Memandu fokus pengguna secara visual pada slot tugas yang relevan dengan waktu biologis saat ini. |
| 6 | **Strategi Caching** | LocalStorage dengan key versioned & validitas 24 jam | Mencegah redundant network request, menjamin startup instan, dan mendukung fungsi offline. |

---

## 3. Alur Data & State Diagram

```
[Browser Startup]
       │
       ▼
[Periksa LocalStorage Cache (< 24 Jam & Hari Sama?)]
       ├── YA ────► [Pakai Data Cache] ──┐
       └── TIDAK ──► [Geolocation API]   │
                           │              │
                   (Success / Fallback)   │
                           │              │
                           ▼              ▼
                 [Fetch AlAdhan API]  [Render 5 Waktu & Aktifkan Timer]
                           │              │
                           ▼              ▼
                   [Simpan ke Cache]  [Update Tiap Detik: Countdown + Highlight]
```

---

## 4. Struktur Modul & Fungsi JavaScript

1. **`PrayerService`**:
   - `fetchTimings(lat, lng)`: Mengambil data dari AlAdhan atau cache lokal.
   - `getStoredCache()` & `saveCache(data)`: Penanganan kuota dan persistensi offline 24 jam.
2. **`LocationService`**:
   - `detectLocation()`: Meminta izin GPS browser dengan timeout 7 detik, fallback otomatis ke Makassar jika ditolak/gagal.
3. **`ScheduleManager`**:
   - `parseTimeToMinutes(hhmm)`: Konversi waktu ke menit untuk komparasi linear.
   - `getActiveSlot(timings, now)`: Menentukan slot mana di antara 5 waktu yang sedang berlangsung (termasuk penanganan lintas tengah malam pada slot Isya-Lail).
   - `getNextPrayer(timings, now)`: Menghitung waktu shalat berikutnya dan sisa durasi (jam, menit, detik).
4. **`UIController`**:
   - `renderHeaderLiveStats()`: Memperbarui badge lokasi, badge countdown, dan badge hari secara real-time.
   - `updateWaktuCardsWithTimings()`: Menyuntikkan jam riil dan kelas CSS glow ke kartu yang aktif.
