#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// 技能文件路径
const STATE_FILE = path.join(process.env.APPDATA || path.join(os.homedir(), '.config'), 'opencode', 'auto-switcher-state.json');
const CONFIG_FILE = path.join(process.env.APPDATA || path.join(os.homedir(), '.config'), 'opencode', 'opencode.json');

// 默认免费模型列表
const DEFAULT_FREE_MODELS = [
  'openai/gpt-4o-mini',
  'anthropic/claude-haiku-3-5-20241022',
  'google/gemini-flash-1.5',
  'openai/gpt-3.5-turbo',
  'anthropic/claude-3-haiku-20240307',
  'meta-llama/llama-3.2-3b-instruct'
];

// 默认配置
const DEFAULT_CONFIG = {
  enabled: true,
  freeModels: DEFAULT_FREE_MODELS,
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

class ModelManager {
  constructor() {
    this.models = new Map();
    this.config = this.loadConfig();
    this.state = this.loadState();
    this.currentModel = null;
    this.initializeModels();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return deepMerge(DEFAULT_CONFIG, userConfig.autoModelSwitcher || {});
      }
    } catch (e) {
      console.warn('Auto Model Switcher: 配置文件加载失败，使用默认配置');
    }
    return DEFAULT_CONFIG;
  }

  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch (e) {
      console.warn('Auto Model Switcher: 状态文件加载失败，创建新状态');
    }
    return { models: {}, lastUpdate: Date.now() };
  }

  saveState() {
    try {
      const dir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      this.state.lastUpdate = Date.now();
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error('Auto Model Switcher: 保存状态失败', e.message);
    }
  }

  initializeModels() {
    this.config.freeModels.forEach(modelId => {
      if (!this.models.has(modelId)) {
        this.models.set(modelId, {
          id: modelId,
          stats: {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            recentLatencies: [],
            recentErrors: [],
            lastCallTime: null
          },
          score: 1.0,
          cooldownUntil: null,
          lastSwitchTime: null
        });

        if (this.state.models[modelId]) {
          const saved = this.state.models[modelId];
          this.models.get(modelId).stats = deepMerge(this.models.get(modelId).stats, saved.stats || {});
          this.models.get(modelId).score = saved.score || 1.0;
          this.models.get(modelId).cooldownUntil = saved.cooldownUntil || null;
          this.models.get(modelId).lastSwitchTime = saved.lastSwitchTime || null;
        }
      }
    });
  }

  getBestAvailableModel() {
    const now = Date.now();
    const available = [];

    for (const [id, model] of this.models) {
      if (model.cooldownUntil && now < model.cooldownUntil) {
        continue;
      }

      const failureRate = model.stats.totalCalls > 0
        ? model.stats.failedCalls / model.stats.totalCalls
        : 0;

      if (failureRate > 0.8) {
        continue;
      }

      available.push(model);
    }

    if (available.length === 0) {
      return this.selectHighestScoring();
    }

    available.sort((a, b) => b.score - a.score);
    return available[0];
  }

  selectHighestScoring() {
    let best = null;
    let highestScore = -1;

    for (const [id, model] of this.models) {
      if (model.score > highestScore) {
        highestScore = model.score;
        best = model;
      }
    }

    return best;
  }

  recordCall(modelId, success, latency, error = null) {
    const model = this.models.get(modelId);
    if (!model) return;

    model.stats.totalCalls++;
    model.stats.lastCallTime = Date.now();

    if (success) {
      model.stats.successfulCalls++;
      model.stats.recentLatencies.push(latency);
      if (model.stats.recentLatencies.length > 20) {
        model.stats.recentLatencies.shift();
      }
    } else {
      model.stats.failedCalls++;
      model.stats.recentErrors.push({ time: Date.now(), error });
      if (model.stats.recentErrors.length > 10) {
        model.stats.recentErrors.shift();
      }
    }

    this.updateScore(modelId);
    this.state.models[modelId] = {
      stats: model.stats,
      score: model.score,
      cooldownUntil: model.cooldownUntil,
      lastSwitchTime: model.lastSwitchTime
    };
    this.saveState();
  }

  updateScore(modelId) {
    const model = this.models.get(modelId);
    if (!model) return;

    const stats = model.stats;

    // 新模型使用全部分数，调用次数少时逐步调整
    if (stats.totalCalls < 5) {
      // 基于当前表现调整评分，保持较高评分
      const availability = stats.totalCalls > 0 ? stats.successfulCalls / stats.totalCalls : 1.0;
      let latencyScore = 0.5;
      if (stats.recentLatencies.length > 0) {
        const avgLatency = stats.recentLatencies.reduce((a, b) => a + b, 0) / stats.recentLatencies.length;
        latencyScore = Math.max(0, Math.min(1, 1 - (avgLatency - 2000) / 8000));
      }
      model.score = availability * 0.7 + latencyScore * 0.3;
      model.score = Math.max(0.6, model.score); // 保持至少0.6
      return;
    }

    if (stats.totalCalls < 5) {
      model.score = 0.8;
      return;
    }

    const availability = stats.successfulCalls / stats.totalCalls;

    let latencyScore = 0.5;
    if (stats.recentLatencies.length > 0) {
      const avgLatency = stats.recentLatencies.reduce((a, b) => a + b, 0) / stats.recentLatencies.length;
      latencyScore = Math.max(0, Math.min(1, 1 - (avgLatency - 2000) / 8000));
    }

    let stabilityScore = 0.5;
    if (stats.recentLatencies.length >= 3) {
      const avg = stats.recentLatencies.reduce((a, b) => a + b, 0) / stats.recentLatencies.length;
      const variance = stats.recentLatencies.reduce((sum, lat) => sum + Math.pow(lat - avg, 2), 0) / stats.recentLatencies.length;
      const stdDev = Math.sqrt(variance);
      stabilityScore = Math.max(0, Math.min(1, 1 - stdDev / 5000));
    }

    const weights = this.config.weights;
    model.score =
      availability * weights.availability +
      latencyScore * weights.latency +
      stabilityScore * weights.stability;

    model.score = Math.max(0, Math.min(1, model.score));
  }

  shouldSwitch(currentModelId) {
    const current = this.models.get(currentModelId);
    if (!current) return true;

    const stats = current.stats;
    const now = Date.now();

    const recentFailures = stats.recentErrors.filter(e => now - e.time < 300000).length;
    if (recentFailures >= this.config.thresholds.maxConsecutiveFailures) {
      console.log(`[AutoSwitcher] 模型 ${currentModelId} 连续失败 ${recentFailures} 次，触发切换`);
      return true;
    }

    const fiveMinAgo = now - 5 * 60 * 1000;
    const recentCalls = stats.recentErrors.length + stats.recentLatencies.length;
    const recentFailuresCount = stats.recentErrors.filter(e => e.time > fiveMinAgo).length;
    if (recentCalls >= 5 && recentFailuresCount / recentCalls > this.config.thresholds.maxFailureRate) {
      console.log(`[AutoSwitcher] 模型 ${currentModelId} 5分钟内失败率过高 (${recentFailuresCount}/${recentCalls})，触发切换`);
      return true;
    }

    if (stats.recentLatencies.length >= 3) {
      const avgLatency = stats.recentLatencies.reduce((a, b) => a + b, 0) / stats.recentLatencies.length;
      const threshold = 8000;
      if (avgLatency > threshold * this.config.thresholds.latencyMultiplier) {
        console.log(`[AutoSwitcher] 模型 ${currentModelId} 平均延迟过高 (${avgLatency}ms)，触发切换`);
        return true;
      }
    }

    return false;
  }

  setCooldown(modelId, minutes = null) {
    const model = this.models.get(modelId);
    if (!model) return;

    model.cooldownUntil = Date.now() + ((minutes || this.config.thresholds.cooldownMinutes) * 60 * 1000);
    this.state.models[modelId].cooldownUntil = model.cooldownUntil;
    this.saveState();
  }

  switchTo(newModelId, reason = '自动切换') {
    const old = this.currentModel;
    if (old === newModelId) return null;

    this.currentModel = newModelId;
    const newModel = this.models.get(newModelId);
    if (newModel) {
      newModel.lastSwitchTime = Date.now();
      this.state.models[newModelId].lastSwitchTime = newModel.lastSwitchTime;

      newModel.cooldownUntil = Date.now() + (this.config.thresholds.cooldownMinutes * 60 * 1000);
      this.state.models[newModelId].cooldownUntil = newModel.cooldownUntil;

      this.saveState();

      console.log(`[AutoSwitcher] 从模型 ${old || '无'} 切换到 ${newModelId} (${reason})`);
      console.log(`[AutoSwitcher] 新模型评分: ${newModel.score.toFixed(3)}, 可用性: ${newModel.stats.successfulCalls}/${newModel.stats.totalCalls}`);
    }

    return newModel;
  }

  getModelInfo() {
    const infos = {};
    for (const [id, model] of this.models) {
      infos[id] = {
        score: model.score,
        stats: {
          totalCalls: model.stats.totalCalls,
          successRate: model.stats.totalCalls > 0
            ? (model.stats.successfulCalls / model.stats.totalCalls).toFixed(3)
            : 'N/A',
          avgLatency: model.stats.recentLatencies.length > 0
            ? Math.round(model.stats.recentLatencies.reduce((a, b) => a + b, 0) / model.stats.recentLatencies.length)
            : 'N/A'
        },
        cooldownUntil: model.cooldownUntil,
        lastSwitchTime: model.lastSwitchTime
      };
    }
    return infos;
  }
}

function deepMerge(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

class SwitcherSkill {
  constructor() {
    this.manager = new ModelManager();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    console.log('[AutoSwitcher] 初始化自动模型切换器');
    console.log(`[AutoSwitcher] 监控 ${this.manager.config.freeModels.length} 个免费模型`);
    this.initialized = true;
  }

  async recordCall(modelId, success, latency, error = null) {
    if (!this.manager.config.enabled) return;
    this.manager.recordCall(modelId, success, latency, error);
  }

  async getBestModel(currentModelId = null) {
    if (!this.manager.config.enabled) {
      return currentModelId;
    }

    if (currentModelId && this.manager.shouldSwitch(currentModelId)) {
      const best = this.manager.getBestAvailableModel();
      if (best && best.id !== currentModelId) {
        return this.manager.switchTo(best.id).id;
      }
    }

    const best = this.manager.getBestAvailableModel();
    return best ? best.id : currentModelId;
  }

  async getStatus() {
    return {
      enabled: this.manager.config.enabled,
      currentModel: this.manager.currentModel,
      models: this.manager.getModelInfo(),
      config: this.manager.config
    };
  }

  async reset() {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
    this.manager = new ModelManager();
    console.log('[AutoSwitcher] 状态已重置');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SwitcherSkill, ModelManager };
}

if (require.main === module) {
  const skill = new SwitcherSkill();
  skill.initialize().then(() => {
    console.log('[AutoSwitcher] 运行中...');
  });
}
