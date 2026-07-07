// ============================================================
// MID POP ワンボタン・パニック! プロトタイプ設定ファイル
// ここの数値を書き換えて保存 → ブラウザを再読み込みで反映されます
// ============================================================
window.CONFIG = {

  // ---------- メンバー ----------
  // game: 担当ミニゲームのID / face・stand: 画像ファイル名(assets/images/内)
  // anim: 待機画面・スロット両サイドのコマ送りアニメ(3枚目ができたら追加するだけ)
  members: [
    { id: 'A', name: '明媚',   color: '#C8102E', game: 'tokimeki',
      face: 'face_meibi.png',    stand: 'stand_meibi.png',    standKime: 'stand_meibi_kime.png',
      anim: ['stand_meibi.png', 'stand_meibi_kime.png'] },    // クリムゾンレッド/恋愛シム
    { id: 'B', name: '葵',     color: '#5110b3', game: 'beat',
      face: 'face_aoi.png',      stand: 'stand_aoi.png',      standKime: 'stand_aoi_kime.png',
      anim: ['stand_aoi.png', 'stand_aoi_kime.png'] },        // パープル/リズム(ポップン風)
    { id: 'C', name: '蕎麦',   color: '#ffff00', game: 'issen',
      face: 'face_soba.png',     stand: 'stand_soba.png',     standKime: 'stand_soba_kime.png',
      anim: ['stand_soba.png', 'stand_soba_kime.png'] },      // イエロー/反射(格闘ゲーム)
    { id: 'D', name: '溺惑',   color: '#98fafa', game: 'charge',
      face: 'face_dekiwaku.png', stand: 'stand_dekiwaku.png', standKime: 'stand_dekiwaku_kime.png',
      anim: ['stand_dekiwaku.png', 'stand_dekiwaku_kime.png'] }, // スカイブルー/ゲージ(歯医者)
  ],

  // コマ送りアニメの切替間隔(ms)
  anims: { intervalMs: 600 },

  // ---------- 画像素材(共通) ----------
  // null = 未作成(仮図形で表示)。素材ができたらファイル名を入れる
  images: {
    dir: 'assets/images/',       // 格納フォルダ
    bgAttract:   'bg_attract.png',
    bgSlot:      'bg_slot.png',
    bgCutin:     'bg_cutin.png', // カットイン集中線(拡大縮小/点滅アニメ)
    bgResult:    'bg_result.png',
    bgResultLow: 'bg_result_low.png',
    frameSlot:   'frame_slot.png',
    badgePrice:  'badge_price.png',
    guidePush:   'guide_push.png',
    logoBanner:  null,           // タイトルロゴ装飾(未作成: CSS文字のみ)
  },

  // ---------- スロット ----------
  slot: {
    reachRate: 0.7,          // リーチ(2つ揃い)になる確率 0〜1
    memberWeights: [1, 1, 1, 1], // リーチ時に誰のゲームになるかの重み
    spinSpeed: 42,           // リール回転速度(px/フレーム)
    // 絵柄はメンバー4人の顔のみ(チャンス目は廃止)
  },

  // ---------- 復活チャレンジ ----------
  // 回数無制限。挑戦ごとに難化する(設定は minigames.revival)

  // ---------- 賞品ランク ----------
  ranks: {
    1: { stars: '★',       name: 'ざんねん賞', prize: '参加賞(ミニカード)' },
    2: { stars: '★★',     name: '小当たり',   prize: 'ランダムトレカ 1枚' },
    3: { stars: '★★★',   name: '当たり',     prize: '限定ステッカー・缶バッジ' },
    4: { stars: '★★★★', name: '大当たり',   prize: 'サイン入りチェキ' },
  },
  // ボーナス「4人まとめてキメろ!」の成功人数→上乗せ
  bonusPrizes: {
    2: '上乗せ(小)',
    3: '上乗せ(大)',
    4: '特別賞!!',
  },

  // ミニゲームの判定 → 賞品ランクへの変換
  resultMap: { perfect: 4, good: 3, miss: 2, fail: 1 },

  // ---------- ミニゲーム難易度・素材 ----------
  minigames: {
    issen: {                 // 一閃カウンター(格闘ゲーム/反射神経)
      minWait: 2000,         // Fight!! までの最短(ms)
      maxWait: 6000,         // Fight!! までの最長(ms)
      perfectMs: 250,        // これ以内=K.O.(大成功)
      goodMs: 450,           // これ以内=HIT(成功)
      timeoutMs: 1500,       // 反応なし=失敗
      images: {
        bg:    'bg_issen.png',
        fight: 'stand_soba_fight.png',  // 構え
        win:   'stand_soba_win.png',    // パンチ
        lose:  'stand_soba_lose.png',   // やられ
        foe:   'foe_issen.png',
        fx:    'fx_issen.png',          // ヒットエフェクト
      },
    },
    beat: {                  // ジャスト・ビート(リズム)
      bpm: 120,              // 楽曲テンポ。差し替え時はここを曲に合わせる
      perfectMs: 90,         // JUSTからのズレ許容(大成功)
      goodMs: 200,           // 成功
      // 踊りのコマ送り(差分が増えたらここに追加するだけ)
      danceFrames: ['stand_aoi.png', 'stand_aoi_kime.png'],
      images: {
        bg:       'bg_beat.png',
        note:     'note_beat.png',
        ring:     'ring_beat.png',
        speakerL: 'left_speaker_beat.png',
        speakerR: 'right_speaker_beat.png',
        speakerC: 'speaker_beat.png',   // 中央スピーカー(テンポに合わせて振動)
      },
    },
    charge: {                // フルパワーチャージ(歯医者/ゲージ)
      duration: 1800,        // ゲージが満タンになるまでの時間(ms)短いほど難しい
      okStart: 0.75,         // ここ以上でOK(成功)
      justStart: 0.90,       // JUSTゾーン開始(右端ギリギリを狙う)
      justEnd: 0.98,         // JUSTゾーン終了(ここ超え〜満タンは「削りすぎ」)
      typeMs: 70,            // 会話の1文字表示間隔(ms)
      intro: [               // スタート時の掛け合い(この後、無言でドリルを取り出す)
        { speaker: '溺惑', text: '今日はどうされましたか?' },
        { speaker: '歯',   text: '歯が痛くて...' },
      ],
      // 素材ごとの見かけサイズ補正(ready差分は余白が大きいので拡大)
      doctorScale: { doctorReady: 2.4, doctorWin: 2.2 },
      images: {
        bg:            'bg_charge.png',
        toothNormal:   'tooth_normal_alpha.png',   // 通常(黒背景を透過処理済み)
        toothCleaning: 'tooth_cleaning_alpha.png', // 治療中(同上)
        toothClean:    'tooth_clean.png',          // ピカピカ成功
        toothBroken:   'tooth_broken.png',         // 削りすぎ失敗
        doctorStart:   'charge_dekiwaku.png',      // スタート時
        doctorReady:   'ready_dekiwaku.png',       // ドリルを取り出す
        doctorTreat:   'treatment_dekiwaku.png',   // 削っている
        doctorWin:     'win_dekiwaku.png',
        doctorLose:    'lose_dekiwaku.png',
      },
    },
    tokimeki: {              // ときめきトーク(恋愛シム/確率判定)
      successRate: 0.5,      // 当選確率 0〜1
      spinInterval: 90,      // 選択肢が切り替わる速さ(ms)
      typeMs: 60,            // セリフの1文字表示間隔(ms)
      scenario: {
        speaker: '明媚',
        prompt: '今日のライブ、どうだったかな...?',
        replyLabel: 'あなた',
        choices: ['最高だったよ!!', 'まあまあかな', '見てなかった'],
        correct: 0,          // 正解の選択肢番号(0はじまり)
      },
      images: {
        bg:    'bg_tokimeki.png',
        talk:  'stand_meibi_talk.png',   // 通常
        blush: 'stand_meibi_blush.png',  // 照れ(成功)
        sad:   'stand_meibi_sad.png',    // 残念(失敗)
      },
    },
    bonus: {                 // 4人まとめてキメろ!(高難度・実力)
      baseSpeed: 0.55,       // 針の回転速度(回転/秒)1人目
      accel: 1.25,           // 1人ごとの加速倍率
      zoneDeg: 70,           // ジャストゾーンの角度(1人目)
      zoneShrink: 0.78,      // 1人ごとのゾーン縮小率
      timeoutMs: 5000,       // 押さなければ失敗
    },
    revival: {               // 復活チャレンジ(確率+実力・回数無制限)
      traverseMs: 900,       // マーカー片道の速さ(ms)小さいほど難しい
      zoneWidth: 0.22,       // ヒットゾーン幅(バー全体=1)→実質勝率の調整
      zoneShrinkPerRetry: 0.65, // 挑戦ごとのゾーン縮小率(2回目=×0.65, 3回目=×0.42...)
      speedUpPerRetry: 0.85,    // 挑戦ごとのマーカー加速率(小さいほど速くなる)
      timeoutMs: 6000,
    },
  },

  // ---------- サウンド差し替え ----------
  // file にパスを入れると差し替え(例: 'assets/sounds/win.mp3')
  // null のあいだは内蔵の仮シンセ音が鳴ります
  sounds: {
    button:  { file: null, volume: 1 },  // ボタン押下
    stop:    { file: null, volume: 1 },  // リール停止
    reach:   { file: null, volume: 1 },  // リーチ!
    win:     { file: null, volume: 1 },  // 当たり
    bigwin:  { file: null, volume: 1 },  // 大当たり
    lose:    { file: null, volume: 1 },  // 失敗
    tick:    { file: null, volume: 1 },  // カウントダウン
    go:      { file: null, volume: 1 },  // 合図
    perfect: { file: null, volume: 1 },  // 大成功
    good:    { file: null, volume: 1 },  // 成功
    miss:    { file: null, volume: 1 },  // ミス
    revive:  { file: null, volume: 1 },  // 復活成功(リトライ)
    charge:  { file: null, volume: 1 },  // チャージ中
    type:    { file: null, volume: 1 },  // 文字送り
    // BGMも同様に指定可(ループ再生)
    bgmAttract: { file: null, volume: 0.6, loop: true },
    bgmSlot:    { file: null, volume: 0.6, loop: true },
    bgmResult:  { file: null, volume: 0.6, loop: true },
  },

  // ---------- レイアウト微調整 ----------
  // Midjourney素材の構図ズレに合わせて位置(px)とスケールを調整
  // x,y は画面(1920×1080)上の中心座標
  layout: {
    title:     { x: 960, y: 180, scale: 1.25 },  // 待機画面ロゴ
    pushGuide: { x: 960, y: 950, scale: 1 },     // PUSH!ガイド
    lineup:    { x: 960, y: 620, scale: 1 },     // 待機画面の4人整列(大きめ表示)
    slotFrame: { x: 960, y: 550, scale: 0.97 },  // スロット筐体(110%調整済み)
    slotSideL: { x: 180, y: 700, scale: 1 },     // スロット左サイドのキャラ
    slotSideR: { x: 1740, y: 700, scale: 1 },    // スロット右サイドのキャラ
    // リール窓の位置: frame_slot.png(1456×816)内の座標。
    // 画像を差し替えたら窓に合わせてここを再計測・調整する
    reels: {
      centers: [
        { x: 445,  y: 341 },   // 左リール窓の中心(絵柄ズレ対応で30px下げ)
        { x: 744,  y: 337 },   // 中リール窓の中心
        { x: 1058, y: 342 },   // 右リール窓の中心
      ],
      width: 230,              // リール窓の幅
      height: 260,             // リール窓の高さ
    },
  },

  // ---------- デバッグ ----------
  debug: false,   // trueで起動時からグリッド表示(Dキーでも切替)
};
