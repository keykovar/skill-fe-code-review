const coverageHeadings = new Set([
  'Changed-Condition Coverage',
  'Changed-Condition Coverage：变更条件覆盖',
  '变更条件覆盖',
]);

function headingAt(line, index) {
  const match = line.match(/^(#{2,6})\s+(.+?)\s*$/u);
  if (!match) {
    return null;
  }

  return {
    index,
    level: match[1].length,
    text: match[2].replace(/\s+#+$/u, '').trim(),
  };
}

function dispositionFromHeader(line) {
  const finding = line.match(/^-\s+\[(F-\d{3})\]\s*$/u);
  if (finding) {
    return { key: finding[1], type: 'finding' };
  }

  if (/^-\s+Behavior Preserving(?:\s*[:：]\s*行为保持)?\s*$/iu.test(line)) {
    return { key: 'behavior-preserving', type: 'behavior-preserving' };
  }

  if (/^-\s+Cannot Verify(?:\s*[:：]\s*无法验证)?\s*$/iu.test(line)) {
    return { key: 'cannot-verify', type: 'cannot-verify' };
  }

  return null;
}

function inspectGroup(group, errors) {
  if (group.conditions.length === 0) {
    errors.push({ group: group.key, line: group.line, type: 'group-empty' });
  }

  if (group.type !== 'finding' && group.mergeBases.length > 0) {
    errors.push({ group: group.key, line: group.line, type: 'non-finding-merge-basis-forbidden' });
    return;
  }

  if (group.type !== 'finding') {
    return;
  }

  if (group.conditions.length > 1 && group.mergeBases.length !== 1) {
    errors.push({
      actual: group.mergeBases.length,
      expected: 1,
      findingId: group.key,
      line: group.line,
      type: 'multi-condition-merge-basis-count',
    });
  }

  if (group.conditions.length === 1 && group.mergeBases.length > 0) {
    errors.push({
      findingId: group.key,
      line: group.line,
      type: 'single-condition-merge-basis-forbidden',
    });
  }
}

export function validateGroupedLedger(markdown, options = {}) {
  const lines = markdown.replace(/\r\n?/gu, '\n').split('\n');
  const headings = lines
    .map((line, index) => headingAt(line, index))
    .filter((heading) => heading !== null);
  const coverageSections = headings.filter(({ text }) => coverageHeadings.has(text));
  const errors = [];
  const groups = [];

  if (coverageSections.length !== 1) {
    errors.push({
      actual: coverageSections.length,
      expected: 1,
      type: 'coverage-section-count',
    });
    return { conditionCount: 0, errors, findingIds: [], groups, valid: false };
  }

  const section = coverageSections[0];
  if (section.level !== 2) {
    errors.push({ line: section.index + 1, type: 'coverage-section-not-top-level' });
  }

  const nextTopLevel = headings.find(
    ({ index, level }) => index > section.index && level <= section.level,
  );
  const sectionEnd = nextTopLevel?.index ?? lines.length;
  let currentGroup = null;

  const finishGroup = () => {
    if (!currentGroup) {
      return;
    }
    inspectGroup(currentGroup, errors);
    groups.push(currentGroup);
    currentGroup = null;
  };

  for (let index = section.index + 1; index < sectionEnd; index += 1) {
    const line = lines[index];
    if (line.trim() === '') {
      continue;
    }

    if (/^-\s+/u.test(line)) {
      finishGroup();
      const disposition = dispositionFromHeader(line);
      if (!disposition) {
        errors.push({ line: index + 1, type: 'group-header-invalid' });
        continue;
      }
      currentGroup = {
        conditions: [],
        key: disposition.key,
        line: index + 1,
        mergeBases: [],
        type: disposition.type,
      };
      continue;
    }

    if (!currentGroup) {
      errors.push({ line: index + 1, type: 'content-outside-group' });
      continue;
    }

    const mergeBasis = line.match(
      /^  -\s+(?:Merge basis|Merge key|合并依据)\s*[:：]\s*(.*?)\s*$/iu,
    );
    if (mergeBasis) {
      if (!mergeBasis[1]) {
        errors.push({ group: currentGroup.key, line: index + 1, type: 'merge-basis-empty' });
      }
      currentGroup.mergeBases.push({ line: index + 1, value: mergeBasis[1] });
      continue;
    }

    const condition = line.match(
      /^  -\s+(\[[^\]\r\n]+:\d+\](?:\([^\r\n)]+\))?)\s+(.+)$/u,
    );
    if (!condition) {
      errors.push({ group: currentGroup.key, line: index + 1, type: 'group-child-invalid' });
      continue;
    }

    if (!/(?:->|→)/u.test(condition[2])) {
      errors.push({ group: currentGroup.key, line: index + 1, type: 'condition-transition-missing' });
    }

    currentGroup.conditions.push({
      line: index + 1,
      location: condition[1],
      text: condition[2],
    });
  }

  finishGroup();

  if (groups.length === 0) {
    errors.push({ line: section.index + 1, type: 'coverage-section-empty' });
  }

  const groupKeys = groups.map(({ key }) => key);
  const duplicateKeys = [...new Set(groupKeys.filter((key, index) => groupKeys.indexOf(key) !== index))];
  for (const key of duplicateKeys) {
    errors.push({ group: key, type: 'group-duplicate' });
  }

  const findingIds = groups
    .filter(({ type }) => type === 'finding')
    .map(({ key }) => key);
  const expectedOrder = findingIds.map(
    (_, index) => `F-${String(index + 1).padStart(3, '0')}`,
  );
  if (findingIds.some((findingId, index) => findingId !== expectedOrder[index])) {
    errors.push({ actual: findingIds, expected: expectedOrder, type: 'finding-group-order' });
  }

  if (options.expectedFindingIds) {
    const expectedFindingIds = new Set(options.expectedFindingIds);
    const actualFindingIds = new Set(findingIds);
    for (const findingId of actualFindingIds) {
      if (!expectedFindingIds.has(findingId)) {
        errors.push({ findingId, type: 'finding-group-unknown' });
      }
    }
    for (const findingId of expectedFindingIds) {
      if (!actualFindingIds.has(findingId)) {
        errors.push({ findingId, type: 'finding-group-missing' });
      }
    }
  }

  return {
    conditionCount: groups.reduce((count, group) => count + group.conditions.length, 0),
    errors,
    findingIds,
    groups,
    valid: errors.length === 0,
  };
}
