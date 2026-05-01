const normalizeBlastTarget = (value) => {
  let cleaned = String(value || '').replace(/\D/g, '');
  if (!cleaned) return null;

  if (cleaned.startsWith('0')) {
    cleaned = `62${cleaned.substring(1)}`;
  } else if (cleaned.startsWith('8')) {
    cleaned = `62${cleaned}`;
  }

  return cleaned;
};

const getUniqueNormalizedTargets = (rawTargets = []) => {
  return [...new Set(rawTargets.map(normalizeBlastTarget).filter(Boolean))];
};

const getPendingTargets = (rawTargets = [], existingTargets = []) => {
  const uniqueTargets = getUniqueNormalizedTargets(rawTargets);
  const attemptedTargets = new Set(existingTargets.map(normalizeBlastTarget).filter(Boolean));
  const pendingTargets = uniqueTargets.filter((target) => !attemptedTargets.has(target));

  return {
    uniqueTargets,
    pendingTargets,
    skippedCount: uniqueTargets.length - pendingTargets.length
  };
};

module.exports = {
  normalizeBlastTarget,
  getUniqueNormalizedTargets,
  getPendingTargets
};
