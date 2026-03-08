# Auto Model Switcher - 快速开始

## 🎯 功能概览

自动在OpenCode的免费模型间智能切换，确保AI对话的连续性。

**核心特性**：
- ✅ 实时监控6个免费模型（可自定义）
- ✅ 智能评分：可用性（40%）+ 速度（30%）+ 稳定性（20%）
- ✅ 自动故障切换：连续3次失败或5分钟失败率>20%
- ✅ 冷却机制：30分钟冷却期，防止抖动
- ✅ 状态持久化：重启后恢复评分历史

## 📦 安装

### 方式1：运行安装脚本（推荐）

```bash
cd "%APPDATA%\opencode\skills\auto-model-switcher"
node install.js
```

### 方式2：手动复制

```powershell
# 复制整个文件夹
Copy-Item -Recurse -Force .\ "%APPDATA%\opencode\skills\auto-model-switcher\"
```

### 方式3：直接使用

无需安装！只需将 `auto-model-switcher` 文件夹复制到 OpenCode的skills目录即可。

## 🔧 配置

技能会自动创建默认配置。如需自定义，编辑：
```
%APPDATA%\opencode\opencode.json
```

添加或修改 `autoModelSwitcher` 部分：

```jsonc
{
  "autoModelSwitcher": {
    "enabled": true,
    "freeModels": [
      "openai/gpt-4o-mini",
      "anthropic/claude-haiku-3-5-20241022",
      "google/gemini-flash-1.5"
    ],
    "weights": {
      "availability": 0.4,  // 可用性权重
      "latency": 0.3,      // 响应速度权重
      "stability": 0.2,    // 稳定性权重
      "rating": 0.1        // 基准评分权重
    },
    "thresholds": {
      "maxConsecutiveFailures": 3,    // 连续失败阈值
      "maxFailureRate": 0.2,          // 5分钟内失败率阈值
      "latencyMultiplier": 2.0,       // 延迟倍数阈值
      "cooldownMinutes": 30           // 冷却时间
    }
  }
}
```

## 🚀 启动

1. 重启OpenCode：
```bash
opencode --restart
```

2. 验证安装：
```bash
opencode skill list
```
应看到 `auto-model-switcher` 在列表中。

3. 开始使用
无需任何操作！技能会自动：
- 监控配置的免费模型
- 记录每次调用的表现
- 在故障时自动切换
- 持续优化模型选择

## 📊 查看状态

### 查看技能状态
```bash
opencode skill run auto-model-switcher:getStatus
```

### 查看详细日志
```bash
# Windows PowerShell
$env:DEBUG="autoswitcher"; opencode

# 或查看OpenCode日志文件
```

### 重置技能（清除所有历史）
```bash
opencode skill run auto-model-switcher:reset
```

## 🧪 测试

运行测试套件验证功能：
```bash
cd "%APPDATA%\opencode\skills\auto-model-switcher"
node test.js
```

预期输出：
```
🎉 全部通过！
📊 结果: 12 通过, 0 失败
```

## 📈 工作原理

```
┌─────────────┐
│ 模型调用    │◄─── OpenCode 调用模型
└──────┬──────┘
       │ 记录成功/失败、延迟
       ▼
┌─────────────┐
│ ModelManager│ 管理模型状态和评分
└──────┬──────┘
       │ 每5分钟更新评分
       ▼
┌─────────────┐
│ 评分算法    │ 可用性×40% + 延迟×30% + 稳定性×20%
└──────┬──────┘
       │ 检查是否需要切换
       ▼
┌─────────────┐
│ 决策引擎    │ 连续失败>3？失败率>20%？延迟过高？
└──────┬──────┘
       │ 是 → 选择最佳模型
       ▼
┌─────────────┐
│ 无缝切换    │ 设置冷却期，避免抖动
└─────────────┘
```

## 🔍 故障排除

### 技能不显示？
```bash
# 1. 检查目录结构
dir "%APPDATA%\opencode\skills\auto-model-switcher"

# 应包含：
# - SKILL.md
# - switcher.js
# - README.md
# - test.js
# - install.js

# 2. 检查配置文件
type "%APPDATA%\opencode\opencode.json" | findstr autoModelSwitcher
```

### 频繁切换？
```jsonc
{
  "autoModelSwitcher": {
    "thresholds": {
      "maxConsecutiveFailures": 5,   // 从3改为5
      "cooldownMinutes": 60         // 从30改为60
    }
  }
}
```

### 评分不变化？
- 确保模型有足够调用次数（<5次使用简化评分）
- 检查日志：`DEBUG=autoswitcher opencode`
- 重置状态：`opencode skill run auto-model-switcher:reset`

### 无法找到免费模型？
查看最新免费模型列表：
- https://openrouter.ai/collections/free-models
- 更新配置中的 `freeModels` 数组

## 📝 文件位置

| 文件 | 路径 |
|------|------|
| 技能目录 | `%APPDATA%\opencode\skills\auto-model-switcher\` |
| 配置文件 | `%APPDATA%\opencode\opencode.json` |
| 状态文件 | `%APPDATA%\opencode\auto-switcher-state.json` |
| 安装脚本 | `%APPDATA%\opencode\skills\auto-model-switcher\install.js` |

## 📖 详细文档

完整文档见 `README.md` 或：
https://github.com/lyh2014/opencode-auto-model-switcher#readme

## ⚡ 性能指标

- 内存占用：~5MB
- CPU使用：<1%（后台监控）
- 状态文件大小：<10KB（1000条调用记录）
- 切换延迟：<100ms（内存计算）

## 🎉 开始使用

安装完成后，无需任何操作！技能会自动工作。只需打开OpenCode，它会：

1. **初始化**：加载配置，准备监控6个模型
2. **学习**：记录每次调用的表现
3. **优化**：基于实时数据计算评分
4. **切换**：检测到问题自动切换到最佳模型
5. **稳定**：冷却机制防止频繁切换

享受无中断的AI体验！🚀

---

问题？提Issue：https://github.com/lyh2014/opencode-auto-model-switcher/issues
