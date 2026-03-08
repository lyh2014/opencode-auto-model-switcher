# Contributing to Auto Model Switcher

感谢你考虑为 Auto Model Switcher 做贡献！🎉

## 📋 行为准则

本项目遵守 [OpenCode Community Guidelines](https://open-code.ai/community)。请保持尊重和包容。

## 🚀 如何贡献

### 报告 Bug

如果发现bug，请创建 [Issue](https://github.com/lyh2014/opencode-auto-model-switcher/issues)，包含：

1. **Bug描述**：清晰描述问题
2. **复现步骤**：如何重现这个bug
3. **期望行为**：应该发生什么
4. **实际行为**：实际发生了什么
5. **环境信息**：
   - OpenCode版本
   - Node.js版本
   - 操作系统
   - 配置片段（如有）

### 提出新功能

1. 先查看 [Issues](https://github.com/lyh2014/opencode-auto-model-switcher/issues) 是否已有类似建议
2. 创建新issue，描述：
   - **功能用途**：解决什么痛点
   - **实现思路**：建议的实现方式
   - **替代方案**：考虑过的其他方案
3. 等待讨论和反馈
4. 获得维护者认可后开始实现

### 提交Pull Request

#### 开发前准备

```bash
# 1. Fork 本仓库
# 点击 GitHub 右上角 Fork 按钮

# 2. 克隆到本地
git clone https://github.com/lyh2014/opencode-auto-model-switcher.git
cd opencode-auto-model-switcher

# 3. 创建开发分支
git checkout -b feature/YourFeatureName
# 或
git checkout -b fix/BugFixName
```

#### 开发规范

1. **代码风格**
   - 使用 4 空格缩进
   - 遵循现有代码风格
   - 添加必要注释（中文）

2. **测试要求**
   - 新功能必须添加测试
   - 运行 `npm test` 确保所有测试通过
   - 测试覆盖率不降低

3. **提交信息**
   使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

   ```
   feat: 添加模型延迟监控
   fix: 修复评分计算边界情况
   docs: 更新安装说明
   test: 增加切换策略测试
   chore: 更新依赖
   ```

4. **提交前检查**
   ```bash
   # 运行测试
   npm test

   # 检查代码质量
   node -c auto-model-switcher/switcher.js

   # 确保没有调试代码
   git diff --check
   ```

#### 提交PR

1. **推送分支**
   ```bash
   git add .
   git commit -m "feat: 添加XX功能"
   git push origin feature/YourFeatureName
   ```

2. **创建Pull Request**
   - 访问 https://github.com/lyh2014/opencode-auto-model-switcher/pulls
   - 点击 "New pull request"
   - 选择 base: `main`，compare: 你的分支
   - 填写PR模板

3. **PR模板**（GitHub会自动提示填写）

   ```markdown
   ## ✨ 变更说明
   [描述这个PR做了什么]

   ## 🔗 相关Issue
   Closes #123
   Related to #456

   ## 🧪 测试
   - [ ] 添加了测试
   - [ ] 所有测试通过
   - 测试结果: `npm test`

   ## 📝 检查清单
   - [ ] 代码遵循项目风格
   - [ ] 添加了必要的注释
   - [ ] 更新了文档（如需要）
   - [ ] 没有调试代码/console.log
   - [ ] 测试覆盖率未降低

   ## 📸 截图/演示
   [如有UI变更，请添加截图或gif]
   ```

4. **等待审核**
   - 维护者会在2-3天内审核
   - 可能需要修改，请关注反馈
   - 获得至少1个维护者批准后合并

## 🏗️ 项目结构

```
opencode-auto-model-switcher/
├── auto-model-switcher/
│   ├── SKILL.md          # 技能定义
│   ├── switcher.js       # 核心实现
│   ├── test.js          # 测试套件
│   ├── install.js       # 安装脚本
│   ├── README.md        # 技能文档
│   ├── QUICKSTART.md    # 快速开始
│   └── SUMMARY.md       # 项目总结
├── README.md            # 主README
├── package.json         # 项目元数据
├── LICENSE              # MIT License
└── .gitignore          # Git忽略规则
```

## 🧪 运行测试

```bash
# 所有测试
npm test

# 或直接运行
node auto-model-switcher/test.js
```

预期输出：`🎉 全部通过！📊 结果: 12 通过, 0 失败`

## 📖 文档指南

- **README.md** - 项目首页，面向所有用户
- **auto-model-switcher/README.md** - 详细使用文档
- **auto-model-switcher/QUICKSTART.md** - 快速入门
- **auto-model-switcher/SUMMARY.md** - 技术总结

修改文档时：
- 保持中文简洁清晰
- 添加实际示例
- 更新配置说明（如有变更）

## 🔧 开发技巧

### 调试

```bash
# 查看详细日志
DEBUG=autoswitcher node auto-model-switcher/switcher.js

# 或修改代码添加console.log
```

### 状态文件位置

开发时状态文件在：
```
%APPDATA%\opencode\auto-switcher-state.json
```

测试时会自动清理。

### 常见修改点

| 需求 | 文件 | 位置 |
|------|------|------|
| 修改模型列表 | `opencode.json` | `autoModelSwitcher.freeModels` |
| 调整权重 | `switcher.js` | `DEFAULT_CONFIG.weights` |
| 修改阈值 | `switcher.js` | `DEFAULT_CONFIG.thresholds` |
| 更改评分算法 | `switcher.js` | `ModelManager.updateScore()` |

## 📏 代码质量

我们使用以下标准：

- ✅ **无语法错误**：`node -c file.js`
- ✅ **测试通过**：`npm test`
- ✅ **无console.log**（调试信息使用`DEBUG`环境变量）
- ✅ **完整注释**：关键逻辑必须注释
- ✅ **类型安全**：虽然未使用TS，但参数需清晰

## 🎯 发布流程

维护者视角（仅供参考）：

1. 合并所有PR到main分支
2. 更新版本号：`package.json` → `1.0.1`
3. 更新CHANGELOG.md
4. 创建Release和Git标签
5. 推送：`git push && git push --tags`

## ❓ 常见问题

**Q: 如何添加新的免费模型？**
A: 在 `opencode.json` 的 `autoModelSwitcher.freeModels` 数组中添加模型ID。

**Q: 评分算法可以自定义吗？**
A: 可以！修改 `switcher.js` 中 `ModelManager.updateScore()` 方法。

**Q: 如何增加切换阈值？**
A: 修改 `DEFAULT_CONFIG.thresholds` 中的值，或用户在配置中覆盖。

**Q: 支持付费模型吗？**
A: 当前仅针对免费模型优化，但可以添加付费模型到列表（需有API key）。

## 📞 联系方式

- **Issues**: https://github.com/lyh2014/opencode-auto-model-switcher/issues
- **Discussions**: https://github.com/lyh2014/opencode-auto-model-switcher/discussions

## 🙏 致谢

感谢所有为 OpenCode 社区做贡献的开发者们！

---

**Happy Contributing! 🎉**
