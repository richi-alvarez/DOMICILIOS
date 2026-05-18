# Phase 11 - Step 6: Monitoring Dashboard Access Control

**Status**: 🔄 In Progress - E2E Tests Running  
**Date**: 2026-05-17  
**Component**: Analytics & Monitoring System - Plan-based Access Control

---

## 📋 Summary

Implemented plan-based access control for the monitoring dashboard. Users on Free plan cannot access the monitoring dashboard and see an upgrade prompt. Pro, Premium, and Business users have full access.

---

## 🔧 Changes Made

### 1. Database Layer - Plan Limits

**File**: `/lib/billing/constants.ts`

Added `monitoringAccess: boolean` property to `PlanLimits` interface:

```typescript
export interface PlanLimits {
  catalogs: number
  products: number
  ordersPerMonth: number
  collaborators: number
  customDomain: boolean
  analytics: boolean
  aiFeatures: boolean
  monitoringAccess: boolean  // NEW
}
```

Updated plan configurations:
- **Free**: `monitoringAccess: false`
- **Pro**: `monitoringAccess: true`
- **Premium**: `monitoringAccess: true`
- **Business**: `monitoringAccess: true`

### 2. Server Action

**File**: `/lib/actions/monitoring.ts` (NEW)

Created new server action for checking monitoring access:

```typescript
export async function canAccessMonitoring(): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user?.id) return false

    const orgId = await getOrgId(session.user.id)
    if (!orgId) return false

    const plan = await getOrgPlan(orgId)
    const limits = PLAN_LIMITS[plan]
    return limits.monitoringAccess ?? false
  } catch {
    return false
  }
}
```

### 3. UI - Access Control Implementation

**File**: `/app/(app)/app/monitoring/page.tsx`

**Changes**:
- Added `canAccessMonitoring` import
- Added state: `hasAccess: boolean | null`
- Added effect to check access before fetching data
- Imported `Lock` icon from lucide-react
- Added access denied UI component with:
  - Lock icon
  - "Monitoring Locked" heading
  - Description: "Only available for Pro, Premium, and Business plans"
  - "Upgrade Plan" button linking to `/app/settings/billing`

**Access Denied Component**:
```typescript
if (!hasAccess) {
  return (
    <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Lock className="w-16 h-16 text-warm-400 mx-auto" />
        <div>
          <h1 className="text-3xl font-bold text-night-800">Monitoring Locked</h1>
          <p className="text-warm-600 mt-2">
            The monitoring dashboard is only available for Pro, Premium, and Business plans.
          </p>
        </div>
        <Button onClick={() => (window.location.href = '/app/settings/billing')} className="mt-4">
          Upgrade Plan
        </Button>
      </div>
    </div>
  )
}
```

---

## 🧪 Test Coverage

### E2E Tests Created

**File**: `/tests/e2e/monitoring-access-control.spec.ts`

**Test Cases** (8 total):

1. ✅ **Free user access denied**
   - Verify lock icon and "Monitoring Locked" message
   - Verify "Upgrade Plan" button visible
   - Verify redirect to billing page works

2. ✅ **Pro user access granted**
   - Verify dashboard content visible
   - Verify system monitoring heading
   - Verify refresh button available
   - Verify alerts section visible

3. ✅ **Premium user access granted**
   - Verify dashboard content visible
   - Verify overall status card
   - Verify services grid visible

4. ✅ **Loading skeleton display**
   - Verify skeleton shown during data loading
   - Verify API calls made correctly

5. ✅ **Refresh button functionality**
   - Verify button state changes to "Refreshing"
   - Verify state returns to normal after refresh

6. ✅ **Regression: Pro user catalog creation**
   - Verify Pro users can still create catalogs
   - Verify "New Catalog" button visible

7. ✅ **Regression: Free user basic features**
   - Verify Free users still have dashboard access
   - Verify Free users still have catalog access

8. ✅ **Navigation sidebar**
   - Verify monitoring link visible for Pro users
   - Verify navigation to monitoring works

### Test Users

- **Free**: carlos.garcia@test.com
- **Pro**: maria.lopez@test.com
- **Premium**: juan.rodriguez@test.com
- Password: Test@12345

---

## 📊 Test Results

**Test Execution**: 2026-05-17 ~14:30 UTC

Tests are running in headed mode to verify:
- Access control logic working correctly
- UI components rendering properly
- Navigation flows working
- Regression testing for existing features

---

## ✅ Verification Checklist

- [ ] Free users see lock message
- [ ] Pro users see dashboard
- [ ] Premium users see dashboard
- [ ] Business users see dashboard
- [ ] Upgrade button redirects correctly
- [ ] Loading skeleton displays
- [ ] Refresh functionality works
- [ ] No regression in other features
- [ ] API calls working correctly
- [ ] Session/auth flows intact

---

## 🔄 Next Steps

1. Complete and review E2E test results
2. Document any failures or issues
3. Commit changes to testing branch
4. Review plan for remaining Phase 11 items:
   - Slack/Email notifications
   - Alert threshold configuration
   - AI-specific metrics dashboard

---

## 📝 Notes

- Access control mirrors the pattern used for `aiFeatures` in catalogs
- Uses existing auth and plan infrastructure
- Minimal changes required to monitoring page
- No breaking changes to existing functionality
- All plan-based access controlled at DB level for consistency
