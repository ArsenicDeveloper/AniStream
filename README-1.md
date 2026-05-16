# AniStream 🎌

A modern anime streaming website built with React + Vite.

---

## 🚀 How to Deploy to Vercel (Step by Step)

### Step 1 — Set up the project on your computer
1. Make sure you have **Node.js** installed → https://nodejs.org (download the LTS version)
2. Download or unzip this project folder
3. Open your terminal / command prompt and `cd` into the folder:
   ```
   cd anistream
   ```
4. Install dependencies:
   ```
   npm install
   ```
5. Test it locally:
   ```
   npm run dev
   ```
   Then open http://localhost:5173 in your browser

### Step 2 — Push to GitHub
1. Create a free account at https://github.com
2. Create a new repository (click the + button → New repository)
3. Follow GitHub's instructions to push your code:
   ```
   git init
   git add .
   git commit -m "first commit"
   git remote add origin https://github.com/YOUR_USERNAME/anistream.git
   git push -u origin main
   ```

### Step 3 — Deploy to Vercel
1. Go to https://vercel.com and sign up (free, use your GitHub account)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite project — just click **Deploy**
5. Done! You'll get a live URL like `https://anistream.vercel.app`

---

## 🎬 Setting up flixcloud.cc Video Embeds

Right now, clicking "Watch Now" loads a placeholder embed URL.
To make real videos play, you need to:

1. Find the video embed URL from flixcloud.cc for each anime
2. Open `src/App.jsx` and find this function near the top:
   ```js
   const getEmbedUrl = (animeId, episode) => {
     return `https://flixcloud.cc/embed/${animeId}?ep=${episode}`;
   };
   ```
3. Replace it with the real URL format flixcloud uses, for example:
   ```js
   const getEmbedUrl = (animeId, episode) => {
     // Example — update with whatever URL format flixcloud actually uses
     return `https://flixcloud.cc/embed/REAL_VIDEO_ID`;
   };
   ```
4. Also update each anime in `ANIME_DATA` to have the correct flixcloud ID

---

## 📁 File Structure

```
anistream/
├── index.html          ← App entry point
├── package.json        ← Dependencies
├── vite.config.js      ← Build config
└── src/
    ├── main.jsx        ← React root
    └── App.jsx         ← Everything (components, data, styles)
```
