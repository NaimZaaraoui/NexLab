import { expect, test, type Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/');
  await page.fill('input[type="email"]', 'admin@nexlab.local');
  await page.fill('input[type="password"]', 'NexLab2026!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /Tableau de bord laboratoire/i })).toBeVisible({
    timeout: 10000,
  });
}

async function openNewAnalysisForm(page: Page) {
  await page.goto('/analyses');
  await expect(page).toHaveURL(/\/analyses$/);
  await expect(page.getByRole('heading', { name: /Registre des analyses/i })).toBeVisible({
    timeout: 10000,
  });

  await page.goto('/analyses/nouvelle');
  await expect(page).toHaveURL(/\/analyses\/nouvelle/);
  await expect(page.getByRole('heading', { name: /Nouvelle Analyse/i })).toBeVisible();
  await expect(page.getByPlaceholder('Chercher un patient existant ...')).toBeVisible();
}

test.describe('Critical Analysis Flow', () => {
  test('admin can login and reach the dashboard', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByRole('link', { name: /^Analyses$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Actualiser/i })).toBeVisible();
  });

  test('analyses registry and new analysis form are reachable', async ({ page }) => {
    await loginAsAdmin(page);
    await openNewAnalysisForm(page);

    await expect(page.getByPlaceholder('Ex: 54')).toBeVisible();
    await expect(page.getByPlaceholder('Chercher analyse...')).toBeVisible();
    await expect(page.getByRole('button', { name: /Valider & Créer/i })).toBeVisible();
  });

  test('Critical Path: Login, Create Analysis, Enter Results, Validate, Print', async ({ page }) => {
    await loginAsAdmin(page);
    await openNewAnalysisForm(page);

    console.log('--- Step 1: Fill order information ---');
    await page.getByPlaceholder('Ex: 54').fill(`E2E-${Date.now()}`);
    await page.getByPlaceholder('Dr. Nom Prénom').fill('Dr E2E');

    console.log('--- Step 2: Select patient ---');
    await page.getByPlaceholder('Chercher un patient existant ...').fill('Sami');
    await page.getByRole('button', { name: /Ben Salem.*Sami|Sami.*Ben Salem/i }).click();

    console.log('--- Step 3: Select tests and create analysis ---');
    await page.getByRole('button', { name: /NFS-HGB/i }).click();
    await page.getByRole('button', { name: /Valider & Créer/i }).click();

    await expect(page).toHaveURL(/\/analyses\/.+/);
    await expect(page.getByRole('button', { name: /Sauvegarder/i })).toBeVisible();

    console.log('--- Step 4: Enter result and save ---');
    await page.locator('input[placeholder="--"]').first().fill('14.2');
    await page.getByRole('button', { name: /Sauvegarder/i }).click();

    console.log('--- Step 5: Validate technical then biological ---');
    await page.getByRole('button', { name: /^Valider$/ }).click();
    await expect(page.getByRole('button', { name: /Signer/i })).toBeVisible();
    await page.getByRole('button', { name: /Signer/i }).click();

    console.log('--- Step 6: Final state is ready for print ---');
    await expect(page.getByText(/Dossier Validé & Signé/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Impression Finale/i })).toBeVisible();
  });
});
