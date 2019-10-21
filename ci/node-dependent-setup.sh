>ci/hashed-password.txt node --experimental-modules ci/user-passwd-crypt.mjs ${API_USER_PASSWORD}
node --experimental-modules ci/update-value-postman-environment.mjs ci/gitlab_ci_postman_environment.json baseUrl http://0.0.0.0:${SEET_API_PORT}/api/${SEET_API_VERSION}
node --experimental-modules ci/update-value-postman-data.mjs ci/postman_data.json api_user ${API_USER_EMAIL}
node --experimental-modules ci/update-value-postman-data.mjs ci/postman_data.json api_user_password ${API_USER_PASSWORD}
