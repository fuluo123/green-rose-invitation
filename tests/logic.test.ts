import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekendOptions, toggleActivity, planText } from '../src/logic.ts';

test('工作日取下一个周末，日期和时段真实且不修改输入', () => {
  const date = new Date(2026, 9, 12, 9);
  const options = weekendOptions(date);
  assert.equal(options.length, 6);
  assert.equal(options[0].date, '2026-10-17');
  assert.equal(options[5].label, '2026年10月18日 周日 晚上');
  assert.equal(date.getDate(), 12);
});
test('周六当天保留本周末，排除已结束时段', () => {
  const options = weekendOptions(new Date(2026, 9, 17, 14));
  assert.equal(options.length, 5);
  assert.equal(options[0].period, '下午');
});
test('周日当天仅提供未结束的周日时段', () => {
  const options = weekendOptions(new Date(2026, 9, 18, 19));
  assert.equal(options.length, 1);
  assert.equal(options[0].day, '周日');
});
test('跨年、闰年和周一零点', () => {
  assert.equal(weekendOptions(new Date(2026, 11, 31))[0].date, '2027-01-02');
  assert.equal(weekendOptions(new Date(2024, 1, 29))[0].date, '2024-03-02');
  assert.equal(weekendOptions(new Date(2026, 9, 19, 0))[0].date, '2026-10-24');
});
test('你来决定与其他活动互斥，支持取消和多选', () => {
  assert.deepEqual(toggleActivity(['dinner', 'coffee'], 'decide'), ['decide']);
  assert.deepEqual(toggleActivity(['decide'], 'walk'), ['walk']);
  assert.deepEqual(toggleActivity(['walk'], 'coffee'), ['walk', 'coffee']);
  assert.deepEqual(toggleActivity(['walk', 'coffee'], 'walk'), ['coffee']);
  assert.deepEqual(toggleActivity(['decide'], 'decide'), []);
});
test('分享文本包含时间活动备注，自定义活动也可独立成计划', () => {
  assert.equal(planText('周日四点后', ['一起吃饭', '散步聊天'], '想去河边'), '我们的周末小计划\n时间：周日四点后\n想做的事：一起吃饭、散步聊天\n还有一个想法：想去河边\n期待见面啦。');
  assert.match(planText('下周', [], '骑车'), /想做的事：骑车/);
});
