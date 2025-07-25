# Temporary Fix for Shopify Integration

## ✅ **Issue Fixed: Import Path Error**

I've fixed the import path issue by:
1. Creating `/utils/supabase.js` in the root directory
2. Fixing all import statements to use `@/utils/supabase`

## 🧪 **Testing Steps**

### Step 1: Test the Debug Page
1. Go to `http://localhost:3000/debug`
2. Fill in test data:
   - Store Domain: `test-store`
   - API Key: `test-key`
   - Password: `test-password`
3. Click "Test Basic API" - should work now
4. Click "Test Shopify Simple" - should also work

### Step 2: Test Simple Shopify Connection
I've created a simplified endpoint that bypasses external API calls:
- `/api/shopify/connect-simple` - stores data directly without calling Shopify

### Step 3: Temporary Integration Fix
To quickly test the integration form, you can temporarily modify the main integration page to use the simple endpoint.

## 🔧 **Quick Fix for Integration Page**

If you want to test the integration form immediately, you can temporarily change one line in `/app/integration/page.jsx`:

**Find this line (around line 150):**
```javascript
const response = await fetch('/api/shopify/test-connection', {
```

**Change it to:**
```javascript
const response = await fetch('/api/shopify/connect-simple', {
```

This will bypass the external Shopify API call and just test the database storage.

## 📋 **What Should Work Now**

1. **Debug Page** - Should load without import errors
2. **Basic API Test** - Should return success
3. **Simple Shopify Test** - Should work with mock data
4. **Database Storage** - Should store integration data

## 🎯 **Next Steps**

1. Test the debug page first
2. If that works, try the temporary fix on the main integration page
3. Once we confirm the basic flow works, we can fix the real Shopify API connection

## 🚨 **Important Notes**

- The simple endpoint doesn't actually call Shopify - it's just for testing the flow
- Make sure you're logged in before testing
- Check browser console for any remaining errors
- The temporary fix will store test data in your database

Let me know if the debug page works now!