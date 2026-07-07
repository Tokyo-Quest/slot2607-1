// ============================================================
// flow.js — ゲーム全体の進行(状態遷移)
// 待機 → スロット → リーチ演出 → ミニゲーム → (ボーナス) → 結果
//                 → リーチ不成立 → 復活チャレンジ → リトライ or 結果
//
// 結果コントロール:
//   待機画面中に 1〜4 キーで次プレイのランクを強制指定 / 0 でリセット
//   (画面には表示されない。デバッグモード[D]でのみ確認可)
// ============================================================
(() => {
  const C = window.CONFIG;
  let forcedRank = null;    // 1〜4 or null(確率モード)
  let forcedGameIdx = null; // 0〜3 = 次リーチのメンバー(ゲーム)強制 or null

  function pickMemberIdx() {
    const w = C.slot.memberWeights || C.members.map(() => 1);
    const total = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; }
    return 0;
  }

  // ---------- 待機画面(アトラクトモード) ----------
  async function attract() {
    const s = Engine.setScene('sc-attract');
    s.classList.add('halftone');
    Engine.sceneBg(s, 'bgAttract'); // 背景画像(あれば)
    Engine.setDebug('scene', 'attract');
    Engine.sound('bgmAttract');
    const IMG = C.images || {};

    const logo = Engine.el(s, 'attract-logo');
    logo.innerHTML = `<div class="logo-main">MID POP</div><div class="logo-sub">ワンボタン・パニック!</div>`;
    Engine.applyLayout(logo, 'title');

    const badge = Engine.el(s, 'price-badge');
    badge.innerHTML = `<span>1PLAY</span>¥500`;
    if (Engine.setImage(badge, IMG.badgePrice, 'contain')) badge.classList.add('img-plain');

    // 4人整列(立ち絵のコマ送りアニメ。差分は config.members[].anim)
    const lineup = Engine.el(s, 'attract-lineup layout-abs');
    C.members.forEach((m, i) => {
      const ch = Engine.el(lineup, 'lineup-char');
      ch.style.animationDelay = (i * 0.18) + 's';
      const frames = (m.anim && m.anim.length) ? m.anim : [m.stand];
      Engine.animate(ch, frames, (C.anims && C.anims.intervalMs || 600) + i * 40);
    });
    Engine.applyLayout(lineup, 'lineup');

    const push = Engine.el(s, 'push-guide blink', 'PUSH TO START!');
    if (Engine.setImage(push, IMG.guidePush, '100% 100%')) push.classList.add('img-plain');
    Engine.applyLayout(push, 'pushGuide');

    // スタッフ用隠しキー(待機中のみ受付)
    // 1〜4=結果ランク強制 / 5〜8=ゲーム(メンバー)強制 / 0=リセット
    const updateHiddenDebug = () => {
      Engine.setDebug('forcedRank', forcedRank == null ? 'なし(確率)' : '★' + forcedRank + ' 強制');
      Engine.setDebug('forcedGame', forcedGameIdx == null ? 'なし(ランダム)'
        : C.members[forcedGameIdx].name + '(' + C.members[forcedGameIdx].game + ')');
    };
    Engine.Input.setHiddenKey(k => {
      if (k === 0) { forcedRank = null; forcedGameIdx = null; }
      else if (k >= 1 && k <= 4) forcedRank = k;
      else if (k >= 5 && k <= 8) forcedGameIdx = k - 5;
      updateHiddenDebug();
    });
    updateHiddenDebug();

    await Engine.Input.waitPress();
    Engine.Input.setHiddenKey(null);
    Engine.stopBgm();
    Engine.sound('button');
    Engine.flash('#fff', 100);
    await Engine.sleep(200);
    play();
  }

  // ---------- 1プレイ ----------
  async function play() {
    const forced = forcedRank;        // ワンショット(このプレイ限り)
    const forcedGame = forcedGameIdx; // 同上
    forcedRank = null;
    forcedGameIdx = null;
    const bias = forced == null ? null : (forced >= 3 ? 'easy' : 'hard');
    let revivalAttempt = 0; // 復活回数(増えるほど難化)

    while (true) {
      const reach = forced != null ? forced >= 2
        : (forcedGame != null ? true : Math.random() < C.slot.reachRate);
      const memberIdx = forcedGame != null ? forcedGame : pickMemberIdx();
      const member = C.members[memberIdx];

      Engine.sound('bgmSlot');
      const slotRes = await Slot.run({ reach, memberIdx });
      Engine.stopBgm();

      if (slotRes.reach) {
        await reachCutin(member);
        const res = await MiniGames.run(member.game, bias);
        let rank = C.resultMap[res.level] ?? 1;
        if (forced != null) rank = forced;

        const jackpot = rank >= 4;
        await Slot.resolveThird(jackpot);

        let bonusCount = 0;
        if (jackpot) {
          const bres = await MiniGames.run('bonus', bias === 'easy' ? 'easy' : null);
          bonusCount = bres.count || 0;
        }
        return result(rank, bonusCount, member);
      }

      // ----- リーチ不成立 → 復活チャレンジ(回数無制限・挑戦ごとに難化) -----
      const rres = await MiniGames.run('revival', forced === 1 ? 'forceLose' : null, { attempt: revivalAttempt });
      if (rres.win) {
        revivalAttempt++;
        await retryFanfare();
        continue; // もう一度スロットへ!
      }
      return result(1, 0, null);
    }
  }

  // ---------- リーチカットイン ----------
  async function reachCutin(member) {
    const s = Engine.setScene('sc-cutin');
    Engine.setDebug('scene', 'cutin');
    const lines = Engine.el(s, 'speedlines');
    Engine.setImage(lines, (C.images || {}).bgCutin, 'cover'); // 集中線画像(拡大縮小/点滅)
    const gameTitle = (MiniGames.defs[member.game] || {}).title || member.game;
    const panel = Engine.el(s, 'cutin-panel');
    panel.style.background = member.color;
    // 立ち絵(stand_*.png)があれば使用、なければ仮の顔サークル
    const visual = member.stand
      ? `<div class="cutin-stand" style="background-image:url('${Engine.assetUrl(member.stand)}')"></div>`
      : `<div class="cutin-face" style="background:${member.color}">${member.id}</div>`;
    panel.innerHTML = `
      ${visual}
      <div class="cutin-name">${member.name}</div>
      <div class="cutin-game">「${gameTitle}」</div>`;
    Engine.sound('reach');
    Engine.shake();
    await Engine.sleep(2300);
  }

  // ---------- 復活成功(リトライ) ----------
  async function retryFanfare() {
    const s = Engine.setScene('sc-cutin');
    const lines = Engine.el(s, 'speedlines');
    Engine.setImage(lines, (C.images || {}).bgCutin, 'cover');
    const b = Engine.el(s, 'burst', 'REVIVAL!!');
    b.style.color = '#7CFC00';
    Engine.sound('revive');
    Engine.confetti(80);
    Engine.shake();
    await Engine.sleep(2000);
  }

  // ---------- 結果画面 ----------
  async function result(rank, bonusCount, member) {
    const s = Engine.setScene('sc-result');
    s.classList.add('halftone');
    if (rank <= 1) s.classList.add('rank-low');
    Engine.sceneBg(s, rank <= 1 ? 'bgResultLow' : 'bgResult'); // 背景画像(あれば)
    Engine.setDebug('scene', 'result rank=' + rank + ' bonus=' + bonusCount);
    Engine.sound('bgmResult');

    // 立ち絵: ★3以上=キメ / それ以下=通常(リーチしたメンバーのみ)
    if (member) {
      const standFile = rank >= 3 ? (member.standKime || member.stand) : member.stand;
      if (standFile) {
        const st = Engine.el(s, 'result-stand');
        Engine.setImage(st, standFile, 'contain', 'center bottom');
        if (rank <= 1) st.style.filter = 'grayscale(.6)';
      }
    }

    const r = C.ranks[rank];
    Engine.el(s, 'result-stars', r.stars);
    Engine.el(s, 'result-rank', r.name);
    Engine.el(s, 'result-prize', '賞品: ' + r.prize);

    if (bonusCount >= 2 && C.bonusPrizes[bonusCount]) {
      Engine.el(s, 'result-bonus', '4人まとめてキメろ! ' + bonusCount + '人成功 → ' + C.bonusPrizes[bonusCount]);
    }
    if (rank >= 4) { Engine.sound('bigwin'); Engine.confetti(260); Engine.shake(); }
    else if (rank >= 3) { Engine.sound('win'); Engine.confetti(140); }
    else if (rank >= 2) { Engine.sound('good'); }
    else { Engine.sound('lose'); }
    if (bonusCount >= 4) { await Engine.sleep(400); Engine.confetti(300); }

    // ボタン or 8秒で待機画面へ
    await Promise.race([Engine.Input.waitPress(), Engine.sleep(8000)]);
    Engine.stopBgm();
    attract();
  }

  // ---------- 起動 ----------
  let started = false;
  function boot() { if (started) return; started = true; attract(); }
  addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
