# FilmLog Backend (Movie Watchlist API)

REST API untuk platform watchlist dan review film, dibuat dengan Node.js, Express, dan SQLite.

## Prasyarat

- Node.js 18 atau lebih baru
- API key Gemini gratis dari https://aistudio.google.com

## Cara Menjalankan

1. Masuk ke folder backend dan pasang dependency:
   ```bash
   cd backend
   npm install
   ```

2. Buat file `.env` dari contoh, lalu isi nilainya:
   ```bash
   cp .env.example .env
   ```
   (Di PowerShell: `Copy-Item .env.example .env`)

   | Variabel | Fungsi |
   |---|---|
   | `JWT_SECRET` | Berfungsi sebagai kunci rahasia yang menandatangani dan menverifikasi token. Isi dengan teks acak yang panjang (minimal 32 karakter), misalnya hasil dari perintah node di bawah tabel ini. Sebaiknya jangan dibagikan.|
   | `GEMINI_API_KEY` | Kunci API yang didapatkan dari Google AI Studio (gratis) dan sebaiknya juga jangan sampai ter-commit atau tersebar |
   | `GEMINI_MODEL` | Nama model Gemini. Jika error 404, ganti sesuai daftar model di AI Studio |

     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

3. Isi database dengan 20 film awal (**cukup sekali**):
   ```bash
   npm run seed
   ```
   Untuk mengulang, hentikan server, hapus file `filmlog.db`, lalu jalankan seed lagi.

4. Jalankan server:
   ```bash
   npm run dev
   ```
   Server berjalan di `http://localhost:8000`.

5. (Opsional) Buka `frontend/index.html` di browser untuk mencoba lewat antarmuka.

## Desain Database (ERD)

```mermaid
erDiagram
    users ||--o{ watchlists : "menyimpan"
    movies ||--o{ watchlists : "disimpan di"
    users ||--o{ reviews : "menulis"
    movies ||--o{ reviews : "diulas di"
    movies ||--o{ movie_genres : "punya"
    genres ||--o{ movie_genres : "dipakai oleh"

    users {
        int id PK
        text username
        text email UK
        text password_hash
    }
    movies {
        int id PK
        text title
        int year
        text director
        real rating
        text duration
        text synopsis
        text poster_url
        text cast_members
    }
    genres {
        int id PK
        text name UK
    }
    movie_genres {
        int movie_id PK, FK
        int genre_id PK, FK
    }
    watchlists {
        int user_id PK, FK
        int movie_id PK, FK
    }
    reviews {
        int id PK
        int user_id FK
        int movie_id FK
        int rating
        text review
        text created_at
    }
```