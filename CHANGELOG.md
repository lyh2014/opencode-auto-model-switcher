# Changelog

All notable changes to the "Auto Model Switcher" project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 初始版本完整功能
- 智能模型监控和自动切换
- 支持6个免费模型
- 实时评分算法（可用性40% + 延迟30% + 稳定性20%）
- 冷却机制防止抖动
- 状态持久化
- 完整的测试套件（12个测试）
- 一键安装脚本
- 完整的文档（README + QUICKSTART + SUMMARY）

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- N/A (initial release)

## [1.0.0] - 2026-03-06

### Added
- ✨ 首次正式发布
- 🎯 核心功能完整实现
- 🧪 12个单元测试全部通过
- 📦 完整的安装和配置文档
- 🎨 一键安装脚本
- 📊 性能优化（<1% CPU，~5MB内存）
- 🔒 本地数据存储，无隐私泄露

### Technical Details
- ModelManager：模型状态管理
- SwitcherSkill：主技能接口
- 评分算法：动态计算可用性、延迟、稳定性
- 切换策略：连续失败、失败率、延迟阈值
- 冷却机制：30分钟默认冷却期
- 持久化：JSON状态文件自动保存

---

## Version History Summary

| Version | Release Date | Highlights |
|---------|--------------|------------|
| 1.0.0   | 2026-03-06   | 初始发布，完整功能，100%测试通过 |

---

## Upgrade Guide

### From v1.0.0 to Future Versions
- 更新文件：替换 `auto-model-switcher/` 文件夹
- 状态文件自动迁移（向后兼容）
- 查看具体版本的CHANGELOG条目了解破坏性变更

---

**Note**: Breaking changes will be documented in this changelog with clear migration instructions.
