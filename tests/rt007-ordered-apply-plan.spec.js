const { execFileSync } = require('child_process');

describe('RT-007 ordered apply plan', () => {
  test('machine gate passes fail-closed plan contract', () => {
    const output = execFileSync('node', ['scripts/investor-ready/check-rt007-ordered-apply-plan.cjs'], {
      encoding: 'utf8',
    });
    expect(output).toContain('RT-007 ordered apply plan PASS');
    expect(output).toContain('targets=36 published=34 unpublished=2');
    expect(output).toContain('productionMutationPerformed=false productionApplyAuthorized=false');
  });
});
