export type TimeOption = { id: string; date: string; day: string; period: string; label: string };
export function weekendOptions(now = new Date()): TimeOption[] {
  const saturday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekday = now.getDay();
  saturday.setDate(saturday.getDate() + (weekday === 0 ? -1 : (6 - weekday + 7) % 7));
  const options: TimeOption[] = [];
  for (let offset = 0; offset < 2; offset++) {
    const date = new Date(saturday);
    date.setDate(date.getDate() + offset);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const day = offset === 0 ? '周六' : '周日';
    for (const [period, endHour] of [['上午', 12], ['下午', 18], ['晚上', 24]] as const) {
      const end = new Date(date);
      end.setHours(endHour);
      if (end <= now) continue;
      options.push({ id: `${iso}-${period}`, date: iso, day, period, label: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${day} ${period}` });
    }
  }
  return options;
}
export function toggleActivity(selected: string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter(item => item !== id);
  if (id === 'decide') return ['decide'];
  return [...selected.filter(item => item !== 'decide'), id];
}
export function planText(time: string, activities: string[], note: string): string {
  return ['我们的周末小计划', `时间：${time}`, `想做的事：${activities.length ? activities.join('、') : note.trim()}`, activities.length && note.trim() ? `还有一个想法：${note.trim()}` : '', '期待见面啦。'].filter(Boolean).join('\n');
}
