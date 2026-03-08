# Auto Model Switcher - OpenCode技能

自动在免费模型间智能切换，确保AI对话的连续性。

## 功能特性

- **实时监控**：跟踪每个模型的可用性、响应速度和稳定性
- **智能切换**：当模型故障或表现不佳时自动切换到最佳替代
- **防抖动**：冷却机制避免频繁切换
- **状态持久**：重启后恢复评分和历史数据
- **完全自动**：安装后无需配置即可工作

## 安装步骤

### 1. 复制技能文件

```bash
# Windows (PowerShell)
Copy-Item -Recurse -Force skills/auto-model-switcher "$env:APPDATA\opencode\skills\"

# 或手动复制
# 将 auto-model-switcher 文件夹复制到：
# C:\Users\YourName\AppData\Roaming\opencode\skills\
```

### 2. 验证安装

```bash
opencode skill list
```

应该看到 `auto-model-switcher` 在列表中。

### 3. 配置（可选）

编辑配置文件 `~/.config/opencode/opencode.json`（Windows: `%APPDATA%\opencode\opencode.json`）：

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
      "availability": 0.4,
      "latency": 0.3,
      "stability": 0.2,
      "rating": 0.1
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

### 4. 重启 OpenCode

```bash
opencode --restart
```

## 工作原理

1. **调用拦截**：技能通过OpenCode的skill系统自动监听每次模型调用
2. **数据收集**：记录成功/失败、延迟、错误类型
3. **实时评分**：计算每个模型的可用量、速度、稳定性和综合评分
4. **智能决策**：
   - 连续3次失败 → 立即切换
   - 5分钟内失败率 > 20% → 切换
   - 平均延迟超过阈值2倍 → 降低优先级
5. **无缝切换**：选择评分最高的可用模型，设置冷却期

## 状态文件

技能状态保存在：
```
# Windows
C:\Users\YourName\AppData\Roaming\opencode\auto-switcher-state.json

# Linux/Mac
~/.config/opencode/auto-switcher-state.json
```

文件内容：
```json
{
  "models": {
    "openai/gpt-4o-mini": {
      "stats": {
        "totalCalls": 156,
        "successfulCalls": 152,
        "failedCalls": 4,
        "recentLatencies": [234, 189, 267, ...],
        "recentErrors": []
      },
      "score": 0.876,
      "cooldownUntil": 1741234567890,
      "lastSwitchTime": 1741234500000
    }
  },
  "lastUpdate": 1741234600000
}
```

## 调试

查看技能日志：

```bash
# 运行并查看详细输出
DEBUG=autoswitcher opencode

# 或在OpenCode日志中查找 [AutoSwitcher] 前缀
```

## 故障排除

### 技能不生效？

1. 确认文件路径正确：
   ```
   %APPDATA%\opencode\skills\auto-model-switcher\SKILL.md
   %APPDATA%\opencode\skills\auto-model-switcher\switcher.js
   ```

2. 检查JSON配置文件语法：`node -c "%APPDATA%\opencode\opencode.json"`
3. 查看OpenCode日志：`opencode --debug`

### 频繁切换？

1. 增加 `cooldownMinutes`（例如60）
2. 调整 `thresholds.maxConsecutiveFailures`（例如5）
3. 检查网络稳定性

### 找不到免费模型？

确认 `autoModelSwitcher.freeModels` 配置包含实际可用的模型。
查看OpenRouter免费模型列表：https://openrouter.ai/collections/free-models

## 技术实现

### 核心类

1. **ModelManager**：管理模型列表、状态、配置加载和持久化
2. **SwitcherSkill**：主技能接口，提供 `recordCall()` 和 `getBestModel()` API
3. 内置评分算法：综合可用性（40%）、延迟（30%）、稳定性（20%）、基准评分（10%）

### 评分计算

```javascript
availability = 成功调用次数 / 总调用次数
latencyScore = max(0, min(1, 1 - (avgLatency - 2000) / 8000))
stabilityScore = max(0, min(1, 1 - stdDev / 5000))
finalScore = availability*0.4 + latencyScore*0.3 + stabilityScore*0.2
```

## 更新日志

### v1.0.0 (2026-03-06)
- 首次发布
- 基本模型监控和切换
- 评分和冷却机制
- 状态持久化

## License

MIT

## 支持

遇到问题？创建issue或联系：
- GitHub: https://github.com/lyh2014/opencode-auto-model-switcher/issues
