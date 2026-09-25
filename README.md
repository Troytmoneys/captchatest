# Captcha Arena

A Vercel-ready site where visitors choose **hCaptcha** or **Google reCAPTCHA**, complete a challenge, and add a verified solve to a shared leaderboard.

## What is included

- Responsive single-page UI
- hCaptcha + reCAPTCHA selector
- Separate global counters for each provider
- Top-20 username leaderboard
- Server-side CAPTCHA verification
- Shared persistence using Upstash Redis
- Vercel serverless API endpoints

## 1. Create CAPTCHA keys

### hCaptcha
Create a site at https://dashboard.hcaptcha.com/

Add the hostname of your Vercel deployment, then copy:
- Site key
- Secret key

### Google reCAPTCHA
Create a **reCAPTCHA v2 Checkbox** key at:
https://www.google.com/recaptcha/admin/create

Add the hostname of your Vercel deployment, then copy:
- Site key
- Secret key

## 2. Put public site keys in index.html

Find:

```js
const CONFIG = {
  hcaptchaSiteKey: "YOUR_HCAPTCHA_SITE_KEY",
  recaptchaSiteKey: "YOUR_RECAPTCHA_SITE_KEY"
};
```

Replace both placeholders.

Public site keys are safe to expose in browser code. Secret keys are NOT.

## 3. Create Upstash Redis

Create a free Redis database at https://console.upstash.com/

Copy the REST URL and REST token.

## 4. Add these Vercel Environment Variables

In your Vercel project:

Settings -> Environment Variables

Add:

- `HCAPTCHA_SECRET_KEY`
- `RECAPTCHA_SECRET_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Redeploy after adding the variables.

## 5. Deploy

### Easy route
1. Put this folder in a GitHub repository.
2. Go to Vercel.
3. Import the repository.
4. Keep the default project settings.
5. Add the environment variables above.
6. Deploy.

No build command is required.

## Project structure

```text
captcha-arena/
├─ index.html
├─ package.json
├─ vercel.json
└─ api/
   ├─ _redis.js
   ├─ verify.js
   └─ leaderboard.js
```

## Important

The counter is incremented only after the Vercel API verifies the challenge token with hCaptcha or Google. Never put the CAPTCHA secret keys in `index.html`.
