import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@traffboard.com";
const OLD_PASSWORD = "admin123";
const NEW_PASSWORD = "admin1234!";

test("Admin can change password via UI and login with new password (with revert)", async ({ page }) => {
  // 1. Логин под админом (старый пароль)
  await page.goto("/main/auth/v1/login");
  await page.getByPlaceholder("admin@traffboard.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("••••••••").fill(OLD_PASSWORD);
  await page.getByRole("button", { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/dashboard/i);

  // 2. Переход в настройки/раздел смены пароля
  await page.goto("/main/dashboard/preferences");

  // 3. Ввод текущего и нового пароля (по placeholder)
  await page.getByPlaceholder("Enter current password").fill(OLD_PASSWORD);
  await page.getByPlaceholder("Enter new password").fill(NEW_PASSWORD);
  await page.getByPlaceholder("Confirm new password").fill(NEW_PASSWORD);

  // 4. Подтверждение смены
  await page.getByRole("button", { name: /change password/i }).click();

  // 5. Проверка результата (успех или ошибка)
  const successToast = page.getByText("Password changed successfully");
  const errorToast = page.getByText(/current password is incorrect|error/i);
  let result = "";
  if (await successToast.isVisible({ timeout: 5000 }).catch(() => false)) {
    result = "Password changed successfully";
  } else if (await errorToast.isVisible({ timeout: 5000 }).catch(() => false)) {
    result = "Password change error";
  } else {
    result = "Unknown state: ни успеха, ни ошибки";
  }
  console.log("PASSWORD CHANGE RESULT:", result);
  expect(["Password changed successfully"]).toContain(result);

  // 6. Разлогин
  await page.goto("/main/dashboard");
  await page.getByRole("button", { name: /logout/i }).click();
  await expect(page).toHaveURL(/login/i);

  // 7. Логин с новым паролем
  await page.getByPlaceholder("admin@traffboard.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("••••••••").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/dashboard/i);

  // 8. Снова сменить пароль обратно на старый через UI
  await page.goto("/main/dashboard/preferences");
  await page.getByPlaceholder("Enter current password").fill(NEW_PASSWORD);
  await page.getByPlaceholder("Enter new password").fill(OLD_PASSWORD);
  await page.getByPlaceholder("Confirm new password").fill(OLD_PASSWORD);
  await page.getByRole("button", { name: /change password/i }).click();
  // Проверка успеха
  await expect(page.getByText("Password changed successfully")).toBeVisible({ timeout: 5000 });

  // 9. Разлогин
  await page.goto("/main/dashboard");
  await page.getByRole("button", { name: /logout/i }).click();
  await expect(page).toHaveURL(/login/i);

  // 10. Проверить, что логин с admin123 снова работает
  await page.getByPlaceholder("admin@traffboard.com").fill(ADMIN_EMAIL);
  await page.getByPlaceholder("••••••••").fill(OLD_PASSWORD);
  await page.getByRole("button", { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/dashboard/i);
});
