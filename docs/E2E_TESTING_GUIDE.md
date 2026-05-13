# E2E Test Setup Guide

## Overview
This guide explains how to run end-to-end (E2E) tests for NexLab CSSB. These tests verify complete user workflows using real browser automation with Playwright.

## Prerequisites
- Node.js 18+ installed
- npm dependencies installed: `npm install`
- Playwright browsers installed: `npx playwright install`

## Test Database Seeding

Before running E2E tests, seed the database with test data:

```bash
# Seed E2E test database
npm run seed:e2e
```

This creates:
- **Test Users** with roles:
  - Admin: `admin@test.lab` / `admin123`
  - Technician: `tech@test.lab` / `tech123`
  - Receptionist: `reception@test.lab` / `reception123`
  - Doctor: `doctor@test.lab` / `doctor123`

- **Test Patients**:
  - Jean Dupont (Male, DOB: 1985-05-15)
  - Marie Martin (Female, DOB: 1990-03-20)

- **Test Analysis**:
  - Hematology panel with test definitions:
    - GB (Globules Blancs)
    - HGB (Hémoglobine)
    - PLT (Plaquettes)

## Running E2E Tests

### Run all E2E tests:
```bash
npm run test:e2e
```

### Run E2E tests with UI (interactive):
```bash
npm run test:e2e:ui
```

This opens the Playwright Test UI where you can:
- Run individual tests
- Watch test execution step-by-step
- Debug failing tests
- See network/console output

### Run specific test file:
```bash
npx playwright test tests/e2e/workflows.spec.ts
```

### Run tests in debug mode:
```bash
npx playwright test --debug
```

### Run tests with headed browser (see browser window):
```bash
npx playwright test --headed
```

## Test Coverage

E2E tests verify the following workflows:

### 1. **Authentication & Login**
- ✓ Login page loads
- ✓ Invalid credentials are rejected
- ✓ Admin can login
- ✓ Technician can login
- ✓ Logout functionality works

### 2. **Patient Management**
- ✓ Patient list displays
- ✓ Navigation to new patient form
- ✓ Seeded test patients appear in list

### 3. **Analysis Creation**
- ✓ Analysis list displays
- ✓ Navigation to new analysis form
- ✓ Seeded hematology analysis is visible
- ✓ Test selection interface works

### 4. **Result Entry**
- ✓ Result entry interface loads
- ✓ Numeric input fields exist for results
- ✓ Validation controls are present

### 5. **Reports & Validation**
- ✓ Reports section navigable
- ✓ Validation/approval controls visible
- ✓ Print/export options available

### 6. **Navigation & UI**
- ✓ Homepage loads
- ✓ Navigation menu exists
- ✓ Navigation between sections works
- ✓ Responsive design (mobile/tablet viewports)

### 7. **Error Handling**
- ✓ Network errors handled gracefully
- ✓ Validation errors displayed
- ✓ Empty lists handled gracefully

### 8. **Permission & Role-Based Access**
- ✓ Admin accesses all sections
- ✓ Technician can access analyses
- ✓ Receptionist can access patients
- ✓ Unauthorized access redirects to login

### 9. **Accessibility (WCAG)**
- ✓ Semantic HTML structure
- ✓ Accessible form controls
- ✓ Keyboard navigation support
- ✓ Text contrast requirements met
- ✓ Screen reader compatibility

### 10. **Performance**
- ✓ Pages load within reasonable time
- ✓ Repeated navigation works smoothly

## CI/CD Integration

E2E tests run automatically in GitHub Actions:
- Trigger: On push to main/develop branches, or pull requests
- Runs: After unit tests pass
- Artifacts: Test reports and screenshots on failure

See `.github/workflows/ci-cd.yml` for configuration.

## Troubleshooting

### Tests timeout
- Increase timeout: `npx playwright test --timeout 60000`
- Check if server is running: `npm run dev`
- Verify database is accessible

### Browser won't start
```bash
# Reinstall Playwright browsers
npx playwright install
```

### Tests fail on CI but pass locally
- Check that `.env` file has correct `DATABASE_URL`
- Ensure test data seeds correctly: `npm run seed:e2e`
- Review CI logs for specific error messages

### Specific test fails
```bash
# Run single test in debug mode
npx playwright test tests/e2e/workflows.spec.ts -g "Should load login page" --debug
```

## Writing New E2E Tests

Example test structure:

```typescript
test('should perform some user action', async ({ page }) => {
  // 1. Navigate or authenticate
  await loginAs(page, 'admin@test.lab', 'admin123');

  // 2. Perform action
  await page.goto('/analyses');
  const button = page.locator('button:has-text("Create")');
  await button.click();

  // 3. Assert result
  await expect(page.locator('h1')).toContainText('New Analysis');
});
```

### Best Practices:
1. Use flexible selectors (avoid brittle CSS/XPath)
2. Wait for page loads with `page.waitForURL()` or timeout
3. Use `.first()` or specific selectors when multiple elements match
4. Add `.catch(() => false)` for optional elements
5. Keep tests focused on user workflows, not implementation details

## Performance Optimization

For faster test runs:
1. Use `test.only` to focus on specific tests during development
2. Run tests in parallel (default): `npx playwright test`
3. Disable headed mode for CI: Remove `--headed` flag

## Database Reset

If test data becomes corrupted:

```bash
# Full database reset
npm run prisma:migrate -- reset --force

# Then re-seed
npm run seed:e2e
```

## Related Documentation
- [Playwright Documentation](https://playwright.dev)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Unit Tests Guide](./UNIT_TESTS_GUIDE.md)
