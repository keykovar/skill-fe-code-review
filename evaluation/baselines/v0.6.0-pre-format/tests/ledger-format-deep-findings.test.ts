import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import * as before from '../evaluation/prototypes/ledger-format-deep-findings/packet/before/src/options.mjs';
import * as after from '../evaluation/prototypes/ledger-format-deep-findings/packet/after/src/options.mjs';
import { createLoaders } from '../evaluation/prototypes/ledger-format-deep-findings/packet/support/src/loaders.mjs';
import { buildLedgerFormatSkill } from '../evaluation/prototypes/build-ledger-format-skill.mjs';
import { buildBoundedReviewMaterials, verifyBoundedReviewMaterials } from '../evaluation/prototypes/bounded-review-materials.mjs';
import { prepareLedgerFormatDeepFindings, verifyLedgerFormatDeepFindings } from '../evaluation/prototypes/prepare-ledger-format-deep-findings.mjs';
import { validateReviewOutput } from '../scripts/validate-review-output.mjs';

const root = process.cwd();
const fixture = path.join(root, 'evaluation/prototypes/ledger-format-deep-findings');
const read = (name: string) => fs.readFileSync(path.join(fixture,name),'utf8');
const oracle = JSON.parse(read('oracle.json'));
const report = read('authored-report.zh-CN.md');
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'fe-deep-findings-'));
const candidate = buildLedgerFormatSkill(path.join(temp,'candidate'));
const candidateDigest = createHash('sha256').update(fs.readFileSync(path.join(candidate.output,'manifest.json'))).digest('hex');
const prepare = (name: string) => prepareLedgerFormatDeepFindings({output:path.join(temp,name),candidateBundle:candidate.output,candidateManifestSha256:candidateDigest});
afterAll(() => fs.rmSync(temp,{recursive:true,force:true}));
const fetcher = (url: string, options: object) => ({url,options});
const outcomes = (options: typeof before) => {
  const loaders = createLoaders(fetcher,options);
  return [loaders.loadProfile(),loaders.loadActivity(),loaders.listInbox()];
};
const expected = [
  {url:'/profile',options:{timeoutMs:1500}},
  {url:'/activity',options:{timeoutMs:8000}},
  {url:'/inbox',options:{limit:20}},
];
const broken = [
  {url:'/profile',options:{timeoutMs:30000}},
  {url:'/activity',options:{timeoutMs:30000}},
  {url:'/inbox',options:{limit:50}},
];
const inspect = (text: string) => validateReviewOutput(text,'deep',{profile:'v0.6.0'});
const prerequisite = '进入下一步的前置条件：恢复 timeoutMs 与 pageSize 的参数传递，并验证声明的输入值及三个直接调用方的结果。';

// These assertions apply only to this authored report and its deliberate mutations.
// Free-form runtime reports still need source-grounded manual adjudication.
function authoredControlErrors(text: string) {
  const result=inspect(text);
  const errors=result.valid?[]:['structure'];
  if(JSON.stringify(result.findings.map((f: any)=>f.id))!==JSON.stringify(oracle.expectedFindings.map((f: any)=>f.id))) errors.push('independent-findings');
  for(const finding of result.findings){
    const expected=oracle.expectedFindings.find((f: any)=>f.id===finding.id);
    if(!expected)continue;
    if(finding.severity!==expected.severity)errors.push('severity');
    if(finding.origin?.state!==expected.origin)errors.push('origin');
    if(!finding.reproduction?.length||finding.reproduction.some((entry: any)=>entry.state!==expected.reproduction))errors.push('reproduction');
    if(!text.split('\n')[finding.line-1].includes(`[${expected.path}:${expected.line}]`))errors.push('location');
  }
  if(text.split(prerequisite).length!==3)errors.push('prerequisites');
  const final=text.split('## 最终建议\n')[1];
  if(!final?.includes('修改后可以进入下一步。'))errors.push('recommendation');
  return errors;
}

describe('LF-D-002 independent public source contracts', () => {
  test('baseline preserves all direct consumers and target changes the three actual outputs', () => {
    expect(outcomes(before)).toEqual(expected);
    expect(outcomes(after)).toEqual(broken);
  });
  test.each([1500,8000,30000])('compares the declared timeout value %i without invented inputs', value => {
    expect(before.requestOptions(value)).toEqual({timeoutMs:value});
    expect(after.requestOptions(value)).toEqual({timeoutMs:30000});
  });
  test.each([20,50])('compares the declared pagination value %i', value => {
    expect(before.pageOptions(value)).toEqual({limit:value});
    expect(after.pageOptions(value)).toEqual({limit:50});
  });
  test('one timeout-owner repair fixes both consumers while pagination remains broken', () => {
    expect(outcomes({...after,requestOptions:before.requestOptions})).toEqual([expected[0],expected[1],broken[2]]);
  });
  test('pagination-only repair leaves both timeout consumers broken', () => {
    expect(outcomes({...after,pageOptions:before.pageOptions})).toEqual([broken[0],broken[1],expected[2]]);
  });
  test('two independent local repairs restore the complete declared contract', () => {
    expect(outcomes({...after,requestOptions:before.requestOptions,pageOptions:before.pageOptions})).toEqual(expected);
  });
  test('fetcher result identity passes through each direct consumer unchanged', () => {
    const token={kind:'public-synthetic-result'};
    const loaders=createLoaders(()=>token,before);
    expect(loaders.loadProfile()).toBe(token);
    expect(loaders.loadActivity()).toBe(token);
    expect(loaders.listInbox()).toBe(token);
  });
});

describe('LF-D-002 authored report controls', () => {
  test('accepts two Risk/New/Not Run findings with five outcome entries and a justified repeated ID', () => {
    const result=inspect(report);
    expect(result.valid).toBe(true);
    expect(result.raw.coverageLedgerEntries).toBe(5);
    expect(authoredControlErrors(report)).toEqual([]);
    expect(result.semanticStatus).toBe('Not Evaluated');
  });
  test.each([
    ['Coverage introduction', (text: string)=>text.replace('## Changed-Condition Coverage：变更条件覆盖\n','## Changed-Condition Coverage：变更条件覆盖\n\n以下为静态推演。\n')],
    ['inconsistent merge key', (text: string)=>text.replace('8000 -> 30000; Disposition: [F-001]; Merge key: restore-timeout-parameter','8000 -> 30000; Disposition: [F-001]; Merge key: other-repair')],
    ['missing repeated merge key', (text: string)=>text.replace('; Merge key: restore-timeout-parameter','')],
    ['key on single ID', (text: string)=>text.replace('20 -> 50; Disposition: [F-002]','20 -> 50; Disposition: [F-002]; Merge key: limit')],
    ['unsupported probability', (text: string)=>text.replace('Not Run - 仅静态推演已交付源码，未提供执行观测。','Not Run - 100% reproduction probability.')],
  ])('unchanged parser rejects %s', (_name,mutate) => {
    expect(inspect((mutate as (text:string)=>string)(report)).valid).toBe(false);
  });
  test('merging independently repairable causes can pass grammar but fails the fixture oracle', () => {
    let merged=report.replace(/- \[F-002\] \[src\/options\.mjs:6\][\s\S]*?(?=### Improve)/u,'');
    merged=merged.replaceAll('[F-002]','[F-001]').replace('20 -> 50; Disposition: [F-001]','20 -> 50; Disposition: [F-001]; Merge key: restore-timeout-parameter');
    expect(inspect(merged).valid).toBe(true);
    expect(authoredControlErrors(merged)).toContain('independent-findings');
  });
  test('grammatically valid invented observations still fail the no-runtime-evidence oracle', () => {
    const changed=report.replace('Not Run - 仅静态推演已交付源码，未提供执行观测。','Observed - 1/1 synthetic executions failed.');
    expect(inspect(changed).valid).toBe(true);
    expect(authoredControlErrors(changed)).toContain('reproduction');
  });
  test('wrong historical attribution fails the New oracle even when field grammar passes', () => {
    const changed=report.replace('New - before 使用 timeoutMs','Retained - before 使用 timeoutMs');
    expect(inspect(changed).valid).toBe(true);
    expect(authoredControlErrors(changed)).toContain('origin');
  });
  test('added final prerequisite is caught by authored control, not claimed as public parser semantics', () => {
    const index=report.lastIndexOf(prerequisite);
    const changed=report.slice(0,index)+report.slice(index).replace(prerequisite,prerequisite.replace('。','，并执行生产压测。'));
    expect(inspect(changed).valid).toBe(true);
    expect(authoredControlErrors(changed)).toContain('prerequisites');
  });
  test('unconditional final approval fails the authored recommendation control', () => {
    const changed=report.replace('## 最终建议\n\n修改后可以进入下一步。','## 最终建议\n\n可以进入下一步。');
    expect(authoredControlErrors(changed)).toContain('recommendation');
  });
  test('a complete grouped outcome row is allowed but cannot count as exercising repeated-ID rendering', () => {
    const first='- [src/options.mjs:2] profile 超时参数传播: 1500 -> 30000; Disposition: [F-001]; Merge key: restore-timeout-parameter';
    const second='- [src/options.mjs:2] activity 超时参数传播: 8000 -> 30000; Disposition: [F-001]; Merge key: restore-timeout-parameter';
    const grouped=report.replace(first+'\n'+second,'- [src/options.mjs:2] 两个直接调用方的超时: profile 1500, activity 8000 -> profile 30000, activity 30000; Disposition: [F-001]');
    expect(inspect(grouped).valid).toBe(true);
    expect(authoredControlErrors(grouped)).toEqual([]);
    expect(grouped.match(/Disposition: \[F-001\]/gu)).toHaveLength(1);
    expect(oracle.coverage.fixedRowCount).toBeNull();
  });
});

describe('LF-D-002 offline delivery freeze', () => {
  test('packages exactly nine source/Skill files without evaluator answers and verifies exact received bytes', () => {
    const built=prepare('valid');
    const verified=verifyLedgerFormatDeepFindings(built.output,built.freezeSha256,candidate.output);
    expect(verified).toMatchObject({status:'Offline Pass',evidenceFiles:9,reads:4,modelInvocations:0,executionAuthorized:false});
    const material=JSON.parse(fs.readFileSync(path.join(built.output,'workspace/materials.json'),'utf8'));
    expect(material.files.map((f:any)=>f.path)).not.toEqual(expect.arrayContaining(['oracle.json','authored-report.zh-CN.md','control/plan.json']));
    expect(material.files.map((f:any)=>f.path)).toHaveLength(9);
    expect(material.batches.every((b:any)=>b.bytes<=20000)).toBe(true);
    const payloads=material.batches.map((b:any)=>fs.readFileSync(path.join(built.output,'workspace',b.path),'utf8'));
    expect(payloads.join('')).not.toContain('evaluator-only-public-synthetic-oracle');
    expect(payloads.join('')).not.toContain('本报告是 evaluator-only 人工格式控制');
    expect(verifyBoundedReviewMaterials(material,payloads).files).toBe(9);
    const launch=fs.readFileSync(path.join(built.output,'control/launch.md'),'utf8');
    expect(launch).not.toContain('F-001');
    expect(launch).not.toContain('F-002');
    expect(launch.match(/max_output_tokens/g)).toHaveLength(9);
    for(const call of built.freeze.run.calls){
      expect(call.input).toContain('// @exec: {"max_output_tokens":20000}');
      expect(call.input).toContain('"login":false');
    }
    const sourceFiles=material.files.filter((f:any)=>f.path.startsWith('packet/'));
    expect(sourceFiles).toHaveLength(5);
  });
  test.each(['missing','extra','reordered','truncated','tampered'])('rejects %s model-visible batch contents locally', name => {
    const bundle=buildBoundedReviewMaterials([{path:'a.txt',text:'a'.repeat(19000)+'\n'},{path:'b.txt',text:'b'.repeat(19000)+'\n'}]);
    let outputs=bundle.batches.map((b:any)=>b.text);
    if(name==='missing')outputs=outputs.slice(1);
    if(name==='extra')outputs.push(outputs[0]);
    if(name==='reordered')outputs.reverse();
    if(name==='truncated')outputs[0]=outputs[0].slice(0,-1);
    if(name==='tampered')outputs[0]=outputs[0].replace('verbatim-review-materials','verbatim-review-materialX');
    expect(()=>verifyBoundedReviewMaterials(bundle,outputs)).toThrow();
  });
  test('rejects a wrong independently supplied candidate digest', () => {
    expect(()=>prepareLedgerFormatDeepFindings({output:path.join(temp,'wrong-digest'),candidateBundle:candidate.output,candidateManifestSha256:'0'.repeat(64)})).toThrow('Candidate digest');
  });
  test('rejects overwrite and overlap with the candidate', () => {
    const built=prepare('once');
    expect(()=>prepare('once')).toThrow('already exists');
    expect(()=>prepareLedgerFormatDeepFindings({output:path.join(candidate.output,'nested'),candidateBundle:candidate.output,candidateManifestSha256:candidateDigest})).toThrow('overlaps');
    expect(()=>verifyLedgerFormatDeepFindings(built.output,'0'.repeat(64),candidate.output)).toThrow('Freeze digest');
  });
  test('rejects output aliases into the formal Skill', () => {
    const alias=path.join(temp,'formal-alias');
    fs.symlinkSync(path.join(root,'skills'),alias);
    expect(()=>prepareLedgerFormatDeepFindings({output:path.join(alias,'forbidden'),candidateBundle:candidate.output,candidateManifestSha256:candidateDigest})).toThrow('overlaps');
  });
  test.each(['payload','oracle','launch','extra-file'])('rejects frozen %s drift', name => {
    const built=prepare('drift-'+name);
    const relative={payload:'workspace/batches/01.json',oracle:'control/oracle.json',launch:'control/launch.md','extra-file':'workspace/extra.md'}[name]!;
    fs.appendFileSync(path.join(built.output,relative),'changed');
    expect(()=>verifyLedgerFormatDeepFindings(built.output,built.freezeSha256,candidate.output)).toThrow();
  });
  test('rejects a candidate-byte change after freezing delivery', () => {
    const copy=path.join(temp,'drift-candidate');
    fs.cpSync(candidate.output,copy,{recursive:true});
    const built=prepareLedgerFormatDeepFindings({output:path.join(temp,'candidate-window'),candidateBundle:copy,candidateManifestSha256:candidateDigest});
    fs.appendFileSync(path.join(copy,'fe-code-review/SKILL.md'),'changed');
    expect(()=>verifyLedgerFormatDeepFindings(built.output,built.freezeSha256,copy)).toThrow('Changed input');
  });
  test('public fixture and candidate metadata preserve execution boundaries', () => {
    const packet=JSON.parse(read('packet/packet.json'));
    expect(packet.executionEvidence).toContain('Not supplied');
    expect(oracle.runtime).toMatchObject({authorized:false,status:'Not Run',maxAttempts:1,elapsedCeilingMs:900000});
    assert.equal(candidateDigest,oracle.candidateManifestSha256);
  });
});
