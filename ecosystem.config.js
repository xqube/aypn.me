module.exports = {
    apps: [
        {
            name: 'aypn.me',
            script: 'app.js',
            instances: '1',
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                SITE_URL: 'https://aypn.me',
            },
            max_memory_restart: '256M',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],

    // PM2 deploy configuration for VPS one-command deployment
    deploy: {
        production: {
            user: 'xqube',
            host: 'your-vps-ip',
            ref: 'origin/main',
            repo: 'git@github.com:your-username/blog.aypn.git',
            path: '/var/www/aypn.me',
            'pre-deploy-local': '',
            'post-deploy': 'npm ci --omit=dev && npm run build && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
        },
    },
};
