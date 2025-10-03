# 🚀 Deployment Documentation

## Overview

This guide covers deploying the spreadsheet application to production environments, including both backend and frontend components.

## Prerequisites

### System Requirements
- **Node.js**: v16 or higher
- **PostgreSQL**: v12 or higher
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 10GB minimum for database
- **CPU**: 2 cores minimum, 4 cores recommended

### Production Dependencies
- **PM2**: Process manager for Node.js
- **Nginx**: Reverse proxy and static file server
- **SSL Certificate**: For HTTPS
- **Domain Name**: For production URL

## Backend Deployment

### 1. Server Setup

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2
```

#### CentOS/RHEL
```bash
# Update system
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 2. Database Setup

#### Create Production Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE spreadsheet_prod;
CREATE USER spreadsheet_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE spreadsheet_prod TO spreadsheet_user;

# Exit psql
\q
```

#### Run Database Schema
```bash
# Run schema
psql -U spreadsheet_user -h localhost -d spreadsheet_prod -f db/init.sql

# Add sample data (optional)
psql -U spreadsheet_user -h localhost -d spreadsheet_prod -f db/dummy-data.sql
```

### 3. Application Setup

#### Clone and Install
```bash
# Clone repository
git clone <repository-url>
cd spreadsheet

# Install dependencies
cd backend
npm install --production
```

#### Environment Configuration
```bash
# Create production .env file
cat > .env << EOF
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spreadsheet_prod
DB_USER=spreadsheet_user
DB_PASSWORD=secure_password
PORT=3001
EOF
```

#### PM2 Configuration
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'spreadsheet-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 4. Nginx Configuration

#### Install Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### Nginx Configuration
```bash
# Create site configuration
sudo cat > /etc/nginx/sites-available/spreadsheet << EOF
server {
    listen 80;
    server_name your-domain.com;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
    }

    # Frontend static files
    location / {
        root /var/www/spreadsheet/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/spreadsheet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Frontend Deployment

### 1. Build Process

#### Production Build
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build
```

#### Build Optimization
```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js

# Optimize images
npm install -g imagemin-cli
imagemin public/images/* --out-dir=build/static/images
```

### 2. Static File Deployment

#### Copy Build Files
```bash
# Create web directory
sudo mkdir -p /var/www/spreadsheet

# Copy build files
sudo cp -r frontend/build/* /var/www/spreadsheet/

# Set permissions
sudo chown -R www-data:www-data /var/www/spreadsheet
sudo chmod -R 755 /var/www/spreadsheet
```

#### Nginx Static Configuration
```nginx
# Add to nginx configuration
location /static/ {
    alias /var/www/spreadsheet/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location / {
    root /var/www/spreadsheet;
    index index.html;
    try_files $uri $uri/ /index.html;
}
```

## SSL Configuration

### 1. Let's Encrypt SSL

#### Install Certbot
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### Obtain SSL Certificate
```bash
# Get certificate
sudo certbot --nginx -d your-domain.com

# Test renewal
sudo certbot renew --dry-run
```

#### Auto-renewal Setup
```bash
# Add to crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 2. SSL Configuration

#### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rest of configuration...
}
```

## Database Optimization

### 1. PostgreSQL Configuration

#### Production Settings
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# Key settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

#### Connection Settings
```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add application user
local   spreadsheet_prod    spreadsheet_user    md5
host    spreadsheet_prod    spreadsheet_user    127.0.0.1/32    md5
```

### 2. Database Maintenance

#### Regular Maintenance
```bash
# Create maintenance script
cat > /home/user/db_maintenance.sh << EOF
#!/bin/bash
# Vacuum and analyze database
psql -U spreadsheet_user -d spreadsheet_prod -c "VACUUM ANALYZE;"

# Backup database
pg_dump -U spreadsheet_user -h localhost spreadsheet_prod > /backups/spreadsheet_$(date +%Y%m%d_%H%M%S).sql

# Clean old backups (keep 7 days)
find /backups -name "spreadsheet_*.sql" -mtime +7 -delete
EOF

chmod +x /home/user/db_maintenance.sh

# Add to crontab
echo "0 2 * * * /home/user/db_maintenance.sh" | crontab -
```

## Monitoring and Logging

### 1. Application Monitoring

#### PM2 Monitoring
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs spreadsheet-backend

# Restart application
pm2 restart spreadsheet-backend
```

#### Health Checks
```bash
# Create health check script
cat > /home/user/health_check.sh << EOF
#!/bin/bash
# Check backend health
curl -f http://localhost:3001/health || exit 1

# Check database connection
psql -U spreadsheet_user -d spreadsheet_prod -c "SELECT 1;" || exit 1

echo "All services healthy"
EOF

chmod +x /home/user/health_check.sh
```

### 2. Log Management

#### Log Rotation
```bash
# Install logrotate
sudo apt install logrotate

# Create logrotate configuration
sudo cat > /etc/logrotate.d/spreadsheet << EOF
/var/log/spreadsheet/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

## Security Hardening

### 1. Server Security

#### Firewall Configuration
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

#### SSH Security
```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Key settings
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

### 2. Application Security

#### Environment Security
```bash
# Secure .env file
chmod 600 backend/.env
chown root:root backend/.env
```

#### Database Security
```bash
# Create read-only user for backups
sudo -u postgres psql
CREATE USER spreadsheet_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE spreadsheet_prod TO spreadsheet_readonly;
GRANT USAGE ON SCHEMA public TO spreadsheet_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO spreadsheet_readonly;
```

## Backup Strategy

### 1. Database Backups

#### Automated Backups
```bash
# Create backup script
cat > /home/user/backup_db.sh << EOF
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="spreadsheet_prod"

# Create backup
pg_dump -U spreadsheet_user -h localhost $DB_NAME > $BACKUP_DIR/spreadsheet_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/spreadsheet_$DATE.sql

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/spreadsheet_$DATE.sql.gz s3://your-backup-bucket/
EOF

chmod +x /home/user/backup_db.sh

# Schedule backups
echo "0 1 * * * /home/user/backup_db.sh" | crontab -
```

### 2. Application Backups

#### Code Backup
```bash
# Create application backup
tar -czf /backups/spreadsheet_app_$(date +%Y%m%d).tar.gz /var/www/spreadsheet/
```

## Scaling Considerations

### 1. Horizontal Scaling

#### Load Balancer
```nginx
# Nginx load balancer configuration
upstream backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

#### Database Scaling
```bash
# Read replicas for database
# Configure PostgreSQL streaming replication
# Use connection pooling (PgBouncer)
```

### 2. Vertical Scaling

#### Resource Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor resources
htop
iotop
nethogs
```

## Troubleshooting

### 1. Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs spreadsheet-backend

# Check port availability
netstat -tlnp | grep :3001

# Check environment variables
pm2 show spreadsheet-backend
```

#### Database Connection Issues
```bash
# Test database connection
psql -U spreadsheet_user -h localhost -d spreadsheet_prod

# Check PostgreSQL status
sudo systemctl status postgresql

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### Nginx Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### 2. Performance Issues

#### Slow Queries
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Memory Issues
```bash
# Check memory usage
free -h
pm2 monit

# Restart application if needed
pm2 restart spreadsheet-backend
```

## Maintenance

### 1. Regular Updates

#### System Updates
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Node.js
sudo npm install -g n
sudo n stable
```

#### Application Updates
```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Restart application
pm2 restart spreadsheet-backend
```

### 2. Monitoring

#### Health Checks
```bash
# Create monitoring script
cat > /home/user/monitor.sh << EOF
#!/bin/bash
# Check application health
curl -f http://localhost:3001/health || echo "Backend down"

# Check database
psql -U spreadsheet_user -d spreadsheet_prod -c "SELECT 1;" || echo "Database down"

# Check disk space
df -h | grep -E "(Filesystem|/dev/)"
EOF

chmod +x /home/user/monitor.sh
```

This deployment guide provides comprehensive instructions for deploying the spreadsheet application to production environments with proper security, monitoring, and maintenance procedures.
