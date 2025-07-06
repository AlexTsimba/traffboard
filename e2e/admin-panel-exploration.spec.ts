import { test, expect, Page } from "@playwright/test";

// Вспомогательная функция для логирования и скриншотов
async function logStep(page: Page, step: string) {
  console.log(`STEP: ${step}`);
  await page.screenshot({ path: `explore-${step}.png`, fullPage: true });
  const bodyText = await page.textContent("body");
  console.log(`PAGE TEXT [${step}]:`, bodyText?.slice(0, 500));
}

test("explore admin panel UI", async ({ page }) => {
  // 1. Зайти на страницу логина
  await page.goto("/main/auth/v1/login");
  await logStep(page, "login-page");

  // 2. Ввести логин/пароль админа
  await page.fill('input[name="email"]', "admin@traffboard.com");
  await page.fill('input[name="password"]', "admin123");
  await logStep(page, "login-filled");

  // 3. Кликнуть submit
  await page.click('button[type="submit"]');
  // Ждём перехода или ошибку
  try {
    await page.waitForURL(/dashboard/, { timeout: 5000 });
  } catch (e) {
    await logStep(page, "login-fail");
    throw e;
  }
  await logStep(page, "dashboard");

  // 4. Открыть дропдаун пользователя (клик по уникальному селектору)
  const userMenuBtn = await page.locator('[data-slot="dropdown-menu-trigger"]');
  await expect(userMenuBtn).toBeVisible();
  await userMenuBtn.click({ force: true });
  await logStep(page, "user-menu-open");
  // Ждём 1 секунду на появление портального меню
  await page.waitForTimeout(1000);
  // Дамп HTML после паузы
  const dropdownHtml = await page.content();
  require("fs").writeFileSync("user-menu-open-after-wait.html", dropdownHtml);

  // 5. Явно ждём появления пункта "Administration" через role
  const adminMenuItem = await page.locator('a[href="/main/dashboard/administration"][role="menuitem"]');
  await expect(adminMenuItem).toBeVisible({ timeout: 3000 });
  await adminMenuItem.click();
  await logStep(page, "admin-nav");

  // 6. Проверить наличие кнопки "Create User" и формы
  const createBtn = await page.locator('button:has-text("Create User")');
  await expect(createBtn).toBeVisible();
  await logStep(page, "create-user-btn");

  // 7. Проверить таблицу пользователей
  const userTable = await page.locator("table");
  await expect(userTable).toBeVisible();
  await logStep(page, "user-table");

  // 8. Проверить наличие кнопки удаления у первого пользователя
  const deleteBtn = await page.locator('button:has([data-testid="delete-user"])').first();
  if ((await deleteBtn.count()) > 0) {
    await logStep(page, "delete-btn-visible");
  } else {
    console.log("No delete button found");
  }

  // 9. Выйти из админки (Logout)
  const logoutBtn = await page.locator('button:has-text("Logout")');
  if ((await logoutBtn.count()) > 0) {
    await logoutBtn.click();
    await logStep(page, "logout");
  } else {
    console.log("No logout button found");
  }
});
