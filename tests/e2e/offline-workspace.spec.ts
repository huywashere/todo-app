import { expect, test } from '@playwright/test';

test('opens a usable offline workspace and creates a task', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /tiếp tục ngoại tuyến/i }).click();
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
  const input = page.getByPlaceholder('+ Add task');
  await input.fill('Playwright portfolio task');
  await input.press('Enter');
  await expect(page.getByText('Playwright portfolio task')).toBeVisible();

  await page.getByTitle(/Calendar/).click();
  await expect(page.getByText('Playwright portfolio task')).toBeVisible();

  await page.getByTitle(/Tasks \(/).click();
  await page.getByTitle('Kanban').click();
  await expect(page.getByText('Cần làm')).toBeVisible();

  await page.keyboard.press('Control+K');
  await expect(page.getByPlaceholder(/Tìm kiếm lệnh/)).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByTitle(/Achievements/).click();
  await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible();

  await page.getByTitle(/Tasks \(/).click();
  if ((page.viewportSize()?.width ?? 1024) <= 760) {
    await page.getByTitle('Toggle Sidebar').click();
    await expect(page.getByText('Lists', { exact: true })).toBeVisible();
  }
});
