import { test, expect } from '@playwright/test';

test('Admin can log in and see dashboard or get error/2FA', async ({ page }) => {
  await page.goto('/main/auth/v1/login');
  await page.getByPlaceholder('admin@traffboard.com').fill('admin@traffboard.com');
  await page.getByPlaceholder('••••••••').fill('admin123');
  await page.getByRole('button', { name: /sign in|login/i }).click();

  // Ждём один из вариантов: 2FA, ошибка, дашборд
  const twoFA = page.getByRole('heading', { name: /two-factor/i });
  const dashboard = page.getByRole('heading', { name: /traffboard/i });
  const error = page.getByText(/invalid|ошибка|error|неверн/i);

  let result = '';
  if (await twoFA.isVisible({ timeout: 5000 }).catch(() => false)) {
    result = '2FA required';
  } else if (await dashboard.isVisible({ timeout: 5000 }).catch(() => false)) {
    result = 'Login successful, dashboard visible';
  } else if (await error.isVisible({ timeout: 5000 }).catch(() => false)) {
    result = 'Login error shown';
  } else {
    result = 'Unknown state: ни дашборда, ни 2FA, ни ошибки';
  }
  // Логируем результат для отчёта
  console.log('LOGIN RESULT:', result);
  expect(['2FA required', 'Login successful, dashboard visible']).toContain(result);
}); 