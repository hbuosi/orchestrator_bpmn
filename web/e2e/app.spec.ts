import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

// ---------------------------------------------------------------------------
// SSE mock helpers
// ---------------------------------------------------------------------------

/**
 * Intercepts POST /api/generate and returns a mock SSE stream.
 * `events` is an array of objects that will each be sent as `data: <json>\n\n`.
 */
async function mockGenerate(page: Page, events: object[]) {
  await page.route('**/api/generate', async (route) => {
    const body = events
      .map((e) => `data: ${JSON.stringify(e)}\n\n`)
      .join('');

    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      body,
    });
  });
}

const PROGRESS_EVENTS = [
  { type: 'progress', step: 1, message: 'Analyzing your process description...' },
  { type: 'progress', step: 2, message: 'Parsing service definition...' },
  { type: 'progress', step: 3, message: 'Generating BPMN diagram...' },
  { type: 'progress', step: 4, message: 'Building combined viewer...' },
];

const SUCCESS_EVENTS = [
  ...PROGRESS_EVENTS,
  { type: 'complete', html: '<html><body><h1>Mock Result</h1></body></html>' },
];

const ERROR_EVENTS = [
  { type: 'progress', step: 1, message: 'Analyzing your process description...' },
  { type: 'error', message: 'Test error from mock' },
];

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe('DGE Service Orchestrator — Web App', () => {

  // ── 1. Page load ──────────────────────────────────────────────────────────
  test('page load: renders title, heading, and disabled generate button', async ({ page }) => {
    await page.goto('/');

    // Browser tab title
    await expect(page).toHaveTitle('DGE Service Orchestrator');

    // Header badge text (monospace label above h1)
    await expect(page.getByText('DGE Service Orchestrator', { exact: false }).first()).toBeVisible();

    // H1 contains the two-line headline
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Describe your service.');
    await expect(h1).toContainText('We generate the rest.');

    // Generate button exists and is disabled (no text entered yet)
    const generateBtn = page.getByRole('button', { name: /generate/i });
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toBeDisabled();

    // Footer is present
    await expect(page.getByText(/UAE TDRA/i)).toBeVisible();
  });

  // ── 2. Load example ───────────────────────────────────────────────────────
  test('load example: fills textarea and enables generate button', async ({ page }) => {
    await page.goto('/');

    const loadExampleBtn = page.getByRole('button', { name: /load example/i });
    await expect(loadExampleBtn).toBeVisible();

    await loadExampleBtn.click();

    // Textarea should now have content
    const textarea = page.locator('textarea');
    await expect(textarea).not.toBeEmpty();
    await expect(textarea).toContainText('Trade License Renewal');

    // Generate button should now be enabled
    const generateBtn = page.getByRole('button', { name: /generate/i });
    await expect(generateBtn).toBeEnabled();

    // "Load example" button should disappear once textarea has content
    await expect(loadExampleBtn).toBeHidden();
  });

  // ── 3. Tab switching ──────────────────────────────────────────────────────
  test('tab switching: upload file tab shows drop zone; text tab shows textarea', async ({ page }) => {
    await page.goto('/');

    // Initially in text mode — textarea is visible
    await expect(page.locator('textarea')).toBeVisible();

    // Switch to Upload File tab
    const uploadTab = page.getByRole('button', { name: /upload file/i });
    await uploadTab.click();

    // Textarea should be gone; drop-zone text should appear
    await expect(page.locator('textarea')).toBeHidden();
    await expect(page.getByText(/drop file here/i)).toBeVisible();
    await expect(page.getByText(/\.xlsx/i)).toBeVisible();

    // Switch back to Text tab
    const textTab = page.getByRole('button', { name: /text/i });
    await textTab.click();

    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.getByText(/drop file here/i)).toBeHidden();
  });

  // ── 4. File type validation ───────────────────────────────────────────────
  test('file type validation: uploading unsupported file type shows error', async ({ page }) => {
    await page.goto('/');

    // Switch to file upload mode
    await page.getByRole('button', { name: /upload file/i }).click();

    // Create a temporary .pdf file to upload
    const tmpFile = path.join(os.tmpdir(), 'test-invalid.pdf');
    fs.writeFileSync(tmpFile, '%PDF-1.4 fake pdf content');

    // Set the file on the hidden input directly (bypasses the OS file picker)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tmpFile);

    // Error banner should appear with the unsupported file type message
    await expect(page.getByText(/unsupported file type/i)).toBeVisible();

    // Generate button should remain disabled (no valid file selected)
    await expect(page.getByRole('button', { name: /generate/i })).toBeDisabled();

    // Clean up temp file
    fs.unlinkSync(tmpFile);
  });

  // ── 5. Generate button state ──────────────────────────────────────────────
  test('generate button state: disabled when empty, enabled after typing', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea');
    const generateBtn = page.getByRole('button', { name: /generate/i });

    // Starts disabled
    await expect(generateBtn).toBeDisabled();

    // Type some text → button enables
    await textarea.fill('A simple service description');
    await expect(generateBtn).toBeEnabled();

    // Clear the textarea → button disables again
    await textarea.fill('');
    await expect(generateBtn).toBeDisabled();
  });

  // ── 6. Error state ────────────────────────────────────────────────────────
  test('error state: error banner appears and "Try again" resets to idle', async ({ page }) => {
    await page.goto('/');

    // Mock the API to return an error event
    await mockGenerate(page, ERROR_EVENTS);

    // Fill textarea and click generate
    await page.locator('textarea').fill('Any service description');
    const generateBtn = page.getByRole('button', { name: /generate/i });
    await generateBtn.click();

    // Error banner should appear
    await expect(page.getByText(/error/i).filter({ hasText: /error/i }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Test error from mock')).toBeVisible();

    // "Try again" button should be present
    const tryAgainBtn = page.getByRole('button', { name: /try again/i });
    await expect(tryAgainBtn).toBeVisible();

    // Click "Try again" → error banner disappears, form is back to idle
    await tryAgainBtn.click();

    await expect(page.getByText('Test error from mock')).toBeHidden();
    await expect(tryAgainBtn).toBeHidden();

    // Textarea still has content, generate button is enabled again
    await expect(generateBtn).toBeEnabled();
  });

  // ── 7. Success state (bonus) ──────────────────────────────────────────────
  test('success state: done banner appears after successful generation', async ({ page }) => {
    // Override window.open BEFORE navigation so the new-tab call is a no-op
    await page.addInitScript(() => {
      window.open = () => null;
    });

    await page.goto('/');

    // Mock the API with a complete success response
    await mockGenerate(page, SUCCESS_EVENTS);

    await page.locator('textarea').fill('A trade license renewal service');
    await page.getByRole('button', { name: /generate/i }).click();

    // Progress section should become visible while loading
    await expect(page.getByText(/processing/i)).toBeVisible({ timeout: 5_000 });

    // Done banner should appear after the complete event
    await expect(page.getByText(/✓ done/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Service Card + BPMN generated successfully.')).toBeVisible();
    await expect(page.getByRole('link', { name: /open result in new tab/i })).toBeVisible();
  });

});
