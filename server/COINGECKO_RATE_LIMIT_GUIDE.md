# CoinGecko 429 Rate Limit Error - Solution Guide

## Problem

Getting HTTP 429 "Too Many Requests" error when fetching crypto prices from CoinGecko API.

## Root Cause

CoinGecko's free API tier has strict rate limits:

- ~10-30 requests per minute
- Daily/monthly quotas
- Shared IP limitations

## Solutions Implemented

### 1. **Automatic Rate Limiting** ✅

- Minimum 60-second intervals between API calls
- Exponential backoff on errors
- Smart caching to avoid unnecessary requests
- Respects `Retry-After` headers

### 2. **Configurable Fetch Intervals**

Set environment variables to control API call frequency:

```bash
# For free tier (recommended: 90+ seconds)
COINGECKO_FETCH_INTERVAL=90000

# For Pro tier (can be faster: 30+ seconds)
COINGECKO_FETCH_INTERVAL=30000
```

### 3. **CoinGecko Pro API Support** (Recommended)

Get higher rate limits with a Pro API key:

```bash
# Set your Pro API key
COINGECKO_API_KEY=your_pro_api_key_here
```

**Benefits of Pro tier:**

- 10,000+ calls per month
- Higher rate limits
- More stable performance
- Dedicated infrastructure

**Get your Pro API key:** https://www.coingecko.com/en/api/pricing

## Environment Setup

Create a `.env` file in the `/server` directory:

```env
# CoinGecko Configuration
COINGECKO_API_KEY=your_pro_api_key_here
COINGECKO_FETCH_INTERVAL=60000

# Other configurations...
MONGODB_URI=mongodb://localhost:27017/cryptographql
JWT_SECRET=your_jwt_secret_key_here
```

## Additional Recommendations

### For Development:

- Use 90-120 second intervals
- Monitor console logs for rate limit warnings
- Consider using mock data during heavy development

### For Production:

- **Always use CoinGecko Pro API**
- Set up monitoring for API failures
- Implement circuit breakers for critical failures
- Consider multiple API providers as backup

## Testing the Fix

After implementing these changes:

1. **Check console logs** for:

   ```
   "Using CoinGecko Pro API" (if Pro key is set)
   "Starting price fetching with 90s interval"
   "Crypto prices updated successfully"
   ```

2. **Monitor for errors**:

   ```
   "Rate limited by CoinGecko (429)" should become rare
   "Skipping API call due to rate limiting" is normal
   ```

3. **Verify functionality**:
   - Prices still update regularly
   - No more frequent 429 errors
   - Betting system continues to work

## Emergency Fixes

If you're still getting 429 errors:

1. **Increase interval immediately**:

   ```bash
   COINGECKO_FETCH_INTERVAL=180000  # 3 minutes
   ```

2. **Restart your server** to apply changes

3. **Check CoinGecko status**: https://status.coingecko.com/

4. **Consider temporary mock data** while resolving API issues

## Cost Analysis

**Free Tier**: $0/month

- Limited requests
- Rate limiting issues
- Not suitable for production

**Pro Tier**: Starting at $129/month

- 10,000 API calls
- Higher rate limits
- Production-ready
- Support included

**ROI for production apps**: The Pro tier quickly pays for itself by avoiding downtime and providing reliable data for your users.
