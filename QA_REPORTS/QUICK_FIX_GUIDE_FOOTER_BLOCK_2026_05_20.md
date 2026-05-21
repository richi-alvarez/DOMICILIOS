# ⚡ QUICK FIX: Footer Block E2E Tests Blocked by Auth Error

## 🎯 PROBLEM IN 1 LINE
**Signup endpoint returns 500 error → Can't create test accounts → Can't test footer block**

---

## 🔧 QUICK FIX (5-10 minutes)

### Step 1: Check auth.ts file
```bash
head -5 /home/epayco21/Escritorio/richi-alvarez/domicilios/lib/actions/auth.ts
# Should show: 'use server'
```

### Step 2: Rebuild project
```bash
cd /home/epayco21/Escritorio/richi-alvarez/domicilios
docker-compose down
rm -rf .next
docker-compose up -d
sleep 20
```

### Step 3: Test signup
Navigate to `http://localhost:3000/signup` and try registering

---

## ❌ If Step 3 still fails

Check server logs:
```bash
docker logs domicilios-app 2>&1 | tail -50 | grep -i "error"
```

Common fixes:
- [ ] Delete `.next/` folder
- [ ] Ensure `'use server'` exists at top of auth.ts
- [ ] Check NextAuth is configured correctly
- [ ] Review middleware.ts if it exists

---

## ✅ If signup works

Proceed with footer block testing:
1. Create test account
2. Login
3. Create catalog (4-step wizard)
4. Go to design editor
5. Verify footer block visible
6. Add footer block to page
7. Save and check preview

**Estimated time**: 20 minutes

---

## 📋 DETAILED GUIDES

For complete analysis:
- **FOOTER_BLOCK_CRITICAL_BUG_ANALYSIS_2026_05_20.md** - Full debugging guide
- **FOOTER_BLOCK_TEST_SUMMARY_2026_05_20.md** - Investigation summary
- **QA_REPORTS/** - All test reports

---

**Status**: 🔴 Blocked - Auth system broken  
**Action Required**: Fix signup endpoint (see steps above)  
**Estimated Fix Time**: 10-30 minutes  
**Estimated Test Time**: 20 minutes (after fix)
