import { parseGitStatusInventory } from '../file-coverage.mjs';

// Public synthetic source only. Expected answers live in runtime-oracles.json.
const urlBaseline = `export function requestUrl(base, route) {
  return base.replace(/\\/+$/, '') + '/' + route.replace(/^\\/+/, '');
}
`;
const urlIndex = `export function requestUrl(base, pathname) {
  return base.replace(/\\/+$/, '') + '/' + pathname.replace(/^\\/+/, '');
}
`;
const urlProblem = `export function requestUrl(base, pathname) {
  return base + pathname;
}
`;
const label = `export function displayName(user) {
  return user.displayName.trim() || user.username.trim() || 'Anonymous';
}
`;
const profileCaller = `export function profileUrl(requestUrl, base, generatedPath) {
  return requestUrl(base, generatedPath);
}
`;
const session = `let activeToken = '';
export function setToken(token) { activeToken = token; }
export function getToken() { return activeToken; }
`;
const profile = (accept) => `import { getToken } from './auth/session.mjs';
export async function loadProfile(fetcher) {
  const token = getToken();
  if (!token) return null;
  return fetcher('/profile', { headers: { Authorization: token${accept ? ", Accept: 'application/json'" : ''} } });
}
`;

function fixture(id, mode, status, snapshots, support, files, context) {
  const inventory = parseGitStatusInventory(status, {
    scopeKey: `${id}:declared-packet`, baseline: `${id}:baseline`, enumerationComplete: true,
  });
  return {
    id, mode, inventory, files: { ...files, 'context.md': context.trim() + '\n' },
    packet: {
      kind: 'public-synthetic-comparison-packet', id, mode,
      scope: 'Only the declared packet, not the repository hosting it.',
      comparison: { baseline: inventory.baseline, target: `${id}:target`,
        ...(mode === 'fix' ? { originalBaseline: `${id}:original`, originalProblem: inventory.baseline } : {}) },
      inventory,
      snapshots,
      support,
      context: 'context.md',
      executionEvidence: 'Not supplied. Static review only; do not execute source or infer observations from preparation.',
      layerMeaning: 'Declared synthetic index/worktree snapshots, not Git status from a live repository. Reused material paths have identical bytes.',
    },
  };
}

export function fileCoverageRuntimeFixtures() {
  return [
    fixture('FC-Q-001', 'quick', 'MM src/url.mjs\0R  src/label.mjs\0src/name.mjs\0 M src/generated-path.mjs\0D  src/legacy-debug.mjs\0', [
      { path: 'src/url.mjs', before: 'before/src/url.mjs', index: 'index/src/url.mjs', after: 'after/src/url.mjs' },
      { path: 'src/label.mjs', oldPath: 'src/name.mjs', before: 'before/src/name.mjs', index: 'after/src/label.mjs', after: 'after/src/label.mjs' },
      { path: 'src/generated-path.mjs', type: 'generated', before: 'before/src/generated-path.mjs', index: 'before/src/generated-path.mjs', after: 'after/src/generated-path.mjs' },
      { path: 'src/legacy-debug.mjs', before: 'before/src/legacy-debug.mjs', index: null, after: null, absence: 'Deleted in the index and target, not missing delivery.' },
    ], ['support/profile-caller.mjs', 'support/path-generator.mjs'], {
      'before/src/url.mjs': urlBaseline,
      'index/src/url.mjs': urlIndex,
      'after/src/url.mjs': urlProblem,
      'before/src/name.mjs': label,
      'after/src/label.mjs': label,
      'before/src/generated-path.mjs': "export const profilePath = 'profile';\n",
      'after/src/generated-path.mjs': "export const profilePath = '/profile';\n",
      'before/src/legacy-debug.mjs': "export const legacyDebugTag = 'unused-preview';\n",
      'support/profile-caller.mjs': profileCaller,
      'support/path-generator.mjs': "export function generateProfilePath() { return '/profile'; }\n",
    }, `
# Public Synthetic URL Change

请执行 Quick Review，使用简体中文。范围仅为 packet.json 声明的四个逻辑变更路径；before、index、after 是材料路径，不是三个独立文件变更。

意图：URL helper 参数命名调整；name 模块改名为 label；生成器将 profile 相对路径统一加前导斜线；删除未使用的调试常量。HEAD 概念对应 packet 的 baseline，staged 对应 before 到 index，unstaged 对应 index 到 after。

URL 契约：base 是非空 HTTPS origin，可有或没有末尾斜线；route 是 profile 相对路径，可有或没有前导斜线。调用方支持这四种组合，结果必须是 origin 后一个斜线再接 profile，查询串必须保留。没有生产账号或在线环境。

support/profile-caller.mjs 是唯一 URL 消费者，字节未变，由模块装配传入 helper 和生成路径。support/path-generator.mjs 产出当前生成文件；旧生成路径也是合法输入。无构建脚本或其他依赖。

name/label 模块由按文件路径绑定的演示入口载入，重命名时入口映射已同步；其调用输入保证 displayName 和 username 为字符串。legacyDebugTag 没有导入者、外部消费者或副作用，删除不影响公开契约。本材料声明这些边界，不代表任何真实项目全仓结论。
`),
    fixture('FC-D-001', 'deep', ' M src/auth/session.mjs\0 M src/profile.mjs\0', [
      { path: 'src/auth/session.mjs', before: 'before/src/auth/session.mjs', index: 'before/src/auth/session.mjs', after: null,
        absence: 'Target source was not delivered. This path is changed, not deleted. Its implementation is unknown.' },
      { path: 'src/profile.mjs', before: 'before/src/profile.mjs', index: 'before/src/profile.mjs', after: 'after/src/profile.mjs' },
    ], [], {
      'before/src/auth/session.mjs': session,
      'before/src/profile.mjs': profile(false),
      'after/src/profile.mjs': profile(true),
    }, `
# Public Synthetic Auth Change

请执行 Deep Review，使用简体中文。比较范围为 packet.json 声明的两个逻辑变更路径；清单完整，但 session 的目标实现没有随材料交付。不要搜索宿主仓库或猜测未交付源码。

意图：调整认证 session 内部实现，并为 profile 请求增加 JSON Accept header。当前接口要求 getToken() 返回当前账号 token；退出后返回空字符串，切换账号后返回新 token。返回空值时 loadProfile 不应发请求；非空时应保持原 Authorization 字节。

fetcher 是注入的演示依赖，接受既有 Authorization 和新增 Accept header；没有网络重试、持久化缓存或其他消费者。profile 源码已完整提供，session 的目标源码缺失，不能由调用方推断其内部实现。未提供运行记录或真实账户。
`),
    fixture('FC-F-001', 'fix', ' M src/url.mjs\0', [
      { path: 'src/url.mjs', original: 'original/src/url.mjs', before: 'before/src/url.mjs', index: 'before/src/url.mjs', after: 'after/src/url.mjs' },
    ], ['support/profile-caller.mjs', 'previous-findings.md'], {
      'original/src/url.mjs': urlBaseline,
      'before/src/url.mjs': urlProblem,
      'after/src/url.mjs': urlIndex,
      'support/profile-caller.mjs': profileCaller,
      'previous-findings.md': `# Previous Review

- [F-007] [src/url.mjs:2] URL separator normalization was removed
  - Severity: Risk
  - Origin: New - original/src/url.mjs normalizes both boundary separators; before/src/url.mjs concatenates directly.
  - Reproduction: Not Run - static inspection only; no runtime trials are supplied.
  - Trigger: supported base and route slash combinations.
  - Impact: duplicate or missing separator can produce the wrong endpoint.
  - Acceptance: restore exactly one boundary slash for all four supported combinations, preserving HTTPS origin and the route query string within the same owner. Static source and direct-caller comparison are sufficient for this fixture's closure; browser/runtime evidence is not a prerequisite.
`,
    }, `
# Public Synthetic URL Fix

请执行 Fix Review，使用简体中文。仅回审 previous-findings.md 的既有问题及修复直接相关的回归。原始变更是 original 到 before，本次修复是 before 到 after；不要将原始功能范围与本次修复范围混为一谈。

URL 契约：base 是非空 HTTPS origin，可有或没有末尾斜线；route 为 profile 相对路径，可有或没有前导斜线，可能含查询串。唯一直接调用方是字节未变的 support/profile-caller.mjs，四种边界组合均受支持。未提供运行结果，不执行代码。previous-findings.md 的验收标准决定是否可关闭。
`),
  ];
}
