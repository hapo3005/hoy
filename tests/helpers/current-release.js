const { version: CURRENT_RELEASE } = require('../../package.json');

async function waitForData(page, min = 1, timeout = 30_000) {
  await page.waitForFunction(
    expected => Array.isArray(window.DATA) && window.DATA.length >= expected,
    min,
    { timeout }
  );
}

async function gotoReady(page, target = './', min = 1) {
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  await waitForData(page, min);
}

function expectCurrentAdminShell(expect, html) {
  expect(html).toContain(`HOY Control Center · ${CURRENT_RELEASE}`);
}

module.exports = { CURRENT_RELEASE, waitForData, gotoReady, expectCurrentAdminShell };
