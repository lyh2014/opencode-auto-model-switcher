#!/usr/bin/env node

/**
 * Auto Model Switcher - 安装脚本
 * 自动检测OpenCode配置目录并安装技能
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getConfigDir() {
  if (process.platform === 'win32') {
    return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  }
  return path.join(os.homedir(), '.config');
}

function getSkillsDir() {
  return path.join(getConfigDir(), 'opencode', 'skills');
}

function getConfigFile() {
  return path.join(getConfigDir(), 'opencode', 'opencode.json');
}

async function install() {
  log('\n🚀 Auto Model Switcher 安装程序\n', 'cyan');

  const sourceDir = __dirname;
  const skillsDir = getSkillsDir();
  const targetDir = path.join(skillsDir, 'auto-model-switcher');

  // 1. 检查技能目录
  log('📁 检查技能目录...', 'blue');
  if (!fs.existsSync(skillsDir)) {
    log('创建技能目录: ' + skillsDir, 'yellow');
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  // 2. 复制技能文件
  log('📋 复制技能文件...', 'blue');
  if (fs.existsSync(targetDir)) {
    log('技能已存在，跳过复制', 'yellow');
  } else {
    fs.cpSync(sourceDir, targetDir, { recursive: true });
    log('已复制到: ' + targetDir, 'green');
  }

  // 3. 配置模型列表（可选）
  log('\n⚙️  检查配置文件...', 'blue');
  const configFile = getConfigFile();
  if (!fs.existsSync(configFile)) {
    log('未找到OpenCode配置文件，将在首次运行时自动创建', 'yellow');
  } else {
    try {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      if (!config.autoModelSwitcher) {
        log('添加自动模型切换器配置到 opencode.json', 'green');

        // 获取用户选择的免费模型
        const freeModels = [
          'openai/gpt-4o-mini',
          'anthropic/claude-haiku-3-5-20241022',
          'google/gemini-flash-1.5',
          'openai/gpt-3.5-turbo',
          'anthropic/claude-3-haiku-20240307',
          'meta-llama/llama-3.2-3b-instruct'
        ];

        config.autoModelSwitcher = {
          enabled: true,
          freeModels: freeModels,
          weights: {
            availability: 0.4,
            latency: 0.3,
            stability: 0.2,
            rating: 0.1
          },
          thresholds: {
            maxConsecutiveFailures: 3,
            maxFailureRate: 0.2,
            latencyMultiplier: 2.0,
            cooldownMinutes: 30
          }
        };

        fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n');
        log('配置已更新！', 'green');
      } else {
        log('配置已存在，跳过', 'green');
      }
    } catch (e) {
      log('配置文件解析失败: ' + e.message, 'red');
    }
  }

  // 4. 验证安装
  log('\n✅ 安装完成！\n', 'green');
  log('下一步:', 'cyan');
  log('1. 重启 OpenCode', 'reset');
  log('2. 或运行: opencode --restart\n', 'reset');

  log('配置文件位置:', 'blue');
  log('  ' + configFile + '\n', 'reset');

  log('技能目录:', 'blue');
  log('  ' + targetDir + '\n', 'reset');

  log('状态文件:', 'blue');
  log('  ' + path.join(getConfigDir(), 'opencode', 'auto-switcher-state.json') + '\n', 'reset');

  log('🔧 可自定义配置:', 'yellow');
  log('编辑 opencode.json 中的 autoModelSwitcher 部分以调整:', 'reset');
  log('  - freeModels: 要监控的免费模型列表', 'reset');
  log('  - weights: 各维度评分权重', 'reset');
  log('  - thresholds: 切换触发阈值\n', 'reset');

  log('💡 调试:', 'yellow');
  log('查看日志: DEBUG=autoswitcher opencode', 'reset');
  log('重置状态: opencode skill run auto-model-switcher:reset\n', 'reset');
}

// 运行安装
install().catch(err => {
  log('安装失败: ' + err.message, 'red');
  process.exit(1);
});
