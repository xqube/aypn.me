module.exports = {
    apps: [
        {
            name: 'blog-aypn',
            script: 'app.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            max_memory_restart: '256M',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],
};
