import soundtrack from './assets/rising-road.mp3';
import './music.css';

/** Lives outside the changing invitation pages, so navigation preserves playback. */
export function initMusic(): void {
  const player = document.createElement('div');
  player.className = 'music-player';
  player.innerHTML = `<button class="music-toggle" type="button" aria-label="播放背景音乐" aria-pressed="false" title="Rising Road ～メインテーマ～ · 播放音乐"><svg class="music-note" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 17V6l11-2v11M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></svg><span class="music-bars" aria-hidden="true"><i></i><i></i><i></i></span></button><span class="music-feedback" role="status"></span>`;
  const audio = document.createElement('audio');
  audio.id = 'background-music';
  audio.src = soundtrack;
  audio.preload = 'auto';
  audio.autoplay = true;
  audio.loop = true;
  audio.setAttribute('playsinline', '');
  audio.volume = .3;
  player.append(audio);
  document.body.append(player);
  const button = player.querySelector<HTMLButtonElement>('button')!;
  const feedback = player.querySelector<HTMLElement>('.music-feedback')!;
  let wanted = false;
  let attempted = false;
  let generation = 0;
  function reflect(): void {
    const playing = !audio.paused && !audio.ended && audio.readyState >= 2;
    player.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
    button.title = `Rising Road ～メインテーマ～ · ${playing ? '暂停音乐' : '播放音乐'}`;
  }
  function pause(): void {
    wanted = false;
    generation++;
    audio.pause();
    reflect();
  }
  function play(quiet = false): void {
    wanted = true;
    feedback.textContent = '';
    const request = ++generation;
    const failed = () => {
      if (request !== generation) return;
      wanted = false;
      reflect();
      if (!quiet) feedback.textContent = '音乐还没响，点一下再试试。';
    };
    // Called directly in the click handler to retain the mobile user gesture.
    // Older embedded browsers start playback but return void, and some throw
    // synchronously. Neither case should interrupt invitation initialization.
    let playback: Promise<void> | undefined;
    try { playback = audio.play(); }
    catch { failed(); return; }
    void Promise.resolve(playback).then(() => {
      if (!wanted) audio.pause();
      reflect();
    }).catch(failed);
  }
  button.addEventListener('click', () => {
    attempted = true;
    if (!audio.paused) pause(); else play();
  });
  function unlock(event: Event): void {
    // Desktop WebViews can leave the initial play promise pending. A real
    // gesture must retry even while that earlier request is still outstanding.
    if (!attempted && audio.paused && !(event.target instanceof Element && event.target.closest('.music-player'))) play(true);
  }
  document.addEventListener('pointerdown', unlock, { capture: true });
  document.addEventListener('touchend', unlock, { capture: true, passive: true });
  document.addEventListener('click', unlock, { capture: true });
  document.addEventListener('keydown', unlock, { capture: true });
  function retryAutomatic(): void { if (!attempted && audio.paused && !document.hidden) play(true); }
  document.addEventListener('WeixinJSBridgeReady', retryAutomatic);
  audio.addEventListener('playing', () => { if (!wanted) audio.pause(); reflect(); });
  audio.addEventListener('pause', reflect);
  audio.addEventListener('error', () => {
    wanted = false;
    reflect();
    feedback.textContent = '音乐暂时没加载好，邀请可以继续。';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else retryAutomatic(); });
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', retryAutomatic);
  play(true);
}
