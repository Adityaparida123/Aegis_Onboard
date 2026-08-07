import { expect, test } from '@playwright/test';
import { createOfferPdf } from './helpers/pdf';

const API_BASE = 'http://localhost:4000/api';

test.describe('Full onboarding lifecycle', () => {
  test('upload → workflow → approve → completed, across the UI', async ({ page, request }) => {
    const email = `e2e-${Date.now()}@example.com`;

    const registration = await request.post(`${API_BASE}/auth/register`, {
      data: { name: 'E2E HR', email, password: 'secret123', role: 'HR' }
    });
    expect(registration.ok()).toBeTruthy();

    await page.goto('/login');
    await page.getByPlaceholder('you@company.com').fill(email);
    await page.getByPlaceholder('••••••••').fill('secret123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    await test.step('upload an offer letter', async () => {
      await page.goto('/onboarding');
      await page.locator('input[type="file"]').setInputFiles({
        name: 'offer.pdf',
        mimeType: 'application/pdf',
        buffer: createOfferPdf()
      });
      await expect(page.getByText('Margaret Hamilton', { exact: true })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('Waiting Approval')).toBeVisible();
      await expect(page.getByText('Provision IT access')).toBeVisible();
    });

    await test.step('visualize the dependency graph', async () => {
      await page.goto('/workflows');
      await expect(page.getByText('Onboarding for Margaret Hamilton').first()).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('.react-flow')).toBeVisible();
      await expect(page.getByText('Request privileged access')).toBeVisible();
    });

    let workflowId = '';
    await test.step('resolve every approval gate', async () => {
      const token = (await page.evaluate(() => localStorage.getItem('aegis-token'))) as string;
      const workflows = await request.get(`${API_BASE}/workflows`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = (await workflows.json()).data.workflows;
      const workflow = list.find((entry: { title: string }) => entry.title === 'Onboarding for Margaret Hamilton');
      workflowId = workflow._id;

      const approvals = await request.get(`${API_BASE}/approvals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pending = (await approvals.json()).data.approvals.filter(
        (entry: { workflowId: string; status: string }) => entry.workflowId === workflowId && entry.status === 'Pending'
      );
      const resources = pending.map((entry: { resource: string }) => entry.resource);

      await page.goto('/approvals');
      await expect(page.getByText('Pending requests')).toBeVisible({ timeout: 20_000 });

      for (const resource of resources) {
        await page.locator('li', { hasText: resource }).getByRole('button', { name: 'Approve' }).click({ timeout: 10_000 });
      }

      await expect(page.getByText('No pending approval requests')).toBeVisible({ timeout: 20_000 });
    });

    await test.step('workflow completes', async () => {
      await page.goto('/workflows');
      await expect(page.getByText('Completed').first()).toBeVisible({ timeout: 20_000 });
    });

    await test.step('audit trail and integrity', async () => {
      await page.goto('/audit');
      await page.getByPlaceholder('Workflow ID').fill(workflowId);
      await expect(page.getByText('workflow_generated')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('workflow_completed')).toBeVisible();

      const token = (await page.evaluate(() => localStorage.getItem('aegis-token'))) as string;
      const integrity = await request.get(`${API_BASE}/audit/${workflowId}/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect((await integrity.json()).data.integrity.valid).toBe(true);
    });
  });
});
