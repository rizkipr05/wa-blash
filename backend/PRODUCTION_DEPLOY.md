# Production Deployment Checklist

## 1) Configure environment
1. Copy env template:
   ```bash
   cp .env.example .env
   ```
2. Fill real values in `.env`:
   - `DATABASE_URL` (required)
   - `JWT_SECRET` (required)
   - `RECAPTCHA_SECRET` (required)
   - `WA_SESSION_DIR` (required for production)

## 2) Prepare protected WhatsApp session directory
Use a directory outside public web directories.

```bash
sudo mkdir -p /var/lib/terimawa/wa-sessions
sudo chown -R www-data:www-data /var/lib/terimawa
sudo chmod -R 700 /var/lib/terimawa
```

Optional daily backup example:
```bash
sudo mkdir -p /var/backups/terimawa
sudo tar -czf /var/backups/terimawa/wa-sessions-$(date +%F).tar.gz /var/lib/terimawa/wa-sessions
```

## 3) Install dependencies and generate prisma client
```bash
cd /opt/lampp/htdocs/wa-blash/backend
npm ci
npx prisma generate
```

## 4) Verify QR flow on production
1. Start backend.
2. Login as user and open WhatsApp page.
3. Click `Tambah WhatsApp`.
4. Scan QR with WhatsApp app.
5. Ensure status changes from `DISCONNECTED/QR_READY` to `CONNECTED`.
6. Restart backend and verify connected devices re-bootstrap.

## 5) Run service with process manager

### Option A: PM2
```bash
sudo mkdir -p /var/log/terimawa
sudo chown -R www-data:www-data /var/log/terimawa

cd /opt/lampp/htdocs/wa-blash/backend
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

### Option B: systemd
```bash
sudo mkdir -p /var/log/terimawa
sudo chown -R www-data:www-data /var/log/terimawa

sudo cp deploy/systemd/terimawa-backend.service /etc/systemd/system/terimawa-backend.service
sudo systemctl daemon-reload
sudo systemctl enable --now terimawa-backend
sudo systemctl status terimawa-backend
```

## 6) Monitoring and logs
- Service logs:
  - `/var/log/terimawa/backend-out.log`
  - `/var/log/terimawa/backend-error.log`
- WhatsApp lifecycle events are logged (QR generated, connected, disconnected, reconnect attempts, errors).
- Set `WA_LOG_LEVEL=info` (or `debug`) to increase observability.

## 7) Security audit
Run regularly:
```bash
cd /opt/lampp/htdocs/wa-blash/backend && npm audit
cd /opt/lampp/htdocs/wa-blash/frontend && npm audit
```

For non-breaking auto-fixes:
```bash
npm audit fix
```

For force fixes (review before using in production):
```bash
npm audit fix --force
```
