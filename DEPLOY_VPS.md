# Panduan Deploy ke VPS menggunakan Docker

Berikut adalah langkah-langkah untuk melakukan deploy aplikasi **SETORWADER** (wa-blash) ke Virtual Private Server (VPS) menggunakan Docker dan Docker Compose.

## 1. Persiapan VPS
Pastikan VPS Anda (Ubuntu/Debian direkomendasikan) sudah terinstal Docker dan Docker Compose.

Update server dan install Docker:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose -y

# Jalankan docker dan aktifkan agar start saat boot
sudo systemctl enable docker
sudo systemctl start docker
```

## 2. Transfer File ke VPS
Upload seluruh folder project ini ke dalam VPS Anda (misalnya menggunakan `scp`, `rsync`, atau melalui `git clone` jika Anda menggunakan Github/Gitlab).

Contoh menggunakan git:
```bash
git clone <url-repo-anda> setorwader
cd setorwader
```

## 3. Konfigurasi Environment Variables (`.env`)
Salin file template `.env` dan sesuaikan nilainya:
```bash
cp .env.example .env
nano .env
```
_Penting:_ Ubah nilai password database dan `JWT_SECRET` untuk keamanan!

## 4. Build dan Jalankan Aplikasi
Jalankan perintah berikut di dalam direktori project yang terdapat file `docker-compose.yml`:

```bash
sudo docker-compose up -d --build
```
- Flag `-d` menjalankan container di belakang layar (detached mode).
- Flag `--build` memaksa Docker untuk mem-build ulang image dari `Dockerfile` (sangat berguna jika ada perubahan kode).

## 5. Cek Status Aplikasi
Untuk melihat apakah semua container berjalan normal:
```bash
sudo docker-compose ps
```
Anda akan melihat 3 services berjalan:
- `setorwader_mysql` (Database MySQL)
- `setorwader_backend` (Node.js API & Node Wa Baileys)
- `setorwader_frontend` (Nginx yang men-serve React)

## 6. Melihat Logs (Jika Ada Error)
Untuk melihat logs dari server backend (berguna untuk mengecek error koneksi WA dll):
```bash
sudo docker-compose logs -f backend
```
*(Gunakan `CTRL+C` untuk keluar dari logs)*

## 7. Update Jika Ada Perubahan Kode
Jika Anda melakukan perubahan pada kode dan mem-pull kembali di VPS, jalankan:
```bash
sudo docker-compose down
sudo docker-compose up -d --build
```

---

**Catatan mengenai WhatsApp Session:**
Sesi WhatsApp dan file uploads akan tersimpan dengan aman karena kita menggunakan Docker Volumes (`wa_sessions` dan `uploads_data`). Saat Anda melakukan restart atau deploy ulang, data sesi login WhatsApp tidak akan hilang.
