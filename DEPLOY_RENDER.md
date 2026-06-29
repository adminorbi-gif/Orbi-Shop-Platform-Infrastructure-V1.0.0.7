# Deploying Orbi Shop to Render.com

If managing a raw Google Cloud VM (with Nginx, PM2, and memory limits) is causing too many issues, **Render.com** is the easiest alternative. It is a fully managed platform that automatically builds and hosts Node.js applications directly from your GitHub repository.

You will not need to touch Nginx, PM2, or Linux commands.

## Step 1: Push Your Code to GitHub
Ensure all your latest code is pushed to a repository on GitHub.
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

## Step 2: Create a Render Account
Go to [Render.com](https://render.com) and sign up using your GitHub account.

## Step 3: Create a New Web Service
1. In the Render Dashboard, click the **"New +"** button and select **"Web Service"**.
2. Choose **"Build and deploy from a Git repository"**.
3. Connect your GitHub account and select your `Orbi-Shop-Platform-Infrastructure` repository.

## Step 4: Configure the Service
Fill out the deployment settings exactly like this:

*   **Name:** `orbi-shop` (or whatever you prefer)
*   **Region:** Choose the region closest to your users.
*   **Branch:** `main` (or `master`)
*   **Runtime:** `Node`
*   **Build Command:** `npm install && npm run build`
*   **Start Command:** `npm run start`

## Step 5: Add Environment Variables
Scroll down to the **Environment Variables** section. You need to copy all the variables from your local `.env` file into Render.

Click **"Add Environment Variable"** or **"Secret Files"** for each one:
*   `DATABASE_URL` = `your_database_connection_string`
*   `GEMINI_API_KEY` = `your_gemini_api_key`
*   *(Add any other API keys or secrets your app uses)*

> **Important:** Do NOT add `PORT=3000`. Render will automatically assign a port and provide it to your app.

## Step 6: Deploy
1. Click **"Create Web Service"**.
2. Render will now clone your repo, run the build command, and start your server. 
3. You can watch the deployment logs live in the dashboard.
4. Once it says **"Live"**, you can click the `https://orbi-shop-xxxx.onrender.com` URL at the top left to view your site!

## Step 7: Adding a Custom Domain
Once your app is live on the `.onrender.com` URL:
1. Go to the **Settings** tab of your Render Web Service.
2. Scroll down to **Custom Domains**.
3. Click **"Add Custom Domain"** and enter `shop.orbifinancial.com`.
4. Render will give you a DNS record (a `CNAME` or `A` record) to add to your domain registrar (e.g., GoDaddy, Namecheap, Google Domains).
5. Add the record to your DNS settings. Render will automatically issue a free SSL certificate!
