---
name: auto-model-switcher
description: 自动在免费模型间切换，当当前模型不可用时智能选择最佳替代模型
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: utility
  version: 1.0.0
---

## 功能说明

这个技能会自动监控OpenCode中使用的模型的可用性，并在检测到问题时自动切换到评价最好的免费模型。

**核心特性**：
- 实时监控模型健康状态（可用性、响应速度、错误率）
- 基于综合评分的智能模型选择
- 故障自动切换，无缝继续工作
- 防止频繁切换的冷却机制
- 状态持久化，重启后恢复

## 配置

技能会自动加载并开始工作。你可以在配置文件中自定义：

```jsonc
{
  "autoModelSwitcher": {
    "enabled": true,
    "freeModels": [
      "openai/gpt-4o-mini",
      "anthropic/claude-haiku-3-5",
      "google/gemini-flash-1.5"
    ],
    "weights": {
      "availability": 0.4,    // 可用性权重
      "latency": 0.3,        // 响应速度权重
      "stability": 0.2,      // 稳定性权重
      "rating": 0.1          // 基准评分权重
    },
    "thresholds": {
      "maxConsecutiveFailures": 3,
      "maxFailureRate": 0.2,
      "latencyMultiplier": 2.0,
      "cooldownMinutes": 30
    }
  }
}
```

## 工作原理

1. **监控**：记录每个模型的调用结果（成功/失败、延迟、错误类型）
2. **评分**：每5分钟计算一次综合评分
3. **切换**：当模型故障或表现不佳时，自动选择评分最高的可用模型
4. **稳定**：新模型有5次调用的稳定观察期，期间不再次切换

## 状态文件

技能状态保存在：
- Windows: `%APPDATA%\opencode\auto-switcher-state.json`
- Linux/Mac: `~/.config/opencode/auto-switcher-state.json`

包含：模型评分、历史调用记录、当前活跃模型、冷却时间等。

## 何时使用

当你：
- 使用免费模型但经常遇到速率限制
- 希望自动优化模型选择以获得最佳体验
- 不想手动处理模型故障

不需要任何操作，技能会自动工作。查看日志了解切换决策。
