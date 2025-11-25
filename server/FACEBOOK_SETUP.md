# Facebook & Instagram Integration Setup Guide

This guide will help you set up complete Facebook and Instagram integration for the Ad Genie application.

## Prerequisites

- Facebook Business Account
- Instagram Business Account (linked to Facebook Page)
- Access to Facebook App Dashboard

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click "Get Started" or log in to your account
3. Go to "My Apps" and click "Create App"
4. Choose "Business" as the app type
5. Fill in the app details:
   - **App Name**: Ad Genie
   - **App Contact Email**: your-email@example.com
   - **App Purpose**: Select "Other" or relevant category
6. Click "Create App"

## Step 2: Add Products to Your App

1. In your app dashboard, click "Add Product"
2. Find and add the following products:
   - **Facebook Login**
   - **Graph API**
   - **Instagram Graph API**

## Step 3: Configure Facebook Login

1. Go to **Settings > Basic** and note your:
   - `App ID` (this is your `FACEBOOK_CLIENT_ID`)
   - `App Secret` (this is your `FACEBOOK_CLIENT_SECRET`)

2. Go to **Products > Facebook Login > Settings**
3. Add Valid OAuth Redirect URIs:
   ```
   http://localhost:5000/api/accounts/oauth/facebook/callback
   ```
   (Update domain for production)

4. Go to **Settings > Basic**
5. Add your domain to "App Domains":
   ```
   localhost:5000
   ```

## Step 4: Get Your Facebook Page Access Token

### Method 1: Using Graph API Explorer (Quickest for Testing)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer)
2. Select your app from the dropdown
3. Click "Get User Access Token" and select permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publishing`
4. Get a long-lived token using the `/me?fields=access_token` endpoint
5. The response will include an access token

### Method 2: Using Facebook App (Recommended for Production)

1. Create a system user in your business account:
   - Go to **Settings > Users**
   - Click "Add System User"
   - Create as "Admin"
2. Assign it to your app
3. Generate an access token for the system user with relevant permissions

## Step 5: Link Your Instagram Business Account

1. Go to your Facebook Page Settings
2. Navigate to **Instagram Account > Settings > Linked Accounts**
3. If you don't have an Instagram Business Account, convert your account:
   - Go to Instagram app Settings
   - Switch to Business Account
   - Link to your Facebook Page

4. Get your Instagram Business Account ID:
   - Use the Graph API Explorer
   - Query: `/me/instagram_business_account`
   - Note the `id` field

## Step 6: Update Environment Variables

Edit your `.env` file in the `server` directory:

```env
# Facebook OAuth Configuration
FACEBOOK_CLIENT_ID=your_app_id_here
FACEBOOK_CLIENT_SECRET=your_app_secret_here
FACEBOOK_REDIRECT_URI=http://localhost:5000/api/accounts/oauth/facebook/callback

# Facebook/Instagram API Configuration
FACEBOOK_API_VERSION=v18.0
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_account_id_here
FACEBOOK_PAGE_ID=your_facebook_page_id_here

# Frontend Base URL
FRONTEND_BASE=http://localhost:3000
SERVER_BASE=http://localhost:5000
```

### Finding Your IDs:

**FACEBOOK_PAGE_ID**: 
- Use Graph API Explorer
- Query: `/me`
- Copy the `id` field

**INSTAGRAM_BUSINESS_ACCOUNT_ID**:
- Use Graph API Explorer  
- Query: `/me/instagram_business_account`
- Copy the `id` field

**FACEBOOK_PAGE_ACCESS_TOKEN**:
- Use Graph API Explorer
- Get an access token with these permissions:
  - `pages_manage_posts`
  - `pages_read_engagement`
  - `instagram_basic`
  - `instagram_content_publishing`

## Step 7: Set Facebook App Permissions

1. Go to **Settings > Permissions** in your app
2. Ensure these permissions are available:
   - `pages_manage_posts` - Allows posting to your page
   - `pages_read_engagement` - Allows reading page analytics
   - `instagram_basic` - Basic Instagram access
   - `instagram_content_publishing` - Allows publishing to Instagram

## Step 8: Test the Integration

### Using the Web UI:

1. Start your server and frontend:
   ```bash
   # In server directory
   python app.py

   # In client directory (new terminal)
   npm run dev
   ```

2. Navigate to Dashboard > Connected Accounts
3. Click "Add Account" or the Facebook button
4. You'll be prompted to authorize your app
5. After authorization, you should see your Facebook account connected

### Testing with PostMan/API Client:

1. Get your JWT token from login
2. Call the oauth start endpoint:
   ```bash
   GET /api/accounts/oauth/facebook/start
   Authorization: Bearer {your_jwt_token}
   ```

3. Open the returned `authUrl` in your browser
4. Complete the authorization
5. Verify the account appears in `/api/accounts` endpoint

## Step 9: Publishing Ads

### Option 1: Using the UI

1. Create an ad using the "Create New Ad" view
2. Once generated, click the "Publish" button
3. Select Facebook and/or Instagram
4. Click "Publish Now"

### Option 2: Using API Directly

**Publish to Facebook:**
```bash
POST /api/publish/facebook
Authorization: Bearer {your_jwt_token}
Content-Type: application/json

{
  "caption": "Your ad caption",
  "image_url": "https://example.com/image.jpg",
  "ad_id": 123
}
```

**Publish to Instagram:**
```bash
POST /api/publish/instagram
Authorization: Bearer {your_jwt_token}
Content-Type: application/json

{
  "caption": "Your ad caption",
  "image_url": "https://example.com/image.jpg",
  "ad_id": 123
}
```

## Step 10: Monitoring & Analytics

### Get Facebook Post Insights:
```bash
GET /api/insights/facebook/{post_id}
Authorization: Bearer {your_jwt_token}
```

### Get Instagram Post Insights:
```bash
GET /api/insights/instagram/{media_id}
Authorization: Bearer {your_jwt_token}
```

## Troubleshooting

### "Invalid OAuth Redirect URI"
- Verify the redirect URI in Facebook App Settings matches exactly
- Check for trailing slashes or protocol mismatches

### "Missing Code from Facebook"
- Check browser console for OAuth window popup blockers
- Ensure cookies are enabled

### "Failed to get page access token"
- Verify your user token has correct permissions
- Try generating a new token with all required permissions

### "No Instagram Business Account Found"
- Ensure your Instagram account is set to Business type
- Link your Instagram account to your Facebook Page
- Grant all necessary permissions to your Facebook app

### Instagram Publishing Fails with "Invalid Image"
- Ensure image is in valid format (JPG, PNG, GIF)
- Image should be at least 1080x1350 pixels
- Use HTTPS URL for image

## API Reference

### Authentication Endpoints

- `POST /api/signup` - Register new user
- `POST /api/login` - Login user
- `GET /api/user/profile` - Get user profile (requires token)

### Social Account Endpoints

- `GET /api/accounts` - List connected accounts
- `POST /api/accounts/connect` - Manually connect account
- `DELETE /api/accounts/{id}` - Disconnect account
- `GET /api/accounts/oauth/{provider}/start` - Start OAuth flow
- `GET /api/accounts/facebook/pages` - Get available Facebook pages
- `GET /api/accounts/instagram/accounts` - Get available Instagram accounts

### Publishing Endpoints

- `POST /api/publish/facebook` - Publish to Facebook
- `POST /api/publish/instagram` - Publish to Instagram
- `GET /api/insights/facebook/{post_id}` - Get Facebook post insights
- `GET /api/insights/instagram/{media_id}` - Get Instagram media insights

## Production Deployment

When deploying to production:

1. **Update Redirect URIs**: Change all `localhost:5000` URLs to your production domain
2. **Use Long-Lived Tokens**: Implement token refresh mechanism
3. **Enable HTTPS**: Facebook requires HTTPS in production
4. **Update CORS**: Configure proper CORS settings for your domain
5. **Environment Variables**: Use secure environment variable management
6. **Rate Limiting**: Implement rate limiting for API endpoints
7. **Error Logging**: Set up comprehensive logging and monitoring

## Security Notes

- Never commit `.env` file to version control
- Regenerate tokens periodically
- Use HTTPS only in production
- Implement token refresh before expiration
- Validate all user inputs
- Use server-side session management for sensitive data

## Additional Resources

- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Facebook Developer Documentation
3. Check application logs for detailed error messages
4. Create an issue in the repository with detailed information
