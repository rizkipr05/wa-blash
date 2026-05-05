const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeBlastTarget,
  getUniqueNormalizedTargets,
  getPendingTargets
} = require('./blastTargets');

test('normalizeBlastTarget normalizes local and intl numbers consistently', () => {
  assert.equal(normalizeBlastTarget('0812-3456-7890'), '6281234567890');
  assert.equal(normalizeBlastTarget('81234567890'), '6281234567890');
  assert.equal(normalizeBlastTarget('6281234567890'), '6281234567890');
  assert.equal(normalizeBlastTarget(''), null);
});

test('getUniqueNormalizedTargets removes duplicate numbers from one database input', () => {
  const result = getUniqueNormalizedTargets([
    '0812-3456-7890',
    '6281234567890',
    '81234567890',
    '0899 111 222',
    '0899-111-222'
  ]);

  assert.deepEqual(result, ['6281234567890', '62899111222']);
});

test('getPendingTargets blocks repeat send for any number already logged before', () => {
  const result = getPendingTargets(
    ['0812-3456-7890', '0899-111-222', '0817-000-000'],
    ['6281234567890', '0899-111-222']
  );

  assert.deepEqual(result.uniqueTargets, ['6281234567890', '62899111222', '62817000000']);
  assert.deepEqual(result.pendingTargets, ['62817000000']);
  assert.equal(result.skippedCount, 2);
});
