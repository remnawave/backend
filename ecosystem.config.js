module.exports = {
    apps: [
        {
            name: 'remnawave-api',
            script: 'dist/src/main.js',
            watch: false,
            instances: process.env.API_INSTANCES || 1,
            merge_logs: true,
            exec_mode: 'cluster',
            instance_var: 'INSTANCE_ID',
            env_development: {
                NODE_ENV: 'development',
                INSTANCE_TYPE: 'api',
            },
            env_production: {
                NODE_ENV: 'production',
                INSTANCE_TYPE: 'api',
            },
            namespace: 'api',
        },
        {
            name: 'remnawave-scheduler',
            script: 'dist/src/bin/scheduler/scheduler.js',
            watch: false,
            instances: 1, // DO NOT SCALE
            exec_mode: 'fork',
            merge_logs: true,
            instance_var: 'INSTANCE_ID',
            env_development: {
                NODE_ENV: 'development',
                INSTANCE_TYPE: 'scheduler',
            },
            env_production: {
                NODE_ENV: 'production',
                INSTANCE_TYPE: 'scheduler',
            },
            namespace: 'scheduler',
        },
        {
            name: 'remnawave-jobs',
            script: 'dist/src/bin/processors/processors.js',
            watch: false,
            instances: process.env.WORKER_INSTANCES || 1,
            exec_mode: 'cluster',
            merge_logs: true,
            instance_var: 'INSTANCE_ID',
            env_development: {
                NODE_ENV: 'development',
                INSTANCE_TYPE: 'processor',
            },
            env_production: {
                NODE_ENV: 'production',
                INSTANCE_TYPE: 'processor',
            },
            namespace: 'jobs',
        },
    ],
};
