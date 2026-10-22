import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBoundedReviewMaterials, verifyBoundedReviewMaterials } from './bounded-review-materials.mjs';
import { buildDeepReadCalls } from './prepare-ledger-format-deep-read-template.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const fixtureRelative = 'evaluation/prototypes/ledger-format-deep-findings';
const fixture = path.join(repository, fixtureRelative);
const selectedSkill = ['SKILL.md', 'references/deep-review.md', 'references/javascript.md', 'references/release-risk.md'];
const packetFiles = ['packet.json', 'context.md', 'before/src/options.mjs', 'after/src/options.mjs', 'support/src/loaders.mjs'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const within = (root, filename) => filename === root || filename.startsWith(root + path.sep);
const pin = (name, bytes) => ({ path: name, bytes: bytes.length, sha256: hash(bytes) });

function read(root, relative) {
  assert.ok(typeof relative === 'string' && !path.isAbsolute(relative) && !/[\\\x00-\x1f\x7f]/u.test(relative));
  assert.ok(relative.split('/').every(part => part && part !== '.' && part !== '..'));
  const filename = path.join(root, relative);
  assert.ok(fs.lstatSync(filename).isFile(), 'Expected regular file: ' + relative);
  assert.ok(within(fs.realpathSync(root), fs.realpathSync(filename)), 'File escapes root: ' + relative);
  return fs.readFileSync(filename);
}

function inventory(root, prefix = '') {
  return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) return inventory(root, relative + '/');
    assert.ok(entry.isFile(), 'Non-regular entry: ' + relative);
    return [relative];
  }).sort();
}

function checkPins(root, pins) {
  for (const item of pins) {
    const bytes = read(root, item.path);
    assert.equal(hash(bytes), item.sha256, 'Changed input: ' + item.path);
    if (item.bytes !== undefined) assert.equal(bytes.length, item.bytes);
  }
}

export function prepareLedgerFormatDeepFindings({ output: requestedOutput, candidateBundle, candidateManifestSha256 }) {
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  const candidateRoot = fs.realpathSync(candidateBundle);
  for (const protectedRoot of [path.join(repository, 'skills'), fixture, candidateRoot]) {
    const canonical = fs.realpathSync(protectedRoot);
    assert.ok(!within(canonical, output) && !within(output, canonical), 'Output overlaps protected input.');
  }
  assert.ok(!fs.existsSync(output), 'Output already exists.');
  const candidateBytes = read(candidateRoot, 'manifest.json');
  assert.equal(hash(candidateBytes), candidateManifestSha256, 'Candidate digest mismatch.');
  const candidate = JSON.parse(candidateBytes);
  assert.equal(candidate.kind, 'offline-ledger-format-skill-candidate');
  assert.equal(candidate.files.length, 12);
  checkPins(candidateRoot, candidate.files);
  checkPins(repository, candidate.sources);
  checkPins(repository, [candidate.recipe]);
  const oracleBytes = read(fixture, 'oracle.json');
  const oracle = JSON.parse(oracleBytes);
  assert.equal(candidateManifestSha256, oracle.candidateManifestSha256);
  const sourcePacket = JSON.parse(read(fixture, 'packet/packet.json'));
  assert.equal(sourcePacket.id, 'LF-D-002');
  assert.equal(sourcePacket.mode, 'deep');
  const evidence = [
    ...selectedSkill.map(name => ({ path: 'skill/' + name, text: read(candidateRoot, 'fe-code-review/' + name).toString('utf8') })),
    ...packetFiles.map(name => ({ path: 'packet/' + name, text: read(fixture, 'packet/' + name).toString('utf8') }))
  ];
  const bundle = buildBoundedReviewMaterials(evidence);
  assert.equal(bundle.batches.length, 3, 'Reassess bounded schedule if material size changes.');
  const materials = { kind: 'public-synthetic-batched-review', caseId: 'LF-D-002', mode: 'deep',
    files: bundle.files, batches: bundle.batches.map(({text, ...entry}) => entry),
    delivery: { maxBatchBytes: bundle.maxPayloadBytes, oneBatchPerToolResponse: true, stopOnTruncation: true } };
  assert.ok(json(materials).length <= bundle.maxPayloadBytes);
  const workspace = path.join(output, 'workspace');
  const calls = buildDeepReadCalls(workspace);
  const launch = [
    '执行一次只读 Deep Review，使用简体中文。审查材料为公开合成 LF-D-002，直接在任务回复报告，不写文件。',
    `唯一工作目录：${workspace}`,
    '唯一材料入口为 materials.json，随后按顺序读取 batches/01.json、batches/02.json、batches/03.json。全部四次调用模板如下，原样执行。',
    '批次保存原始文件路径、物理行范围和完整内容。先读取全部批次，再使用其中的核心 Skill、唯一 Deep reference、JavaScript 和 release-risk reference 审查 packet；不要加载宿主或已安装的任何 Skill。',
    '仅允许下列四次只读工具调用，不增加搜索、补读、重试、源码执行、Git、网络、浏览器或写入。不得读取 control、oracle、人工示例报告、其他窗口或宿主仓库。',
    '任一工具失败、输出截断、批次缺失或工具能力不支持，立即停止并说明；不自动重试。材料明确声明的源码证据缺口应按 Skill 处理，不能当作读取失败，也不能猜测。',
    '两个 max_output_tokens 都必须保留 20000，login 必须为 false。调用模板是指令约束，不是操作系统隔离。',
    ...calls.map(call => `${call.id}: ${call.path}\n\n\`\`\`javascript\n${call.input}\`\`\``)
  ].join('\n\n') + '\n';
  const plan = { caseId: 'LF-D-002', mode: 'deep', candidateManifestSha256,
    status: 'Offline Prepared - Not Run', executionAuthorized: false, modelInvocations: 0, runtimeReady: false,
    purpose: 'Exercise nonempty Deep Findings and justified repeated-ID rendering, separate from File Coverage and efficiency.',
    maxSourceBearingRuns: 1, maxAttempts: 1, automaticRetry: false,
    elapsedCeilingMs: 900000, automaticCancellation: false,
    proposal: {client:'Codex Desktop',model:'gpt-6-astra',effort:'xhigh',provider:'Recheck current user-approved route before a separately authorized dispatch.'},
    output: 'Unedited full final report plus actual calls/returns/usage outside this frozen root.',
    gates: oracle.manualGates,
    repeatedId: oracle.coverage.grouping,
    costAcceptance: 'Not Evaluated; this is not a paired efficiency trial.',
    dispatchPrerequisites: ['Explicit one-task creation authorization.', 'Recheck candidate/material/recipe digests and selected provider route.', 'Use the exact frozen launch text, with one-use dispatch accounting and no extra reviewer startup read.'],
    promotion: 'Not authorized. Formal/installed v0.6.0 and historical failures remain unchanged.' };
  const files = new Map([
    ['workspace/materials.json', json(materials)],
    ...bundle.batches.map(batch => ['workspace/' + batch.path, Buffer.from(batch.text)]),
    ['control/oracle.json', oracleBytes],
    ['control/authored-report.zh-CN.md', read(fixture, 'authored-report.zh-CN.md')],
    ['control/plan.json', json(plan)], ['control/candidate-manifest.json', candidateBytes],
    ['control/read-calls.json', json(calls)], ['control/launch.md', Buffer.from(launch)]
  ]);
  const dependencies = ['evaluation/prototypes/prepare-ledger-format-deep-findings.mjs',
    'evaluation/prototypes/bounded-review-materials.mjs', 'evaluation/prototypes/prepare-ledger-format-deep-read-template.mjs',
    'tests/ledger-format-deep-findings.test.ts',
    ...inventory(fixture).map(name => fixtureRelative + '/' + name)];
  const freeze = { kind: 'offline-ledger-format-deep-findings', candidateManifestSha256,
    inputs: dependencies.map(name => pin(name, read(repository,name))),
    files: [...files].map(([name,bytes]) => pin(name,bytes)),
    run: {caseId:'LF-D-002',mode:'deep',workspace:'workspace',launchPath:'control/launch.md',calls,
      evidenceFiles:bundle.files.length,evidenceBytes:bundle.files.reduce((sum,item)=>sum+item.bytes,0),
      encodedBatchBytes:bundle.batches.reduce((sum,item)=>sum+item.bytes,0),
      manifestBytes:json(materials).length,startupBytes:Buffer.byteLength(launch),
      totalDeliveredContentBytes:json(materials).length+Buffer.byteLength(launch)+bundle.batches.reduce((sum,item)=>sum+item.bytes,0)},
    executionAuthorized:false,modelInvocations:0,sourceTransmitted:false,runtimeReady:false };
  fs.mkdirSync(output,{mode:0o700});
  for(const [relative,bytes] of [...files,['control/freeze.json',json(freeze)]]){
    const filename=path.join(output,relative);
    fs.mkdirSync(path.dirname(filename),{recursive:true});
    fs.writeFileSync(filename,bytes,{flag:'wx',mode:0o600});
  }
  return {output,freeze,freezeSha256:hash(json(freeze))};
}

export function verifyLedgerFormatDeepFindings(output, expectedDigest, candidateBundle) {
  const root=fs.realpathSync(output);
  const bytes=read(root,'control/freeze.json');
  assert.match(expectedDigest??'',/^[a-f0-9]{64}$/u);
  assert.equal(hash(bytes),expectedDigest,'Freeze digest mismatch.');
  const freeze=JSON.parse(bytes);
  assert.equal(freeze.kind,'offline-ledger-format-deep-findings');
  checkPins(repository,freeze.inputs);
  checkPins(root,freeze.files);
  assert.deepEqual(inventory(root),['control/freeze.json',...freeze.files.map(item=>item.path)].sort());
  const candidateBytes=read(candidateBundle,'manifest.json');
  assert.equal(hash(candidateBytes),freeze.candidateManifestSha256);
  assert.ok(candidateBytes.equals(read(root,'control/candidate-manifest.json')));
  const candidate=JSON.parse(candidateBytes);
  checkPins(candidateBundle,candidate.files);
  checkPins(repository,candidate.sources);
  checkPins(repository,[candidate.recipe]);
  const material=JSON.parse(read(root,'workspace/materials.json'));
  const outputs=material.batches.map(item=>read(root,'workspace/'+item.path).toString('utf8'));
  const reconstruction=verifyBoundedReviewMaterials(material,outputs);
  const recovered=new Map();
  for(const output of outputs){
    for(const segment of JSON.parse(output).segments)recovered.set(segment.path,(recovered.get(segment.path)??'')+segment.content);
  }
  const expectedNames=[...selectedSkill.map(name=>'skill/'+name),...packetFiles.map(name=>'packet/'+name)];
  assert.deepEqual(material.files.map(item=>item.path),expectedNames);
  for(const [name,text] of recovered){
    const source=name.startsWith('skill/')?read(candidateBundle,'fe-code-review/'+name.slice(6)):read(fixture,name);
    assert.equal(text,source.toString('utf8'),name);
  }
  assert.deepEqual(freeze.run.calls,buildDeepReadCalls(path.join(root,'workspace')));
  return {status:'Offline Pass',caseId:'LF-D-002',evidenceFiles:reconstruction.files,reads:freeze.run.calls.length,
    freezeSha256:expectedDigest,modelInvocations:0,executionAuthorized:false,runtimeDelivery:'Not Evaluated',reportAcceptance:'Not Evaluated'};
}
