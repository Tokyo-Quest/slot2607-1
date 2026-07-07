// ============================================================
// 復活チャレンジ(リーチ不成立時/確率+実力判定)
// 往復するマーカーを中央ゾーンで止めろ!勝てばリトライ!
// ゾーン幅(config)で実質勝率を調整。forceLoseで強制敗北。
// ============================================================
MiniGames.register('revival', {
  title: '復活チャレンジ',

  async run(ctx) {
    const cfg = ctx.cfg;
    // 挑戦回数に応じて難化(ゾーン縮小+マーカー加速)
    const attempt = (ctx.extra && ctx.extra.attempt) || 0;
    const zoneW = (cfg.zoneWidth ?? 0.22) * Math.pow(cfg.zoneShrinkPerRetry ?? 0.65, attempt);
    const traverse = (cfg.traverseMs || 900) * Math.pow(cfg.speedUpPerRetry ?? 0.85, attempt);
    const s = ctx.root;

    Engine.el(s, 'mg-title', '復活チャレンジ!' + (attempt > 0 ? ` ×${attempt + 1}` : ''));
    Engine.el(s, 'mg-instr', 'まんなかで止めろ!');

    // 4人が応援
    const cheer = Engine.el(s, 'rev-cheer');
    CONFIG.members.forEach((m, i) => {
      const c = Engine.memberFace(cheer, m, 'chip');
      c.style.animationDelay = (i * 0.12) + 's';
    });
    const say = Engine.el(s, 'burst', 'まだ諦めないで!!');
    say.style.top = '38%';
    say.style.fontSize = '90px';

    const bar = Engine.el(s, 'rev-bar');
    const zone = Engine.el(bar, 'rev-zone');
    zone.style.left = ((0.5 - zoneW / 2) * 100) + '%';
    zone.style.width = (zoneW * 100) + '%';
    const marker = Engine.el(bar, 'rev-marker');

    await Engine.sleep(1400);
    say.remove();
    Engine.sound('tick');

    // マーカー往復(三角波)
    const t0 = performance.now();
    const half = traverse;
    let rafOn = true, pos = 0;
    (function move() {
      if (!rafOn) return;
      const t = (performance.now() - t0) / half;
      const ph = t % 2;
      pos = ph < 1 ? ph : 2 - ph; // 0→1→0…
      marker.style.left = (pos * 100) + '%';
      requestAnimationFrame(move);
    })();

    let landed = await new Promise(res => {
      let done = false;
      const finish = v => { if (done) return; done = true; rafOn = false; Engine.Input.offPress(onPress); res(v); };
      const onPress = () => { Engine.sound('button'); finish(pos); };
      Engine.Input.onPress(onPress);
      setTimeout(() => finish(null), cfg.timeoutMs || 6000);
    });

    let win = landed != null && Math.abs(landed - 0.5) <= zoneW / 2;
    if (ctx.bias === 'forceLose' && win) {
      // 強制敗北:ゾーンぎりぎり外に着地したように見せる
      win = false;
      landed = 0.5 + zoneW / 2 + 0.03;
    }
    if (landed != null) marker.style.left = (landed * 100) + '%';

    // 結果演出(勝利のファンファーレはflow側のREVIVAL演出で)
    if (win) {
      Engine.flash('#fff', 160);
      Engine.sound('perfect');
      Engine.el(s, 'burst', 'ヒット!!');
    } else {
      Engine.sound('lose');
      const b = Engine.el(s, 'burst', landed == null ? '止められなかった…' : 'とどかず…!');
      b.style.color = '#b0bec5';
    }
    await Engine.sleep(1600);
    return { win };
  },
});
