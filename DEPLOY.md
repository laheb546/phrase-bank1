# Put English Phrase Bank online (private, only for you)

You will use:
1. **MongoDB Atlas** — free cloud database (replaces local MongoDB)
2. **Vercel** — free hosting for Next.js apps
3. **Password** — so only you can open the site

---

## Step 1 — Free cloud database (MongoDB Atlas)

1. Go to https://www.mongodb.com/cloud/atlas and create a free account
2. Create a **free M0 cluster** (click Create → Free)
3. Under **Database Access** → Add user → choose username + password (save them)
4. Under **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)  
   (needed so Vercel can connect)
5. Click **Connect** → **Drivers** → copy the connection string  
   It looks like:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Change it to include your database name:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/english-phrase-bank?retryWrites=true&w=majority
   ```
   Replace `USERNAME` and `PASSWORD` with the database user you created.

---

## Step 2 — Push code to GitHub

1. Create a free account on https://github.com if you don’t have one
2. Create a **new private repository** (e.g. `english-phrase-bank`) — mark it **Private**
3. On your computer, in the project folder:

```bash
cd sep26
git init
git add .
git commit -m "English Phrase Bank"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/english-phrase-bank.git
git push -u origin main
```

(Use your real GitHub username and repo name.)

---

## Step 3 — Deploy on Vercel (free)

1. Go to https://vercel.com and sign up with **GitHub**
2. Click **Add New Project** → import your `english-phrase-bank` repo
3. Before deploying, open **Environment Variables** and add:

| Name           | Value                                              |
|----------------|----------------------------------------------------|
| `MONGODB_URI`  | your Atlas connection string from Step 1           |
| `APP_PASSWORD` | any secret password only you know (e.g. `mySecret1`) |

4. Click **Deploy**
5. Wait ~1–2 minutes. Vercel gives you a URL like:
   ```
   https://english-phrase-bank-xxxx.vercel.app
   ```

---

## Step 4 — Use it from anywhere

1. Open that URL on phone or computer
2. Enter the **APP_PASSWORD** you set
3. Use the app — no VS Code needed

Bookmark the link. Only people who know the password can get in.

---

## Tips

- **Change password later:** Vercel → Project → Settings → Environment Variables → edit `APP_PASSWORD` → Redeploy
- **Local still works:** if `APP_PASSWORD` is not in `.env.local`, login is skipped on your PC
- **Keep repo private** on GitHub so your code stays private
- Free tiers of Atlas + Vercel are enough for personal use

## Optional: custom domain

In Vercel → Project → Settings → Domains, you can add a domain you own (e.g. `phrases.yourname.com`).
