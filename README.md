# EduSoal AI — React + Vite Assessment Studio

Aplikasi penyusun soal, stimulus kontekstual otomatis (Gemini AI), kisi-kisi ujian (`Test Matrix`), dan rubrik penilaian terstruktur berbasis **React 19 + Vite + TypeScript + Tailwind CSS v4**, siap di-deploy ke **Vercel**.

## Struktur Proyek

- `index.html` — Entry point HTML root standar Vite (Google Fonts: Manrope, Hanken Grotesk, JetBrains Mono).
- `package.json` — Konfigurasi dependensi & skrip (`build`, `dev`, `preview`, `lint`, `test`).
- `vite.config.ts` — Konfigurasi React + Tailwind CSS Vite.
- `vercel.json` — Konfigurasi deployment Vercel (`framework: "vite"`, `outputDirectory: "dist"`, batas durasi serverless `api/**/*.ts`, serta SPA fallback rewrites).
- `src/` — Seluruh antarmuka frontend React (`ItemStudioScreen`, `GeneratorScreen`, `TestMatrixScreen`, `RubricsScreen`, komponen stimulus tabel & grafik SVG, serta state persistence).
- `api/` — **Vercel Serverless Functions** untuk memanggil Gemini API secara aman di sisi server:
  - `api/health.ts` (`GET /api/health`)
  - `api/stimulus/generate.ts` (`POST /api/stimulus/generate`)
  - `api/questions/generate.ts` (`POST /api/questions/generate`)
  - `api/questions/refine.ts` (`POST /api/questions/refine`)
- `server/geminiService.ts` — Logika bersama pemanggilan `@google/genai` (`gemini-4-hydrogen`) yang digunakan oleh `api/` (Vercel) dan `server.ts` (Express lokal).
- `server.ts` — Server Express + Vite middleware untuk menjalankan frontend dan endpoint `/api/*` secara lokal di port `3000`.

## Menjalankan Secara Lokal

1. Instal dependensi:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env` lalu isi `GEMINI_API_KEY`:
   ```bash
   cp .env.example .env
   ```
3. Jalankan aplikasi (frontend + endpoint `/api/*` di `http://localhost:3000`):
   ```bash
   npm run dev
   ```
4. Verifikasi unit test & build produksi:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

## Deploy ke Vercel

### Opsi 1: Melalui GitHub / Dashboard Vercel
1. Push seluruh isi folder proyek ini ke repositori GitHub Anda (`package.json`, `index.html`, dan `vercel.json` berada di root folder).
2. Buka [Vercel Dashboard](https://vercel.com/new) dan klik **Import Project** pada repositori tersebut.
3. Vercel otomatis mendeteksi preset **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Masuk ke **Settings > Environment Variables**, tambahkan:
   - `GEMINI_API_KEY` = *(API key Gemini Anda)*
5. Klik **Deploy**.

### Opsi 2: Melalui Vercel CLI
```bash
npm i -g vercel
vercel
vercel env add GEMINI_API_KEY
vercel --prod
```
