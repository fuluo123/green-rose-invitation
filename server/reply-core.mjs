const labels = ['一起吃饭', '喝咖啡', '看电影', '散步聊天', '逛公园', '看展', '去书店', '你来决定'];

export function validateReply(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_reply');
  const { id, answer, time, activities, note } = input;
  if (typeof id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) throw new Error('invalid_reply');
  if (!['available', 'unavailable'].includes(answer) || typeof time !== 'string' || time.length > 100 || typeof note !== 'string' || note.length > 200) throw new Error('invalid_reply');
  if (!Array.isArray(activities) || activities.length > 8 || new Set(activities).size !== activities.length || activities.some(item => !labels.includes(item))) throw new Error('invalid_reply');
  if (activities.includes('你来决定') && activities.length > 1) throw new Error('invalid_reply');
  if (answer === 'available' && (!time.trim() || (!activities.length && !note.trim()))) throw new Error('invalid_reply');
  if (answer === 'unavailable' && (time || activities.length || note)) throw new Error('invalid_reply');
  return { id, answer, time: time.trim(), activities: [...activities], note: note.trim() };
}

export function emailFields(reply) {
  return {
    _subject: '绿玫瑰 · 周末邀请有回信了', _template: 'table', _captcha: 'false',
    '她的回复': reply.answer === 'available' ? '有空呀' : '这周不方便',
    '见面时间': reply.time || '等待下次见面',
    '一起做的事': reply.activities.join('、') || (reply.answer === 'available' ? reply.note : '暂未选择'),
    '补充想法': reply.activities.length ? reply.note || '没有补充' : '没有补充',
    '提交时间': new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }),
    '回信编号': reply.id,
  };
}

export async function sendEmail(reply, recipient, siteUrl, fetcher = fetch) {
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('mail_unconfigured');
  const fields = emailFields(reply);
  // Only the provider's exact success redirect counts as an accepted email.
  const next = new URL('/', siteUrl);
  next.searchParams.set('mailReceipt', reply.id);
  fields._next = next.href;
  const response = await fetcher(`https://formsubmit.co/${encodeURIComponent(recipient)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: siteUrl },
    body: new URLSearchParams(fields), redirect: 'manual', signal: AbortSignal.timeout(20000),
  });
  if ([302, 303].includes(response.status) && response.headers.get('location') === next.href) return;
  const message = (await response.text()).slice(0, 12000);
  if (/activate your|confirm.*email|verify.*email/i.test(message)) throw new Error('activation_required');
  throw new Error('mail_failed');
}

