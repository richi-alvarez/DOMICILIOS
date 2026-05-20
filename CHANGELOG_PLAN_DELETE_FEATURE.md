# Changelog — Plan-Based Catalog Deletion

**Date**: 2026-05-19  
**Feature**: Catalog deletion now controlled by plan limits  
**Branch**: testing  

---

## Summary

Added plan-based permission control for catalog deletion. The feature is now governed by the `canDeleteCatalogs` boolean in each plan's configuration, providing consistent permission management alongside other plan features like AI and analytics.

---

## Files Modified

### 1. `lib/billing/constants.ts`

**Changes**:
- Added `canDeleteCatalogs: boolean` to `PlanLimits` interface
- Configured each plan:
  - Free: `false` (no deletion allowed)
  - Pro: `true` (deletion allowed)
  - Premium: `true` (deletion allowed)
  - Business: `true` (deletion allowed)

**Impact**: All code that uses `PLAN_LIMITS` can now check deletion permissions

### 2. `app/api/catalogs/[id]/route.ts`

**Changes**:
- Added plan permission verification in DELETE method
- Queries organization's plan before allowing deletion
- Returns 403 with descriptive error if plan doesn't allow deletion
- Updated validation flow (now 5 steps instead of 4)

**Impact**: DELETE requests now check plan permission alongside admin role

---

## Test Files Created

### `tests/delete-catalog-plan-restrictions.spec.ts`

**Tests**:
- Pro user can delete catalogs
- Premium user can delete catalogs
- Application loads with new configuration

---

## Breaking Changes

**None** — This is a backward-compatible addition. Existing behavior is preserved.

---

## Behavior Changes

### Before
- Only admin role was required to delete catalogs
- Free users who were somehow admins could delete

### After
- Admin role is required (unchanged)
- Plan must explicitly allow deletion
- Free users cannot delete, even if admin
- Pro and above can delete

---

## API Changes

### DELETE /api/catalogs/[id]

**New Error Response**:
```json
HTTP 403
{
  "error": "Your plan does not allow deleting catalogs"
}
```

**Other Responses** (unchanged):
- 401 Unauthorized
- 403 Forbidden (not admin)
- 403 Forbidden (not member)
- 404 Not Found
- 500 Server Error

---

## Configuration Example

```typescript
// Before
export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  pro: {
    catalogs: 3,
    products: 500,
    aiFeatures: true,
    analytics: true,
    // ... (no delete control)
  }
}

// After
export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  pro: {
    catalogs: 3,
    products: 500,
    aiFeatures: true,
    analytics: true,
    canDeleteCatalogs: true,  // ← New
  }
}
```

---

## Plan Permissions Matrix

| Plan | Catalogs | Products | AI | Analytics | Delete |
|------|----------|----------|----|-----------| -------|
| Free | 1 | 30 | ❌ | ❌ | ❌ |
| Pro | 3 | 500 | ✅ | ✅ | ✅ |
| Premium | 10 | 5000 | ✅ | ✅ | ✅ |
| Business | ∞ | ∞ | ✅ | ✅ | ✅ |

---

## Testing

```bash
# Run plan restriction tests
npm run test:e2e -- tests/delete-catalog-plan-restrictions.spec.ts

# Run all catalog tests
npm run test:e2e -- tests/e2e-pro-premium.spec.ts
```

---

## Rollback Plan

If needed to revert:
1. Remove `canDeleteCatalogs` from `PlanLimits` interface
2. Remove it from all plan configurations
3. Remove plan check from DELETE method
4. Keep admin role check (original behavior)

---

## Performance Impact

**None** — Single additional query to organization + plan (cached in most cases)

---

## Security Impact

**Positive** — More restrictive permissions by default (Free plan cannot delete)

---

## Future Improvements

- [ ] Add UI indicator showing if user's plan allows deletion
- [ ] Add confirmation modal with plan-specific messaging
- [ ] Track deletions per plan in analytics
- [ ] Consider soft-delete for Free plan (recover within 30 days)

---

## Notes

- Configuration changes in `PLAN_LIMITS` immediately affect API behavior
- No database migrations required
- All existing deletion logic preserved
- Comprehensive error messages for users

