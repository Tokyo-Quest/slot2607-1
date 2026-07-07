// ============================================================
// 4人まとめてキメろ!(ボーナス/連続タイミング・高難度)
// 大当たり時のみ発動。4人ぶん連続でタイミング判定、
// 成功するごとに加速&ゾーンが狭くなる。損はしない上乗せ枠。
// ============================================================
MiniGames.register('bonus', {
  title: '4人まとめてキメろ!',

  async run(ctx) {
    const cfg = ctx.cfg;
    const s = ctx.root;
    Engine.el(s, 'mg-title', 'ボーナス!4人まとめてキメろ!');
    const instr = Engine.el(s, 'mg-instr', 'ゾーンで押せ!');

    const dial = Engine.el(s, 'dial');
    const zoneEl = Engine.el(dial, 'dial-zone');
    const hole = Engine.el(dial, 'dial-hole', '');
    const needle = Engine.el(dial, 'dial-needle');

    const membersRow = Engine.el(s, 'bonus-members');
    const slots = CONFIG.members.map(m => Engine.memberFace(membersRow, m, 'bslot'));

    await Engine.sleep(1200);

    let count = 0;
    for (let i = 0; i < 4; i++) {
      const m = CONFIG.members[i];
      slots[i].classList.add('active');
      hole.style.background = m.color;
      if (m.face) {
        Engine.setImage(hole, m.face, 'cover', 'center top');
        hole.classList.add('face');
        hole.textContent = '';
      } else {
        hole.textContent = m.id;
      }

      // このラウンドの難易度(加速&ゾーン縮小/easy=隠しキー補正)
      const speed = (cfg.baseSpeed || 0.55) * Math.pow(cfg.accel || 1.25, i); // 回転/秒
      let zoneW = (cfg.zoneDeg || 70) * Math.pow(cfg.zoneShrink || 0.78, i); // 度
      if (ctx.bias === 'easy') zoneW = 200;
      const zoneCenter = 40 + Math.random() * 280; // 真上付近を避けてランダム配置

      zoneEl.style.background =
        `conic-gradient(from ${zoneCenter - zoneW / 2}deg, #ffd54f 0 ${zoneW}deg, transparent ${zoneW}deg)`;

      instr.textContent = `${m.name} いくよ!(${i + 1}/4)`;
      Engine.sound('tick');
      await Engine.sleep(600);

      const t0 = performance.now();
      let rafOn = true, angle = 0;
      (function rot() {
        if (!rafOn) return;
        angle = ((performance.now() - t0) / 1000 * speed * 360) % 360;
        needle.style.transform = `translate(-50%,-100%) rotate(${angle}deg)`;
        requestAnimationFrame(rot);
      })();

      const hit = await new Promise(res => {
        let done = false;
        const finish = v => { if (done) return; done = true; rafOn = false; Engine.Input.offPress(onPress); res(v); };
        const onPress = () => {
          let diff = Math.abs(angle - zoneCenter) % 360;
          if (diff > 180) diff = 360 - diff;
          finish(diff <= zoneW / 2);
        };
        Engine.Input.onPress(onPress);
        setTimeout(() => finish(false), cfg.timeoutMs || 5000);
      });

      slots[i].classList.remove('active');
      if (hit) {
        count++;
        slots[i].classList.add('done-ok');
        Engine.flash('#fff', 120);
        Engine.sound('perfect');
      } else {
        slots[i].classList.add('done-ng');
        Engine.sound('miss');
      }
      await Engine.sleep(500);
    }

    // 結果演出
    const labels = { 4: '全員キマった!! 特別賞!!', 3: '3人成功! 上乗せ(大)!', 2: '2人成功! 上乗せ(小)!' };
    const label = labels[count] || `${count}人成功… 大当たりはそのまま!`;
    const b = Engine.el(s, 'burst', label);
    if (count >= 4) { Engine.confetti(300); Engine.shake(); Engine.sound('bigwin'); }
    else if (count >= 2) { Engine.confetti(120); Engine.sound('win'); }
    else { Engine.sound('good'); b.style.fontSize = '110px'; }
    await Engine.sleep(2200);
    return { count };
  },
});
