import midiPackage from '@tonejs/midi';
import { expect, test } from '@playwright/test';

const { Midi } = midiPackage;

test.beforeEach(async ({ page, baseURL }) => {
  // Exercise the supported keyboard fallback without hardware or permission prompts.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'requestMIDIAccess', { value: undefined, configurable: true });
  });
  // Fonts, CDN Tailwind and the remote logo are decorative. Keep smoke tests local.
  await page.route('**/*', route => {
    return new URL(route.request().url()).origin === baseURL ? route.continue() : route.abort();
  });
  page.on('pageerror', error => { throw error; });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'JACK / YOUNG' })).toBeVisible();
});

test('opens practice categories and returns to the menu', async ({ page }) => {
  await page.getByRole('button', { name: /PRACTICE Rudiments/i }).click();
  await expect(page.getByRole('heading', { name: 'PRACTICE ROOM', exact: true })).toBeVisible();
  await page.getByRole('heading', { name: 'Exercises', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Exercises', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No Exercises Yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Main Menu' }).click();
  await expect(page.getByRole('button', { name: /PLAY Select from Library/i })).toBeVisible();
});

test('searches by title and artist, handles no matches and opens a song on stage', async ({ page }) => {
  await page.getByRole('button', { name: /PLAY Select from Library/i }).click();
  await expect(page.getByText('8 Songs', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MIDI Connection Not Detected' })).toBeVisible();
  const search = page.getByPlaceholder('Search Library...');
  await search.fill('no matching song');
  await expect(page.getByText('No songs found', { exact: true })).toBeVisible();
  await expect(page.getByText('0 Songs', { exact: true })).toBeVisible();
  await search.fill('fUnKy');
  await expect(page.getByRole('heading', { name: 'Funky Chicken', exact: true })).toBeVisible();
  await expect(page.getByText('1 Songs', { exact: true })).toBeVisible();
  await search.fill('THE GROOVERS');
  await expect(page.getByRole('heading', { name: 'Backbeat Basics', exact: true })).toBeVisible();
  // The first Enter leaves search, the second launches the selected song.
  await search.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Score', { exact: true })).toBeVisible();
  await expect(page.getByText('Backbeat Basics', { exact: true })).toBeVisible();
});

test('persists a keyboard mapping across reload and resets defaults', async ({ page }) => {
  const settings = () => page.getByRole('button', { name: /SETTINGS Config/i }).click();
  await settings();
  // Click the pad; its decorative overlay covers the inner label.
  await page.getByText('Snare', { exact: true }).locator('..').click();
  await expect(page.getByRole('heading', { name: 'Press any key...' })).toBeVisible();
  await page.keyboard.press('x');
  await expect(page.getByRole('heading', { name: 'Press any key...' })).toBeHidden();
  await expect(page.getByText('X', { exact: true })).toBeVisible();
  await page.reload();
  await settings();
  await expect(page.getByText('X', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'RESET DEFAULTS' }).click();
  await expect(page.getByText('X', { exact: true })).toHaveCount(0);
  await expect(page.getByText('J', { exact: true })).toBeVisible();
  await page.reload();
  await settings();
  await expect(page.getByText('X', { exact: true })).toHaveCount(0);
  await expect(page.getByText('J', { exact: true })).toBeVisible();
});

test('imports a real MIDI file and keeps it after reload', async ({ page }) => {
  const midi = new Midi();
  midi.header.setTempo(120);
  midi.addTrack().addNote({ midi: 36, time: 0, duration: 1 });
  await page.getByRole('button', { name: /PLAY Select from Library/i }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'Smoke groove.mid', mimeType: 'audio/midi', buffer: Buffer.from(midi.toArray()),
  });
  await expect(page.getByText('9 Songs', { exact: true })).toBeVisible();
  await page.getByPlaceholder('Search Library...').fill('Smoke groove');
  await expect(page.getByRole('heading', { name: 'Smoke groove', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /PLAY Select from Library/i }).click();
  await expect(page.getByText('9 Songs', { exact: true })).toBeVisible();
  await page.getByPlaceholder('Search Library...').fill('Smoke groove');
  await expect(page.getByRole('heading', { name: 'Smoke groove', exact: true })).toBeVisible();
});
