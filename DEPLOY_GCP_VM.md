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
Compile the project for production and start it in the background:

```bash
# Build the application (creates dist/server.cjs and front-end static files)
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
    server_name YOUR_VM_EXTERNAL_IP; # (Or your domain name if you have one)

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
# Enable the site
sudo ln -s /etc/nginx/sites-available/orbi-shop /etc/nginx/sites-enabled/

# Remove the default Nginx site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration and restart
sudo nginx -t
sudo systemctl restart nginx
```

## Step 8: Access Your Site
You can now visit your Google Cloud VM's **External IP** address in your web browser. 

*(If you ever push new code to GitHub, simply SSH in, `git pull`, `npm run build`, and `pm2 restart orbi-shop` to deploy the updates. If you see `npm: command not found`, make sure you ran Step 2 to install Node.js!)*
