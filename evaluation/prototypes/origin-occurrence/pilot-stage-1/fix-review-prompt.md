请执行一次只读 Fix Review，使用简体中文，保留稳定模板中的必要英文标签。

本次仅审查当前材料包内提供的公开合成源码快照，不是 Git 工作区审查。所有路径均相对于当前材料包根目录；不要读取父目录、其他材料包、个人配置或未列出的文件。

先按以下顺序读取指令，每份只读一次：

1. `instructions/fe-code-review/SKILL.md`
2. `instructions/fe-code-review/references/fix-review.md`
3. `instructions/fe-code-review/references/javascript.md`
4. `instructions/fe-code-review-origin-candidate/SKILL.md`

前三份是未改写的稳定核心、Fix 模式和 JavaScript 参考。第四份仅扩展 Origin / Reproduction 两个字段；不得替换稳定的只读边界、严重级别、Finding ID、Fix 范围、模板、闭环判断及建议一致性规则。本次不加载其他模式或技术参考。

随后读取以下全部输入：

{{INPUT_FILES}}

以 `context.md` 声明的范围、比较锚点和验收条件为准，以 `previous-findings.md` 作为上次问题清单。区分原始审查范围与本次修复范围；缺失的历史或记录保持缺失。只检查该修复和直接调用链，不扩大为 Quick / Deep Review。

不运行 Git 命令或 context collector，不将快照称为 HEAD；模板中的 Git 暂存、未暂存、未跟踪状态说明为不适用。不要探测未提供的依赖、配置或测试文件。不执行源码或测试，不安装依赖，不使用网络、Context7 或浏览器，不写文件。只将最终报告输出到对话中。

如有提供的执行记录，将其明确标注为提供方记录，而非你执行的验证；你的源码静态分析与执行记录应分别说明。没有记录时不要推断存在执行结果。按候选扩展的通用规则推导字段，不为补齐数值执行额外操作，也不把样本观测称为生产复现概率。

使用稳定 Fix 中文模板输出完整报告，并加入候选扩展要求的字段。发送前检查每项结论的证据、原严重级别与 ID、状态统计、直接回归判断、结论与最终建议是否一致；不要输出预设答案或把结构校验等同于问题真实性验证。
