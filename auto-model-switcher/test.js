#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { SwitcherSkill, ModelManager } = require('./switcher');

function assert(condition, message) {
  if (!condition) throw new Error(`❌ ${message}`);
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log('🧪 开始测试 Auto Model Switcher...\n');

  const stateFile = path.join(process.env.APPDATA || path.join(__dirname, '.test'), 'opencode', 'auto-switcher-state.json');
  if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);

  let passed = 0, failed = 0;

  // Test 1: Initialize
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();
    assert(skill.initialized, '初始化成功');
    passed++;
  } catch (e) { console.error('❌ Test1:', e.message); failed++; }

  // Test 2: Load models
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();
    assert(skill.manager.models.size > 0, `加载${skill.manager.models.size}个模型`);
    passed++;
  } catch (e) { console.error('❌ Test2:', e.message); failed++; }

  // Test 3: Initial score valid
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();
    const model = Array.from(skill.manager.models.values())[0];
    assert(model.score >= 0 && model.score <= 1, `初始评分${model.score}有效`);
    passed++;
  } catch (e) { console.error('❌ Test3:', e.message); failed++; }

  // Test 4: Record success
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();
    const modelId = 'openai/gpt-4o-mini';
    skill.manager.recordCall(modelId, true, 250);
    const model = skill.manager.models.get(modelId);
    assert(model.stats.totalCalls === 1, '总调用数=1');
    assert(model.stats.successfulCalls === 1, '成功数=1');
    assert(model.stats.recentLatencies[0] === 250, '延迟记录正确');
    passed++;
  } catch (e) { console.error('❌ Test4:', e.message); failed++; }

  // Test 5: Record failure
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();
    const modelId = 'openai/gpt-4o-mini';
    skill.manager.recordCall(modelId, false, 3000, 'rate_limit');
    const model = skill.manager.models.get(modelId);
    assert(model.stats.failedCalls === 1, '失败数=1');
    assert(model.stats.recentErrors[0].error === 'rate_limit', '错误记录正确');
    passed++;
  } catch (e) { console.error('❌ Test5:', e.message); failed++; }

  // Test 6: Score improves with success
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();
    const modelId = 'anthropic/claude-haiku-3-5-20241022';

    const initialScore = skill.manager.models.get(modelId).score;

    // 6次成功调用
    for (let i = 0; i < 6; i++) {
      skill.manager.recordCall(modelId, true, 150 + Math.random() * 100);
    }

    const newScore = skill.manager.models.get(modelId).score;
    assert(newScore > 0.6, `评分良好: ${newScore.toFixed(3)}`);
    passed++;
  } catch (e) { console.error('❌ Test6:', e.message); failed++; }

  // Test 7: Score decreases with failures
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();
    const modelId = 'google/gemini-flash-1.5';

    for (let i = 0; i < 5; i++) {
      skill.manager.recordCall(modelId, false, 5000, 'timeout');
    }

    const score = skill.manager.models.get(modelId).score;
    assert(score < 0.5, `失败后评分低: ${score.toFixed(3)}`);
    passed++;
  } catch (e) { console.error('❌ Test7:', e.message); failed++; }

  // Test 8: Get best model
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();

    const models = Array.from(skill.manager.models.keys()).slice(0, 3);
    models.forEach((m, i) => {
      for (let j = 0; j < i + 1; j++) {
        skill.manager.recordCall(m, true, 200 + i * 100);
      }
    });

    const best = skill.manager.getBestAvailableModel();
    assert(best !== null, '能获取最佳模型');
    assert(skill.manager.models.has(best.id), '模型ID有效');
    passed++;
  } catch (e) { console.error('❌ Test8:', e.message); failed++; }

  // Test 9: Should switch on consecutive failures
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();
    const modelId = 'openai/gpt-4o-mini';

    for (let i = 0; i < 3; i++) {
      skill.manager.recordCall(modelId, false, 5000, 'error');
    }

    assert(skill.manager.shouldSwitch(modelId) === true, '3次失败触发切换');
    passed++;
  } catch (e) { console.error('❌ Test9:', e.message); failed++; }

  // Test 10: Cooldown
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();
    const modelId = 'openai/gpt-4o-mini';

    skill.manager.setCooldown(modelId, 1);
    const now = Date.now();
    assert(skill.manager.models.get(modelId).cooldownUntil > now, '冷却期已设置');

    const best = skill.manager.getBestAvailableModel();
    const inCooldown = skill.manager.models.get(modelId).cooldownUntil > now;
    if (inCooldown && best) {
      assert(best.id !== modelId, '冷却期不选中');
    }
    passed++;
  } catch (e) { console.error('❌ Test10:', e.message); failed++; }

  // Test 11: Persistence
  try {
    const skill1 = new SwitcherSkill();
    await skill1.initialize();
    const modelId = 'anthropic/claude-haiku-3-5-20241022';

    skill1.manager.recordCall(modelId, true, 300);
    skill1.manager.recordCall(modelId, false, 5000, 'test');
    const stats1 = skill1.manager.models.get(modelId).stats.totalCalls;
    const score1 = skill1.manager.models.get(modelId).score;
    skill1.manager.saveState();

    const skill2 = new SwitcherSkill();
    await skill2.initialize();
    const stats2 = skill2.manager.models.get(modelId).stats.totalCalls;
    const score2 = skill2.manager.models.get(modelId).score;

    assert(stats2 === stats1, '调用计数已恢复');
    assert(Math.abs(score2 - score1) < 0.001, '评分已恢复');
    passed++;
  } catch (e) { console.error('❌ Test11:', e.message); failed++; }

  // Test 12: Get status
  try {
    const skill = new SwitcherSkill();
    await skill.initialize();
    const status = await skill.getStatus();
    assert(typeof status === 'object', '返回状态对象');
    assert('enabled' in status, '有enabled');
    assert('currentModel' in status, '有currentModel');
    assert('models' in status, '有models');
    assert('config' in status, '有config');
    passed++;
  } catch (e) { console.error('❌ Test12:', e.message); failed++; }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 结果: ${passed} 通过, ${failed} 失败`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('🎉 全部通过！');
    process.exit(0);
  } else {
    console.log('⚠️  有失败，需要修复');
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('测试崩溃:', e);
  process.exit(1);
});
