# Upload Tutor Pintar ke Vercel gratis

Paket ini berisi e-module termodinamika yang sudah diperbaiki, termasuk antarmuka responsif, intro, materi, video, eksperimen, pretest/posttest, serta backend Gemini. Tidak memerlukan Supabase atau database untuk menjalankan modul.

## 1. Ekstrak ZIP dan upload kode ke GitHub

1. Ekstrak `tutor-pintar-vercel.zip`.
2. Masuk ke [GitHub](https://github.com), buat repository baru di akun pribadi, misalnya `tutor-pintar`. Pilih **Private**.
3. Buka **Add file → Upload files** (atau **uploading an existing file** pada repository kosong).
4. Upload seluruh isi folder hasil ekstrak, bukan berkas ZIP. Di akar repository harus terlihat `vercel.json`, `package.json`, dan folder `api`, `lib`, `public`, `src`, `scripts`.
5. Klik **Commit changes**. Jangan upload `.env` dari versi lokal.

Struktur yang benar:

```text
api/
  tutor.js
  tutor/
    check.js
    status.js
lib/
  gemini.cjs
  handler.cjs
public/
  index.html
src/
  gemini-client.js
scripts/
  build.cjs
vercel.json
package.json
.env.example
.gitignore
.vercelignore
README.md
```

## 2. Import ke Vercel

1. Masuk ke [Vercel](https://vercel.com) memakai akun GitHub dan pilih akun/paket **Hobby**, bukan uji coba Pro.
2. Pilih **Add New → Project**, lalu import repository `tutor-pintar`.
3. Pilih **Framework Preset: Other**. Root Directory adalah folder yang berisi `vercel.json`. Jika Anda mengupload satu folder pembungkus ke GitHub, pilih folder itu sebagai Root Directory.
4. Konfigurasi sudah disediakan dalam `vercel.json`: build `npm run build`, output `public`, Node 22. Tidak perlu memasang paket tambahan. Biarkan konfigurasi file ini berlaku.
5. Sebelum menekan **Deploy**, isi Environment Variables berikut.

| Nama variabel | Nilai yang Anda masukkan |
| --- | --- |
| `GEMINI_API_KEY` | API key Google AI Studio Anda |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` atau model yang tersedia pada proyek Anda |
| `TUTOR_ACCESS_CODE` | Kode kelas buatan Anda, minimal 8 karakter; ini berbeda dari API key |

Isi key dan kode melalui form Environment Variables Vercel, bukan file HTML atau GitHub. Gunakan kode yang mudah Anda bagikan kepada siswa, bukan kata sandi akun Anda. Jangan menambahkan awalan `VITE_` atau `NEXT_PUBLIC_` ke variabel rahasia.

6. Klik **Deploy**. Vercel memberikan alamat HTTPS dengan subdomain `vercel.app`. Domain berbayar tidak diperlukan.

## 3. Coba tutor setelah deployment

1. Buka URL dari Vercel di Chrome/Edge pada laptop atau HP.
2. Buka **Tutor Pintar → Kode akses**, masukkan kode kelas Anda, lalu **Simpan kode**.
3. Tekan **Periksa status → Uji koneksi**. Uji koneksi mengirim satu permintaan singkat menggunakan kuota Gemini.
4. Ketik pertanyaan dan tekan **Kirim**. Bagikan URL dan kode kelas kepada siswa; API key tetap hanya di Vercel.

Materi, tes, eksperimen, dan tutor demo bisa dipakai tanpa kode kelas. Kode diperlukan untuk permintaan Gemini. Kode kelas disimpan pada sessionStorage tab, bukan sebagai API key. Pertanyaan dan riwayat topik aktif dikirim ke Google ketika Gemini digunakan; nama dan kelas tidak dikirim otomatis. Hasil belajar disimpan pada browser/perangkat masing-masing, belum terpusat sebagai database guru.

## Mengubah key, model, atau kode kelas

Buka proyek Vercel → **Settings → Environment Variables**, tambahkan/perbarui variabel. Pilih lingkungan **Production**; pilih **Preview** juga jika ingin menguji deployment pratinjau. Setelah perubahan, buka **Deployments**, pilih deployment terbaru, lalu **Redeploy**. Variabel baru berlaku pada deployment baru. Bila mengubah kode kelas, beri tahu siswa dan minta mereka mengganti kode di menu Tutor.

Untuk mengubah tampilan atau materi, edit `public/index.html`. Untuk mengubah antarmuka Gemini, edit `src/gemini-client.js`; build menyisipkan file itu ke HTML. Untuk mengubah instruksi AI, edit `lib/gemini.cjs`. Commit perubahan ke GitHub agar Vercel membangun deployment baru.

## Jika ada kendala

| Gejala | Perbaikan |
| --- | --- |
| Halaman 404 | Pastikan `public/index.html` ada dan Root Directory menunjuk folder berisi `vercel.json`. |
| Backend belum tersedia / endpoint 404 | Pastikan folder `api` ikut diupload. Upload HTML saja tidak menjalankan backend. |
| Key atau kode kelas belum diatur | Isi variabel di Vercel dan Redeploy. Menyimpan `.env` di laptop tidak mengatur Vercel. |
| Kode akses tidak sesuai | Ganti kode melalui menu Kode akses. Periksa nilai `TUTOR_ACCESS_CODE` pada deployment aktif. |
| Gemini menolak konfigurasi | Periksa key, izin proyek, dan pengaturan API di Google AI Studio. |
| Model tidak tersedia | Ubah `GEMINI_MODEL` sesuai model pada proyek AI Studio dan Redeploy. |
| Kuota tercapai | Tunggu atau periksa kuota Google. Tutor demo tetap dapat digunakan. |
| Tutor sedang ramai | Tunggu sebentar dan kirim kembali. |
| Siswa diminta login Vercel | Bagikan URL produksi proyek, bukan URL Preview yang dilindungi login. Periksa Deployment Protection untuk URL yang dibagikan. |

## Gratis dan batas penggunaan

Vercel Hobby gratis untuk proyek pribadi nonkomersial, dengan batas penggunaan; jika batas terlampaui layanan tertentu dapat ditunda. Hosting gratis tidak otomatis menjadikan semua penggunaan Gemini gratis. Kuota/billing Gemini mengikuti model dan proyek Google AI Studio Anda. Pilih paket Google yang sesuai dan periksa kuota sebelum pemakaian kelas.

Paket tidak memuat API key atau file `.env` asli. Backend hanya mengirim key ke Google melalui header autentikasi; tidak mengembalikannya ke browser. Backend memerlukan kode kelas untuk setiap permintaan AI dan menolak permintaan browser lintas domain. Pembatasan 30 permintaan/menit dan 3 permintaan bersamaan berlaku per instance fungsi, bukan kuota global; beberapa instance dapat aktif ketika hosting membesar. Kode kelas adalah akses bersama untuk kelas, bukan akun siswa individual.

## Alternatif tanpa GitHub

Jika terbiasa terminal dan sudah memasang Node.js, buka terminal di folder paket, jalankan `npx vercel`, login lalu hubungkan proyek. Setelah Environment Variables di dashboard siap, jalankan `npx vercel --prod`. Ini opsional; alur GitHub di atas tidak memerlukan terminal. Jangan menulis API key dalam argumen perintah atau code repository.

## Dokumentasi resmi

- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Konfigurasi build dan output](https://vercel.com/docs/builds/configure-a-build)
- [Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [API key Gemini](https://ai.google.dev/gemini-api/docs/api-key)
- [Model Gemini](https://ai.google.dev/gemini-api/docs/models)
- [Harga dan free tier Gemini](https://ai.google.dev/gemini-api/docs/pricing)

Kode dan alur browser diperiksa secara lokal dengan respons API tiruan. Deployment Vercel dan koneksi API asli perlu diuji setelah Anda import paket dan memasukkan key. Paket belum dipublikasikan dari chat ini.
