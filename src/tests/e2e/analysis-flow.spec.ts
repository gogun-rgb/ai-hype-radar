import { expect, test } from "@playwright/test";

test("analyzes a repository and shows scores plus Canva prompt controls", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("GitHub 저장소 URL").fill("https://github.com/vercel/ai");
  await page.getByRole("button", { name: "분석 시작" }).click();

  await expect(page).toHaveURL(/\/analysis\//);
  await expect(page.getByRole("heading", { name: "Hype Score", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reality Score", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Risk Score", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "복사" })).toBeVisible();
  await expect(page.getByRole("button", { name: "텍스트 다운로드" })).toBeVisible();
});
