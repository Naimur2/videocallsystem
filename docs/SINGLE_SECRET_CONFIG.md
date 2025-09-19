# Single Secret Environment Configuration

This workflow uses a single GitHub secret `ENV_VARS` that contains all environment variables as key=value pairs.

## Required GitHub Secrets

Set up these **4 essential secrets**:

### 1. `ENV_VARS`
Contains all environment variables in dotenv format:

```bash
# Application Settings
NODE_ENV=production
PORT_BACKEND=3001
PORT_FRONTEND=3000

# Database Configuration
DATABASE_URL=postgresql://user:pass@your-db:5432/mediasoup
REDIS_URL=redis://your-redis:6379

# Security
JWT_SECRET=your-secure-jwt-secret-here
SESSION_SECRET=your-secure-session-secret-here

# MediaSoup Configuration
MEDIASOUP_ANNOUNCED_IP=your-domain.com
MEDIASOUP_LISTEN_IP=0.0.0.0
RTC_MIN_PORT=40000
RTC_MAX_PORT=49999

# TURN/STUN Configuration
TURN_USERNAME=your-turn-user
TURN_CREDENTIAL=your-turn-password
TURN_SERVER_URL=turn:your-domain.com:3478
STUN_SERVER_URL=stun:your-domain.com:3478

# Frontend URLs
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://ws.your-domain.com
NEXT_PUBLIC_TURN_SERVER_URL=turn:your-domain.com:3478
NEXT_PUBLIC_STUN_SERVER_URL=stun:your-domain.com:3478
```

### 2. `AWS_ACCESS_KEY_ID`
Your AWS access key ID

### 3. `AWS_SECRET_ACCESS_KEY`
Your AWS secret access key

### 4. `AWS_ACCOUNT_ID`
Your AWS account ID (12-digit number)

## Setup Commands

```powershell
# Create the environment variables file
@"
NODE_ENV=production
PORT_BACKEND=3001
PORT_FRONTEND=3000
DATABASE_URL=postgresql://user:pass@your-db:5432/mediasoup
REDIS_URL=redis://your-redis:6379
JWT_SECRET=your-secure-jwt-secret-here
SESSION_SECRET=your-secure-session-secret-here
MEDIASOUP_ANNOUNCED_IP=your-domain.com
MEDIASOUP_LISTEN_IP=0.0.0.0
RTC_MIN_PORT=40000
RTC_MAX_PORT=49999
TURN_USERNAME=your-turn-user
TURN_CREDENTIAL=your-turn-password
TURN_SERVER_URL=turn:your-domain.com:3478
STUN_SERVER_URL=stun:your-domain.com:3478
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://ws.your-domain.com
NEXT_PUBLIC_TURN_SERVER_URL=turn:your-domain.com:3478
NEXT_PUBLIC_STUN_SERVER_URL=stun:your-domain.com:3478
"@ | Out-File -FilePath .env.vars -Encoding UTF8

# Set all secrets
gh secret set ENV_VARS --body-file .env.vars
gh secret set AWS_ACCESS_KEY_ID --body "your-aws-access-key"
gh secret set AWS_SECRET_ACCESS_KEY --body "your-aws-secret-key"
gh secret set AWS_ACCOUNT_ID --body "your-aws-account-id"

# Clean up local file
Remove-Item .env.vars
```

## Application Configuration

Your applications need to parse the `ENV_VARS` environment variable at startup:

### Backend (Node.js/Express)
```javascript
// Load environment variables from ENV_VARS
if (process.env.ENV_VARS) {
  const envVars = process.env.ENV_VARS.split('\n');
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}
```

### Frontend (Next.js)
```javascript
// next.config.js
function parseEnvVars(envString) {
  const vars = {};
  if (envString) {
    envString.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        vars[key] = valueParts.join('=').trim();
      }
    });
  }
  return vars;
}

const envVars = parseEnvVars(process.env.ENV_VARS);

module.exports = {
  env: {
    ...envVars
  }
};
```

## Benefits

1. **Ultra Simple**: Only 4 secrets total (1 for env vars + 3 for AWS)
2. **Single Source**: All environment variables in one place
3. **Easy Updates**: Update all variables at once
4. **Version Control**: Can track environment changes in commits
5. **No JSON Parsing**: Simple key=value format

## Security Notes

- The ENV_VARS secret is encrypted by GitHub
- Use strong, unique secrets for production
- Don't commit actual values to repository
- Rotate secrets regularly

## Testing

After setting up secrets:

```powershell
# Test staging deployment
git push origin main

# Test production deployment  
git push origin production
```

This is the simplest possible configuration - just one secret with all your environment variables!