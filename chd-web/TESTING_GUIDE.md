# Quick Start Guide - Testing Auth Features

## 🚀 Start the Application

```bash
cd chd-web
npm run dev
```

Visit: **http://localhost:3000**

---

## 🧪 Test Scenarios

### Scenario 1: Unauthenticated User Flow

1. **Visit Home Page** (`/`)
   - ✅ Navbar shows "Sign In" button on the right
   - ✅ "My Data" link visible in navbar

2. **Click "My Data"**
   - ✅ Redirects to `/login?next=/my-data`

3. **Click "Sign In" button**
   - ✅ Navigates to `/login`

---

### Scenario 2: Sign Up New User

1. **Navigate to** `/signup` (or click "Create one now" on login page)

2. **Fill the form:**
   ```
   Name: John Doe (optional)
   Email: test@example.com
   Password: Test1234
   Confirm: Test1234
   ```

3. **Click "Create Account"**
   - ✅ Shows success toast
   - ✅ Redirects to `/my-data`
   - ✅ Navbar now shows avatar with "T" (first letter of email)
   - ✅ "My Data" page shows "Coming Soon" message

---

### Scenario 3: Sign In Existing User

1. **Navigate to** `/login`

2. **Enter credentials:**
   ```
   Email: test@example.com
   Password: Test1234
   ```

3. **Click "Sign In"**
   - ✅ Shows success toast
   - ✅ Redirects to `/my-data` (or to `next` param if present)
   - ✅ Navbar updates with user profile

---

### Scenario 4: Profile Dropdown & Sign Out

1. **When signed in, click the avatar/email in navbar**
   - ✅ Dropdown opens showing:
     - User email
     - "My Data" link
     - "Sign Out" button

2. **Click "Sign Out"**
   - ✅ Navbar reverts to "Sign In" button
   - ✅ Redirects to home page
   - ✅ Trying to access `/my-data` now redirects to login

---

### Scenario 5: Form Validation

#### Login Page Validation
- Empty email → "Email is required"
- Invalid email → "Please enter a valid email address"
- Empty password → "Password is required"
- Short password → "Password must be at least 6 characters"

#### Signup Page Validation
- Invalid email format → Error shown
- Password < 8 chars → "Password must be at least 8 characters"
- Missing uppercase/lowercase/number → "Password must contain uppercase, lowercase, and number"
- Passwords don't match → "Passwords do not match"

---

### Scenario 6: Protected Route Access

1. **Sign Out** (if signed in)

2. **Manually navigate to** `/my-data`
   - ✅ Automatically redirects to `/login?next=/my-data`

3. **Sign in from that login page**
   - ✅ After login, redirects back to `/my-data`

---

### Scenario 7: Mobile Responsive

1. **Resize browser to mobile width** (< 768px)
   - ✅ Navbar shows hamburger menu
   - ✅ Click hamburger → menu slides open
   - ✅ Auth state shown at bottom of menu
   - ✅ Sign in/out works from mobile menu

---

## 🎨 Visual Checks

### Styling Consistency
- ✅ Red theme matches home page (red-600 primary)
- ✅ Rounded corners (2xl) on cards and buttons
- ✅ Shadow effects on cards and buttons
- ✅ Hover states on all interactive elements
- ✅ Focus rings visible when tabbing

### Accessibility
- ✅ Tab through forms with keyboard
- ✅ Enter key submits forms
- ✅ Error messages announced
- ✅ All buttons have proper labels

---

## 🔍 Console Verification

Open browser DevTools Console and check for:

```
🔐 Auth configured: Mock (local dev)
```

This confirms the mock auth provider is active (no Supabase keys configured).

---

## 🧩 Advanced Testing

### Test LocalStorage Persistence

1. Sign up a user
2. Refresh the page
   - ✅ User should still be signed in (state restored from localStorage)

3. Open DevTools → Application → Local Storage
   - ✅ Check for `mock_auth_user` key with user data

### Test Forgot Password UI

1. On login page, click "Forgot password?"
   - ✅ Toast appears: "Password reset feature coming soon"

### Test My Data Placeholder

1. Sign in and go to `/my-data`
   - ✅ Shows user avatar with email
   - ✅ "Coming Soon" message displayed
   - ✅ Planned features list shown
   - ✅ "Run New Assessment" button links to `/predictor`
   - ✅ "Export Data" button is disabled

---

## 🐛 Common Issues & Solutions

### Issue: "Sign In" button doesn't appear
**Solution:** Clear browser cache and localStorage, refresh

### Issue: Validation errors not showing
**Solution:** Check browser console for errors, ensure JavaScript enabled

### Issue: Page doesn't redirect after login
**Solution:** Check console for errors, verify router is working

---

## 📱 Test Checklist

- [ ] Sign up with new user
- [ ] Sign in with existing user
- [ ] Sign out
- [ ] Access protected page without auth (redirects)
- [ ] Click "My Data" when not signed in (redirects)
- [ ] Profile dropdown opens/closes
- [ ] Mobile menu works
- [ ] Form validation shows errors
- [ ] Toast notifications appear
- [ ] Styling matches site theme
- [ ] Keyboard navigation works

---

## 🎯 Production Supabase Testing

To test with real Supabase:

1. Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. Restart dev server

3. Check console:
```
🔐 Auth configured: Supabase (real)
```

4. Sign up creates real Supabase user
5. Check Supabase dashboard → Authentication → Users

---

**Happy Testing! 🎉**
