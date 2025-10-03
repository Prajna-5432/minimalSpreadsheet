# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### Backend Issues

#### 1. Database Connection Errors

**Error:** `Error: Cannot find module 'pg'`
```bash
Error: Cannot find module 'pg'
    at Function.Module._resolveFilename
    at Function.Module._load
```

**Solution:**
```bash
cd backend
npm install
```

**Error:** `Error: relation "columns_meta" does not exist`
```bash
Error: relation "columns_meta" does not exist
```

**Solution:**
```bash
# Run database schema
psql -U postgres -d spreadsheet -f db/init.sql
```

**Error:** `Error: password authentication failed`
```bash
Error: password authentication failed for user "postgres"
```

**Solution:**
```bash
# Check .env file
cat backend/.env

# Verify database credentials
psql -U postgres -h localhost -d spreadsheet
```

#### 2. Server Startup Issues

**Error:** `Error: listen EADDRINUSE: address already in use :::3001`
```bash
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm start
```

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check if PostgreSQL is listening
netstat -tlnp | grep 5432
```

#### 3. API Endpoint Issues

**Error:** `Error: syntax error at or near "do"`
```bash
Error: syntax error at or near "do"
```

**Solution:**
This is a PostgreSQL reserved keyword issue. The query has been fixed in the code.

**Error:** `Error: client is not defined`
```bash
Error: client is not defined
```

**Solution:**
This has been fixed by adding proper client checks in the code.

### Frontend Issues

#### 1. Build Errors

**Error:** `Module not found: Can't resolve 'axios'`
```bash
Module not found: Can't resolve 'axios'
```

**Solution:**
```bash
cd frontend
npm install
```

**Error:** `Error: Cannot resolve module 'react-query'`
```bash
Error: Cannot resolve module 'react-query'
```

**Solution:**
```bash
# Install correct package
npm install @tanstack/react-query
```

#### 2. Runtime Errors

**Error:** `TypeError: Cannot read property 'map' of undefined`
```bash
TypeError: Cannot read property 'map' of undefined
```

**Solution:**
Add null checks in components:
```javascript
{columns?.map(column => (
  // component code
))}
```

**Error:** `Network Error: Failed to fetch`
```bash
Network Error: Failed to fetch
```

**Solution:**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check proxy configuration in package.json
"proxy": "http://localhost:3001"
```

#### 3. Component Issues

**Error:** `Warning: Each child in a list should have a unique key prop`
```bash
Warning: Each child in a list should have a unique key prop
```

**Solution:**
Add unique keys to mapped elements:
```javascript
{items.map(item => (
  <div key={item.id}>
    {item.name}
  </div>
))}
```

**Error:** `Warning: Can't perform a React state update on an unmounted component`
```bash
Warning: Can't perform a React state update on an unmounted component
```

**Solution:**
Use cleanup in useEffect:
```javascript
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    const result = await api.getData();
    if (isMounted) {
      setData(result);
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false;
  };
}, []);
```

### Database Issues

#### 1. Connection Problems

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check if port is open
netstat -tlnp | grep 5432
```

**Error:** `Error: database "spreadsheet" does not exist`
```bash
Error: database "spreadsheet" does not exist
```

**Solution:**
```bash
# Create database
createdb spreadsheet

# Or using psql
psql -U postgres
CREATE DATABASE spreadsheet;
```

#### 2. Schema Issues

**Error:** `Error: relation "columns_meta" does not exist`
```bash
Error: relation "columns_meta" does not exist
```

**Solution:**
```bash
# Run schema file
psql -U postgres -d spreadsheet -f db/init.sql
```

**Error:** `Error: duplicate key value violates unique constraint`
```bash
Error: duplicate key value violates unique constraint
```

**Solution:**
```bash
# Check for duplicate data
SELECT * FROM columns_meta WHERE column_name = 'duplicate_name';

# Delete duplicates
DELETE FROM columns_meta WHERE id IN (
  SELECT id FROM columns_meta 
  WHERE column_name = 'duplicate_name' 
  AND id NOT IN (
    SELECT MIN(id) FROM columns_meta 
    WHERE column_name = 'duplicate_name'
  )
);
```

#### 3. Data Issues

**Error:** `Error: foreign key constraint fails`
```bash
Error: foreign key constraint fails
```

**Solution:**
```bash
# Check foreign key constraints
SELECT * FROM cell_values WHERE column_id NOT IN (
  SELECT id FROM columns_meta
);

# Fix orphaned records
DELETE FROM cell_values WHERE column_id NOT IN (
  SELECT id FROM columns_meta
);
```

### Performance Issues

#### 1. Slow Queries

**Issue:** Database queries are slow

**Solution:**
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Add indexes
CREATE INDEX idx_cell_values_row_column ON cell_values(row_id, column_id);
CREATE INDEX idx_data_rows_active_number ON data_rows(is_active, row_number) WHERE is_active = TRUE;
```

#### 2. Memory Issues

**Issue:** High memory usage

**Solution:**
```bash
# Check memory usage
free -h
pm2 monit

# Restart application
pm2 restart spreadsheet-backend

# Check for memory leaks
node --inspect server.js
```

#### 3. Network Issues

**Issue:** Slow API responses

**Solution:**
```bash
# Check network latency
ping localhost

# Check if port is accessible
telnet localhost 3001

# Check firewall
sudo ufw status
```

### Development Issues

#### 1. Hot Reload Issues

**Issue:** Changes not reflecting in browser

**Solution:**
```bash
# Clear browser cache
Ctrl + Shift + R

# Restart development server
npm start

# Check if proxy is working
curl http://localhost:3000/api/columns
```

#### 2. CORS Issues

**Error:** `Access to fetch at 'http://localhost:3001/api/columns' from origin 'http://localhost:3000' has been blocked by CORS policy`
```bash
Access to fetch at 'http://localhost:3001/api/columns' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```javascript
// Check CORS configuration in server.js
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
```

#### 3. Environment Issues

**Error:** `Error: Cannot find module 'dotenv'`
```bash
Error: Cannot find module 'dotenv'
```

**Solution:**
```bash
# Install missing dependencies
npm install dotenv

# Check .env file exists
ls -la backend/.env
```

### Production Issues

#### 1. SSL Issues

**Error:** `SSL certificate verification failed`
```bash
SSL certificate verification failed
```

**Solution:**
```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443

# Renew certificate
sudo certbot renew
```

#### 2. Process Management

**Issue:** Application crashes frequently

**Solution:**
```bash
# Check PM2 logs
pm2 logs spreadsheet-backend

# Restart application
pm2 restart spreadsheet-backend

# Check system resources
htop
```

#### 3. Backup Issues

**Error:** `Error: pg_dump: command not found`
```bash
Error: pg_dump: command not found
```

**Solution:**
```bash
# Install PostgreSQL client
sudo apt install postgresql-client

# Or use full path
/usr/bin/pg_dump -U postgres -h localhost spreadsheet
```

## Debugging Tools

### 1. Backend Debugging

#### Enable Debug Logging
```bash
# Set debug environment variable
DEBUG=* npm start

# Or specific modules
DEBUG=express:router npm start
```

#### Database Debugging
```sql
-- Enable query logging
SET log_statement = 'all';
SET log_duration = on;

-- Check active connections
SELECT * FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('spreadsheet'));
```

### 2. Frontend Debugging

#### React DevTools
```bash
# Install React DevTools browser extension
# Available for Chrome, Firefox, Safari
```

#### Console Debugging
```javascript
// Add debug logging
console.log('Debug:', { data, error });

// Use React Query devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
```

### 3. Network Debugging

#### API Testing
```bash
# Test API endpoints
curl -X GET http://localhost:3001/health
curl -X GET http://localhost:3001/api/columns
curl -X POST http://localhost:3001/api/rows
```

#### Network Monitoring
```bash
# Monitor network connections
netstat -tlnp | grep :3001
netstat -tlnp | grep :5432

# Check if ports are accessible
telnet localhost 3001
telnet localhost 5432
```

## Prevention Strategies

### 1. Code Quality

#### Linting
```bash
# Install ESLint
npm install -g eslint

# Run linting
eslint src/
```

#### Testing
```bash
# Install testing framework
npm install --save-dev jest

# Run tests
npm test
```

### 2. Monitoring

#### Health Checks
```bash
# Create health check script
cat > health_check.sh << EOF
#!/bin/bash
curl -f http://localhost:3001/health || exit 1
psql -U postgres -d spreadsheet -c "SELECT 1;" || exit 1
echo "All services healthy"
EOF

chmod +x health_check.sh
```

#### Log Monitoring
```bash
# Monitor logs in real-time
tail -f backend/logs/combined.log
pm2 logs spreadsheet-backend
```

### 3. Backup Strategy

#### Automated Backups
```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres -d spreadsheet > backup_$DATE.sql
gzip backup_$DATE.sql
EOF

chmod +x backup.sh
```

## Getting Help

### 1. Log Files

#### Backend Logs
```bash
# PM2 logs
pm2 logs spreadsheet-backend

# Application logs
tail -f backend/logs/combined.log
```

#### Database Logs
```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### System Logs
```bash
# System logs
sudo journalctl -u postgresql
sudo journalctl -u nginx
```

### 2. Error Reporting

#### Collect Information
```bash
# System information
uname -a
node --version
npm --version
psql --version

# Application status
pm2 status
systemctl status postgresql
systemctl status nginx
```

#### Error Context
- **Error message**: Exact error text
- **Steps to reproduce**: What you were doing
- **Environment**: OS, Node.js version, etc.
- **Logs**: Relevant log entries
- **Screenshots**: If applicable

### 3. Community Support

#### GitHub Issues
- Create detailed issue reports
- Include error logs and system information
- Provide steps to reproduce

#### Documentation
- Check this troubleshooting guide
- Review API documentation
- Check component documentation

This troubleshooting guide should help you resolve most common issues with the spreadsheet application. If you encounter issues not covered here, please create a detailed issue report with error logs and system information.
