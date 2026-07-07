// ============================================================
// slot.js — スロットパート(3連リール)
// 絵柄 = メンバー4人の顔(face_*.png) + チャンス目アイテム3種
// リール窓は frame_slot.png の窓位置(config.layout.reels)に重ねて表示
// ============================================================
window.Slot = (() => {

  let SYMS = null;
  function symbols() {
    if (SYMS) return SYMS;
    // 絵柄はメンバー4人の顔のみ(チャンス目は廃止)
    SYMS = window.CONFIG.members.map((m, i) => ({
      type: 'member', memberIdx: i, label: m.id, color: m.color, image: m.face || null,
    }));
    return SYMS;
  }

  function reelLayout() {
    const L = (window.CONFIG.layout || {}).reels || {};
    return {
      centers: L.centers || [{ x: 445, y: 311 }, { x: 744, y: 307 }, { x: 1058, y: 312 }],
      w: L.width || 230,
      h: L.height || 260,
    };
  }

  class Reel {
    // container=筐体div / center={x,y} 筐体内座標 / w,h=窓サイズ
    constructor(container, center, w, h) {
      const syms = symbols();
      this.N = syms.length;
      this.h = h;
      this.win = Engine.el(container, 'reel-window on-frame');
      this.win.style.left = center.x + 'px';
      this.win.style.top = center.y + 'px';
      this.win.style.width = w + 'px';
      this.win.style.height = h + 'px';
      this.strip = document.createElement('div');
      this.strip.className = 'reel-strip';
      // 2周ぶん並べてループさせる
      for (let r = 0; r < 2; r++) {
        for (const s of syms) {
          const d = document.createElement('div');
          d.className = 'sym';
          d.style.height = h + 'px';
          d.style.fontSize = Math.round(h * 0.5) + 'px';
          d.style.background = s.color;
          if (s.image) {
            Engine.setImage(d, s.image, 'cover', 'center top');
            d.classList.add('face');
          } else {
            d.textContent = s.label;
          }
          this.strip.appendChild(d);
        }
      }
      this.win.appendChild(this.strip);
      this.offset = Engine.randInt(this.N) * h;
      this.mode = 'idle';
      this.render();
    }
    render() {
      const total = this.N * this.h;
      const o = ((this.offset % total) + total) % total;
      this.strip.style.transform = `translateY(${-o}px)`;
    }
    spin() {
      if (this.mode === 'spin') return;
      this.mode = 'spin';
      const tick = () => {
        if (this.mode === 'spin') {
          this.offset += window.CONFIG.slot.spinSpeed;
          this.render();
        } else if (this.mode === 'stop') {
          const t = Math.min(1, (performance.now() - this.t0) / this.dur);
          const e = 1 - Math.pow(1 - t, 3); // ease-out
          this.offset = this.from + (this.to - this.from) * e;
          this.render();
          if (t >= 1) {
            this.mode = 'idle';
            const cb = this.onStopped;
            this.onStopped = null;
            if (cb) cb();
            return;
          }
        } else {
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    stopAt(symIndex) {
      return new Promise(res => {
        const total = this.N * this.h;
        const cur = this.offset;
        let target = Math.ceil(cur / total) * total + symIndex * this.h;
        if (target - cur < this.h * 3) target += total; // 少し回してから止める
        this.from = cur; this.to = target;
        this.t0 = performance.now(); this.dur = 480;
        this.onStopped = () => { this.offset = this.to; this.render(); res(); };
        this.mode = 'stop';
      });
    }
    freezeAt(symIndex) {
      this.mode = 'idle';
      this.offset = symIndex * this.h;
      this.render();
    }
  }

  let reels = [];
  let lastMemberIdx = null;

  function buildScene() {
    reels.forEach(r => { r.mode = 'idle'; }); // 前シーンのrAFループを停止
    const s = Engine.setScene('sc-slot');
    s.classList.add('halftone');
    Engine.sceneBg(s, 'bgSlot'); // 背景画像(あれば)

    // 筐体: frame_slot.png(1456×816・窓は透過)。
    // レイヤー: リール(奥) < 筐体画像(手前) — 窓の透過部分からリールが見える
    const IMG = window.CONFIG.images || {};
    const cab = Engine.el(s, 'slot-cabinet layout-abs');
    let reelParent = cab;
    if (IMG.frameSlot) {
      reelParent = Engine.el(cab, 'reel-layer');          // 奥: リール
      const overlay = Engine.el(cab, 'frame-overlay');    // 手前: 筐体
      Engine.setImage(overlay, IMG.frameSlot, 'contain');
    } else {
      cab.classList.add('plain');
      Engine.el(cab, 'slot-head', 'MID POP スロット');
    }
    Engine.applyLayout(cab, 'slotFrame');

    // リール窓(筐体画像の窓位置に合わせる)
    const RL = reelLayout();
    reels = [0, 1, 2].map(i => new Reel(reelParent, RL.centers[i], RL.w, RL.h));

    // 両サイドのキャラ(毎回ランダムに2人。コマ送りアニメ)
    const ms = window.CONFIG.members;
    const li = Engine.randInt(ms.length);
    let ri; do { ri = Engine.randInt(ms.length); } while (ri === li);
    const interval = (window.CONFIG.anims && window.CONFIG.anims.intervalMs) || 600;
    [[li, 'slotSideL'], [ri, 'slotSideR']].forEach(([idx, key], k) => {
      const m = ms[idx];
      const side = Engine.el(s, 'slot-side layout-abs');
      side.style.animationDelay = (k * 0.4) + 's';
      const frames = (m.anim && m.anim.length) ? m.anim : [m.stand];
      Engine.animate(side, frames, interval + k * 70);
      Engine.applyLayout(side, key);
    });

    const push = Engine.el(s, 'slot-push blink', 'STOP!');
    return { s, cab, push };
  }

  return {
    symbols,

    // outcome: { reach:bool, memberIdx:number }
    async run(outcome) {
      const syms = symbols();
      const ui = buildScene();
      Engine.setDebug('scene', 'slot');
      const mi = outcome.memberIdx;
      lastMemberIdx = mi;

      let finals;
      if (outcome.reach) {
        finals = [mi, mi, null];
      } else {
        // リーチ(2つ揃い)にならない組み合わせを作る
        const a = Engine.randInt(syms.length);
        let b; do { b = Engine.randInt(syms.length); } while (b === a);
        let c; do { c = Engine.randInt(syms.length); } while (c === a);
        finals = [a, b, c];
      }

      reels.forEach(r => r.spin());
      await Engine.sleep(500); // 回転が見えてから受付開始

      for (let k = 0; k < 3; k++) {
        if (k === 2 && outcome.reach) {
          // 3リール目は止めずにリーチ演出へ
          Engine.sound('reach');
          Engine.flash('#fff', 160);
          Engine.el(ui.s, 'burst', 'リーチ!!');
          ui.push.textContent = '';
          await Engine.sleep(1400);
          return { reach: true };
        }
        await Engine.Input.waitPress();
        Engine.sound('button');
        await reels[k].stopAt(finals[k]);
        Engine.sound('stop');
        await Engine.sleep(120);
      }

      // リーチ不成立(そろわず停止)
      await Engine.sleep(400);
      const b = Engine.el(ui.s, 'burst', 'そろわない…!?');
      b.style.color = '#b0bec5';
      Engine.sound('miss');
      await Engine.sleep(1500);
      return { reach: false };
    },

    // ミニゲーム後、3リール目を止める(success=そろう / 失敗=1コマずれ)
    async resolveThird(success) {
      const syms = symbols();
      const ui = buildScene();
      const mi = lastMemberIdx;
      reels[0].freezeAt(mi);
      reels[1].freezeAt(mi);
      reels[2].spin();
      ui.push.textContent = success ? 'キマるか──!?' : 'どうだ──!?';
      await Engine.sleep(1100);
      const target = success ? mi : (mi + 1) % syms.length;
      await reels[2].stopAt(target);
      Engine.sound('stop');
      if (success) {
        Engine.flash('#fff', 200);
        Engine.shake();
        Engine.sound('bigwin');
        Engine.confetti(220);
        Engine.el(ui.s, 'burst', '大当たり!!');
        await Engine.sleep(2200);
      } else {
        const b = Engine.el(ui.s, 'burst', 'あと1コマ…!');
        b.style.color = '#b0bec5';
        Engine.sound('lose');
        await Engine.sleep(1600);
      }
    },
  };
})();
