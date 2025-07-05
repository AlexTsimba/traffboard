import { test, expect } from "@playwright/test";

// Генерация уникального email для теста
function uniqueEmail() {
  return `e2e+${Date.now()}@traffboard.com`;
}

test("admin can create, login, and delete a user via UI", async ({ page }) => {
  const email = uniqueEmail();
  const password = "StrongPassword123!";

  // 1. Логин под админом
  await page.goto("/main/auth/v1/login");
  await page.fill('input[name="email"]', "admin@traffboard.com");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  // Ждём либо перехода, либо появления ошибки
  try {
    await page.waitForURL(/dashboard/, { timeout: 5000 });
  } catch (e) {
    // Сохраняем скриншот и текст страницы для диагностики
    await page.screenshot({ path: 'login-fail-admin.png', fullPage: true });
    const bodyText = await page.textContent('body');
    console.log('LOGIN FAIL ADMIN PAGE TEXT:', bodyText);
    throw e;
  }

  // 2. Перейти в админку
  await page.goto("/main/dashboard/administration");

  // 3. Открыть форму создания пользователя
  await page.click('button:has-text("Add User")');

  // 4. Заполнить форму (уникальный email)
  await page.fill('input[name="name"]', "E2E Test User");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('[name="role"]');
  await page.click('div[role="option"]:has-text("User")');
  await page.click('button[type="submit"]:has-text("Create User")');

  // 5. Проверить, что пользователь появился в списке
  await expect(page.locator(`tr:has-text("${email}")`)).toBeVisible();

  // 6. Выйти из-под админа
  await page.click('button:has-text("Logout")');

  // 7. Логин под новым пользователем
  await page.goto("/main/auth/v1/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);

  // 8. Выйти из-под пользователя
  await page.click('button:has-text("Logout")');

  // 9. Снова логин под админом
  await page.goto("/main/auth/v1/login");
  await page.fill('input[name="email"]', "admin@traffboard.com");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.goto('/main/dashboard/administration');

  // 10. Найти пользователя и удалить через UI
  await page.click(`tr:has-text("${email}") button[aria-haspopup="menu"]`);
  await page.click("text=Deactivate");

  // 11. Проверить, что пользователь исчез из списка
  await expect(page.locator(`tr:has-text("${email}")`)).not.toBeVisible();
});
