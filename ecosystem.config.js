module.exports = {
    apps: [
        {
            name: 'aypn.me',
            script: 'app.js',
            instances: '1',
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            max_memory_restart: '256M',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],
};
