module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps : [
        {
            name      : "RoofMapper",
            script    : "bin/www",
            env: {
            },
            env_production : {
                NODE_ENV: "production"
            }
        }
    ]
}
