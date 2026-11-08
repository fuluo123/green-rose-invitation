import './reply.css';

export type ReplyPlan = { answer: 'available' | 'unavailable'; time: string; activities: string[]; note: string };
type Delivery = { id: string; state: 'pending' | 'accepted' | 'failed'; message: string };
const deliveries = new Map<string, Delivery>();
let invitationKey = new URL(location.href).searchParams.get('invite') ?? '';
try {
  if (invitationKey) sessionStorage.setItem('rose-invite', invitationKey);
  else invitationKey = sessionStorage.getItem('rose-invite') ?? '';
} catch { /* Private browsing can disable storage; the complete link still works. */ }

async function timedJson(url: string, options: RequestInit, milliseconds: number): Promise<{ response: Response; body: any }> {
  const controller = new AbortController();
  let timeout = 0;
  const deadline = new Promise<never>((_, reject) => {
    timeout = window.setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, milliseconds);
  });
  try {
    return await Promise.race([(async () => {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const body = await response.json();
      return { response, body };
    })(), deadline]);
  }
  finally { window.clearTimeout(timeout); }
}

function id(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function replyMarkup(): string {
  return '<div class="reply-feedback" aria-live="polite" aria-atomic="true"><p class="reply-status" role="status">正在送出这份回信…</p><button type="button" class="text-button reply-retry" data-action="retry-reply" hidden>再试一次</button></div>';
}

function show(delivery: Delivery): void {
  const box = document.querySelector<HTMLElement>('.reply-feedback');
  if (!box) return;
  box.dataset.state = delivery.state;
  box.querySelector('.reply-status')!.textContent = delivery.message;
  box.querySelector<HTMLButtonElement>('.reply-retry')!.hidden = delivery.state !== 'failed';
}

export async function submitReply(plan: ReplyPlan): Promise<void> {
  const fingerprint = JSON.stringify(plan);
  let delivery = deliveries.get(fingerprint);
  if (delivery && delivery.state !== 'failed') { show(delivery); return; }
  delivery ??= { id: id(), state: 'pending', message: '' };
  delivery.state = 'pending';
  delivery.message = '正在送出这份回信…';
  deliveries.set(fingerprint, delivery);
  show(delivery);
  try {
    const { response, body: receipt } = await timedJson('/api/replies', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...plan, id: delivery.id, token: invitationKey }),
    }, 25000);
    if (response.ok && receipt.status === 'prepared' && receipt.id === delivery.id) {
      if (!/^https:\/\/formsubmit\.co\/ajax\/[a-f0-9]{32}$/.test(receipt.mail?.endpoint)) throw new Error('delivery');
      const { response: mailResponse, body: mailReceipt } = await timedJson(receipt.mail.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(receipt.mail.fields), referrerPolicy: 'strict-origin',
      }, 30000);
      if (!mailResponse.ok || ![true, 'true'].includes(mailReceipt.success)) {
        throw new Error(/activat|confirm.*email|verify.*email/i.test(String(mailReceipt.message)) ? 'activation' : 'delivery');
      }
      receipt.status = 'accepted';
    }
    if (!response.ok || receipt.status !== 'accepted' || receipt.id !== delivery.id) {
      throw new Error(receipt.code === 'activation_required' ? 'activation' : receipt.code === 'invalid_invitation' ? 'invitation' : receipt.code === 'try_later' ? 'limited' : 'delivery');
    }
    delivery.state = 'accepted';
    delivery.message = '回信已送出，期待周末见。';
  } catch (error) {
    delivery.state = 'failed';
    delivery.message = error instanceof Error && error.message === 'invitation'
      ? '邀请链接不完整，请使用收到的完整邀请链接重新打开。'
      : error instanceof Error && error.message === 'limited'
      ? '刚才尝试得有点频繁，请稍等一分钟再试。'
      : error instanceof Error && error.message === 'activation'
      ? '回信通道还在开通中，稍后再试一次就好。'
      : error instanceof Error && error.message === 'timeout'
      ? '暂时无法确认是否送出。你的选择还在，重试可能产生重复回信。'
      : '这次没送出去。你的选择还在，点一下再试。';
  }
  // A request may finish after she has gone back to edit the plan.
  if (document.querySelector('.reply-feedback')?.getAttribute('data-reply-id') === delivery.id) show(delivery);
}

export function bindReply(plan: ReplyPlan): void {
  const fingerprint = JSON.stringify(plan);
  const delivery = deliveries.get(fingerprint);
  const box = document.querySelector<HTMLElement>('.reply-feedback');
  if (!box) return;
  if (delivery) { box.dataset.replyId = delivery.id; show(delivery); }
  else {
    const fresh = { id: id(), state: 'failed' as const, message: '' };
    deliveries.set(fingerprint, fresh);
    box.dataset.replyId = fresh.id;
  }
  void submitReply(plan);
}
