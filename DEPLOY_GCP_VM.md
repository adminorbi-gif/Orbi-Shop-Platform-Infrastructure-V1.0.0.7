# Google Cloud VM Deployment Guide

This guide covers how to deploy the Orbi Shop platform on a standard Google Cloud Compute Engine VM using Ubuntu.

## Step 1: Create the VM Instance
1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Navigate to **Compute Engine > VM instances** and click **Create Instance**.
3. **Machine configuration**: An `e2-medium` (4GB RAM) or higher is recommended. (Note: Using `e2-micro` or `e2-small` will likely cause the VM to run out of memory and crash during `npm run build` or when handling heavy traffic).
4. **Boot disk**: Choose **Ubuntu** (Ubuntu 22.04 LTS or 24.04 LTS).
5. **Firewall**: Check **Allow HTTP traffic** and **Allow HTTPS traffic**.
6. Click **Create**.

## Step 2: SSH into the VM & Install Dependencies
Once the VM is running, click the **SSH** button next to it in the Google Cloud Console.

Run the following commands to install Node.js 20, Git, and PM2 (a production process manager for Node.js):

```bash
# Update the package list
sudo apt update && sudo apt upgrade -y

# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git and Nginx
sudo apt install -y git nginx

# Install PM2 globally
sudo npm install -g pm2
```

## Step 3: Clone the Repository
Clone your project from GitHub:

```bash
git clone https://github.com/adminorbi-gif/Orbi-Shop-Platform-Infrastructure-V1.0.0.7.git
cd Orbi-Shop-Platform-Infrastructure-V1.0.0.7
```

## Step 4: Install Dependencies & Set Environment Variables
```bash
# Install npm packages
npm install

# Clear the .env file and open it for editing
> .env && nano .env
```
*(In the `nano` editor, paste your clean environment variables including your Supabase keys, Gemini keys, and a 32-character string for your `ENCRYPTION_KEY`. Press `Ctrl + X`, then `Y`, then `Enter` to save).*

## Step 5: Create a Swap File (Crucial for Memory Issues)
If you are using a VM with less than 8GB of RAM, the `npm run build` command might fail with a **"JavaScript heap out of memory"** error. Creating a swap file provides extra virtual memory to prevent crashes:

```bash
# Create a 4GB swap file
sudo fallocate -l 4G /swapfile

# Secure the swap file
sudo chmod 600 /swapfile

# Make the file a swap space
sudo mkswap /swapfile

# Enable the swap
sudo swapon /swapfile

# Make it permanent across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Step 6: Build and Start the App
Compile the project for production and start it in the background. **Make sure you are inside the project folder before running these commands!**

```bash
# Ensure you are in the project folder (it could be Orbi-Shop-Platform-Infrastructure-V1.0.0.7 or orbi-shop)
cd ~/Orbi-Shop-Platform-Infrastructure-V1.0.0.7 || cd ~/orbi-shop

# Export memory limit for Node.js to prevent "heap out of memory" errors
export NODE_OPTIONS="--max-old-space-size=4096"

# Build the application (creates dist/server.cjs and front-end static files)
# IMPORTANT: This step can take 2-5 minutes on smaller VMs. Do not press Ctrl+C! Wait for it to finish.
npm run build

# Start the application using PM2 (runs the compiled server directly in production mode)
NODE_ENV=production pm2 start dist/server.cjs --name "orbi-shop"

# Tell PM2 to automatically restart the app if the VM reboots
pm2 startup
# (Run the command PM2 outputs here, it will look like 'sudo env PATH...')
pm2 save
```

## Step 7: Configure Nginx as a Reverse Proxy (Optional but Recommended)
By default, the app runs on port 3000. To make it accessible cleanly over port 80 (standard HTTP):

```bash
# Create an Nginx config file
sudo nano /etc/nginx/sites-available/orbi-shop
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name shop.orbifinancial.com; # Replace with your IP if you don't have a domain setup yet

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and restart Nginx:
```bash
# Enable the site (the -f flag forces the link creation, overwriting if it exists)
sudo ln -sf /etc/nginx/sites-available/orbi-shop /etc/nginx/sites-enabled/

# Remove the default Nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# If you get a warning about "conflicting server name", find and remove duplicate configs:
# sudo rm -f /etc/nginx/sites-enabled/other-duplicate-file

# Test Nginx configuration and restart
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Configure Firewall Rules (Crucial for Network Issues)
If the site is "taking a long time to load" or timing out, your Google Cloud VM is likely blocking HTTP traffic. You MUST open port 80 and 443 in the GCP firewall:

1. Go to the **Google Cloud Console** -> **VPC Network** -> **Firewall**.
2. Click **Create Firewall Rule**.
3. Set **Name**: `allow-http-https`
4. Set **Targets**: `All instances in the network` (or specify your target tags).
5. Set **Source IPv4 ranges**: `0.0.0.0/0`
6. Under **Protocols and ports**, check **TCP** and enter: `80, 443, 3000`
7. Click **Create**.

## Step 9: Access Your Site
You can now visit your Google Cloud VM's **External IP** address in your web browser. 

*(If you ever push new code to GitHub, simply SSH in, `git pull`, `npm run build`, and `pm2 restart orbi-shop` to deploy the updates. If you see `npm: command not found`, make sure you ran Step 2 to install Node.js!)*

## Troubleshooting

**1. Nginx Conflict Warning (`conflicting server name`)**
If you see this when restarting Nginx, you have two configuration files fighting over the same domain name. Run:
```bash
sudo rm -f /etc/nginx/sites-enabled/shop.orbifinancial.com
sudo systemctl restart nginx
```

**2. 502 Bad Gateway / Connection Refused**
This means the Node.js app is not running or crashed. Check PM2:
```bash
pm2 status
pm2 logs orbi-shop
```

**4. App is Extremely Slow or `localhost:3000` Times Out**
If the site or `curl http://localhost:3000/api/health` is very slow to load (taking 30+ seconds), there are three common culprits:

*   **Vite Dev Server is Running (Most Common):** PM2 might be running the app in Development mode, which tries to compile the whole app on the fly using 100% CPU. PM2 caches environment variables. You must delete the process and recreate it explicitly in production mode with `--update-env`:
```bash
pm2 delete orbi-shop
NODE_ENV=production pm2 start dist/server.cjs --name "orbi-shop" --update-env
pm2 save
```
*   **e2-micro VM is Out of RAM (Swap Thrashing):** If you are using the free `e2-micro` VM, it only has 1GB of RAM. The `npm run build` process or running Node + Nginx can use all 1GB, causing the VM to freeze and "swap" to the hard drive. 
    *   *Fix A:* Go to GCP -> Stop VM -> Edit -> Change to `e2-small` (2GB RAM) -> Start VM.
    *   *Fix B:* Add virtual RAM via swap file by running:
        ```bash
        sudo swapoff -a || true
        sudo rm -f /swapfile
        sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        ```
*   **Database Connection Hangs:** The app tries to connect to your `DATABASE_URL` on startup. If your database is paused (e.g., Supabase inactive) or IP-restricted, the app will hang.

**5. Test Local Connectivity**
To ensure the app is actually running properly locally on the VM before Nginx touches it:
```bash
curl http://localhost:3000/api/health
```