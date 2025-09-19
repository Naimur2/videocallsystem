# Simple Environment Configuration

This guide shows how to configure deployment using a single `ENVIRONMENT_CONFIG` secret containing all environment variables as JSON.

## Required GitHub Secret

Set up only **one** repository secret:

### `ENVIRONMENT_CONFIG`
A JSON string containing all environment variables for both staging and production:

```json
{
  "staging": {
    "DATABASE_URL": "postgresql://user:pass@staging-db:5432/mediasoup_staging",
    "REDIS_URL": "redis://staging-redis:6379",
    "JWT_SECRET": "your-staging-jwt-secret-here",
    "SESSION_SECRET": "your-staging-session-secret-here",
    "MEDIASOUP_ANNOUNCED_IP": "staging.your-domain.com",
    "MEDIASOUP_LISTEN_IP": "0.0.0.0",
    "RTC_MIN_PORT": "40000",
    "RTC_MAX_PORT": "49999",
    "TURN_USERNAME": "your-turn-username",
    "TURN_CREDENTIAL": "your-turn-password",
    "TURN_SERVER_URL": "turn:staging.your-domain.com:3478",
    "STUN_SERVER_URL": "stun:staging.your-domain.com:3478",
    "NEXT_PUBLIC_API_URL": "https://staging-api.your-domain.com",
    "NEXT_PUBLIC_SOCKET_URL": "https://staging-ws.your-domain.com",
    "NEXT_PUBLIC_TURN_SERVER_URL": "turn:staging.your-domain.com:3478",
    "NEXT_PUBLIC_STUN_SERVER_URL": "stun:staging.your-domain.com:3478"
  },
  "production": {
    "DATABASE_URL": "postgresql://user:pass@prod-db:5432/mediasoup_production",
    "REDIS_URL": "redis://prod-redis:6379",
    "JWT_SECRET": "your-production-jwt-secret-here",
    "SESSION_SECRET": "your-production-session-secret-here",
    "MEDIASOUP_ANNOUNCED_IP": "your-domain.com",
    "MEDIASOUP_LISTEN_IP": "0.0.0.0",
    "RTC_MIN_PORT": "40000",
    "RTC_MAX_PORT": "49999",
    "TURN_USERNAME": "your-turn-username",
    "TURN_CREDENTIAL": "your-turn-password",
    "TURN_SERVER_URL": "turn:your-domain.com:3478",
    "STUN_SERVER_URL": "stun:your-domain.com:3478",
    "NEXT_PUBLIC_API_URL": "https://api.your-domain.com",
    "NEXT_PUBLIC_SOCKET_URL": "https://ws.your-domain.com",
    "NEXT_PUBLIC_TURN_SERVER_URL": "turn:your-domain.com:3478",
    "NEXT_PUBLIC_STUN_SERVER_URL": "stun:your-domain.com:3478"
  }
}
```

## Setup Commands

```powershell
# Set the environment configuration secret
gh secret set ENVIRONMENT_CONFIG --body @env-config.json

# You also need these AWS secrets:
gh secret set AWS_ACCESS_KEY_ID --body "your-aws-access-key"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-aws-secret-key"
gh secret set AWS_ACCOUNT_ID --body "your-aws-account-id"
```

## Application Configuration

Your applications need to parse the `ENVIRONMENT_CONFIG` environment variable at runtime:

### Backend (Node.js/Express)
```javascript
// Load environment configuration
const envConfig = JSON.parse(process.env.ENVIRONMENT_CONFIG || '{}');
const environment = process.env.NODE_ENV || 'staging';
const config = envConfig[environment] || {};

// Apply configuration
Object.keys(config).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = config[key];
  }
});
```

### Frontend (Next.js)
```javascript
// next.config.js
const envConfig = JSON.parse(process.env.ENVIRONMENT_CONFIG || '{}');
const environment = process.env.NODE_ENV || 'staging';
const config = envConfig[environment] || {};

module.exports = {
  env: {
    ...config
  }
};
```

## Benefits

1. **Single Secret**: Only one secret to manage instead of 28+
2. **Environment Separation**: Clear staging vs production configuration
3. **Version Control**: Can track environment configuration changes
4. **Simplified Setup**: Easier to configure and maintain
5. **Atomic Updates**: Update all environment variables at once

## Security Notes

- The JSON is stored as a GitHub secret (encrypted)
- Environment variables are still isolated between containers
- Use strong, unique secrets for production
- Rotate secrets regularly

## Testing

After setting up the secret, test the deployment:

```powershell
# Test staging deployment
git push origin main

# Test production deployment  
git push origin production
```