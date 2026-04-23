module.exports = {
  apps: [
    {
      name: 'terimawa-backend',
      script: 'src/app.js',
      cwd: '/opt/lampp/htdocs/wa-blash/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      out_file: '/var/log/terimawa/backend-out.log',
      error_file: '/var/log/terimawa/backend-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
