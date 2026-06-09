import { expect, test } from '@playwright/test';

test.describe('CSRF protection', () => {
  test('rejects API mutations without CSRF header and accepts matching cookie/header', async ({ page }) => {
    await page.goto('/login');

    const csrfCookie = (await page.context().cookies()).find((cookie) => cookie.name === 'csrf-token');
    expect(csrfCookie?.value).toBeTruthy();

    const rejected = await page.request.patch('/api/settings', {
      data: {
        settings: {
          maintenance_message: 'csrf missing header test',
        },
      },
    });

    expect(rejected.status()).toBe(403);
    await expect(rejected.json()).resolves.toMatchObject({
      error: expect.stringContaining('CSRF validation failed'),
    });

    const passedCsrf = await page.request.patch('/api/settings', {
      headers: {
        'X-CSRF-Token': csrfCookie!.value,
      },
      data: {
        settings: {
          maintenance_message: '',
        },
      },
    });

    const passedCsrfBody = await passedCsrf.json();
    expect(passedCsrfBody.error).not.toContain('CSRF validation failed');
  });
});
