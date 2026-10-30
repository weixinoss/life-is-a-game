<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_admin_page();

$weathers = ['sunny' => '晴', 'cloudy' => '多云', 'rain' => '雨', 'storm' => '暴雨',
    'hot' => '酷暑', 'snow' => '雪', 'cold' => '严寒', 'fog' => '雾'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $clock   = preg_match('/^\d{2}:\d{2}$/', (string)($_POST['clock'] ?? '')) ? (string)$_POST['clock'] : '07:00';
    $weather = array_key_exists((string)($_POST['weather'] ?? ''), $weathers) ? (string)$_POST['weather'] : 'sunny';
    $price   = max(0.5, min(3.0, (float)($_POST['price'] ?? 1)));
    $night   = !empty($_POST['night']) ? 1 : 0;
    $fest    = trim((string)($_POST['festival'] ?? ''));
    $note    = mb_substr(trim((string)($_POST['note'] ?? '')), 0, 200);
    run('UPDATE ' . t('world') . ' SET game_clock=?,weather=?,is_night=?,price_index=?,festival=?,note=?,tick_at=? WHERE id=1',
        [$clock, $weather, $night, $price, $fest, $note, date('Y-m-d H:i:s')]);
    audit('world.update', '', "{$clock} {$weather} {$price}");
    flash('世界状态已更新，所有在线玩家下次请求即生效。');
    header('Location: world.php');
    exit;
}

$w = one('SELECT * FROM ' . t('world') . ' WHERE id=1');
if (!$w) {
    run('INSERT INTO ' . t('world') . ' (id,game_clock,weather,is_night,price_index,online_cnt,festival,tick_at,note) VALUES (1,"07:00","sunny",0,1,0,"",?,"")', [date('Y-m-d H:i:s')]);
    $w = one('SELECT * FROM ' . t('world') . ' WHERE id=1');
}

render_head('世界状态', 'world');
?>
<div class="panel">
  <h2>当前状态</h2>
  <div class="inline" style="gap:26px">
    <div><span class="muted">时刻</span><div class="mono" style="font-size:17px"><?= h($w['game_clock']) ?><?= (int)$w['is_night'] ? ' · 夜' : ' · 昼' ?></div></div>
    <div><span class="muted">天气</span><div style="font-size:15px"><?= h($weathers[$w['weather']] ?? $w['weather']) ?></div></div>
    <div><span class="muted">物价</span><div class="mono" style="font-size:15px"><?= h($w['price_index']) ?></div></div>
    <div><span class="muted">在线</span><div style="font-size:15px"><?= nf($w['online_cnt']) ?></div></div>
    <div><span class="muted">上次推进</span><div class="muted mono"><?= h($w['tick_at']) ?></div></div>
  </div>
</div>

<form class="panel" method="post">
  <h2>手动干预</h2>
  <p class="muted" style="margin:-6px 0 14px">
    正常情况下世界会自己走：每 30 分钟重抽一次天气，物价按全服平均资产浮动。
    这里可以强推一次，用于节日活动或事故处理。
  </p>
  <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
  <div class="row3">
    <div><label style="margin-top:0">游戏内时刻（HH:MM）</label><input type="text" name="clock" value="<?= h($w['game_clock']) ?>" placeholder="07:00"></div>
    <div><label style="margin-top:0">天气</label>
      <select name="weather">
        <?php foreach ($weathers as $k => $v): ?>
          <option value="<?= h($k) ?>" <?= $w['weather'] === $k ? 'selected' : '' ?>><?= h($v) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div><label style="margin-top:0">物价系数（0.5 - 3.0）</label><input type="number" name="price" step="0.001" min="0.5" max="3" value="<?= h($w['price_index']) ?>"></div>
  </div>
  <div class="row2" style="margin-top:6px">
    <div><label>节气 / 节日（留空清除）</label><input type="text" name="festival" value="<?= h($w['festival']) ?>" placeholder="如：中元"></div>
    <div><label>公告备注</label><input type="text" name="note" value="<?= h($w['note']) ?>" placeholder="给玩家看的一句话"></div>
  </div>
  <label style="display:flex;align-items:center;gap:8px;margin-top:14px">
    <input type="checkbox" name="night" value="1" <?= (int)$w['is_night'] ? 'checked' : '' ?> style="width:auto"> 标记为夜晚（夜间掷骰 -1）
  </label>
  <div class="inline" style="margin-top:18px">
    <button class="btn pri" type="submit">保存并广播</button>
  </div>
</form>

<div class="panel">
  <h2>天气说明</h2>
  <table>
    <thead><tr><th>天气</th><th>掷骰修正</th><th>体力</th><th>收入</th></tr></thead>
    <tbody>
      <tr><td>晴 sunny</td><td class="mono">0</td><td class="mono">0</td><td class="mono">×1.00</td></tr>
      <tr><td>多云 cloudy</td><td class="mono">0</td><td class="mono">0</td><td class="mono">×0.95</td></tr>
      <tr><td>雨 rain</td><td class="mono">-1</td><td class="mono">-4</td><td class="mono">×0.85</td></tr>
      <tr><td>暴雨 storm</td><td class="mono">-2</td><td class="mono">-8</td><td class="mono">×0.70</td></tr>
      <tr><td>酷暑 hot</td><td class="mono">-1</td><td class="mono">-6</td><td class="mono">×0.90</td></tr>
      <tr><td>雪 snow</td><td class="mono">-1</td><td class="mono">-5</td><td class="mono">×0.80</td></tr>
      <tr><td>严寒 cold</td><td class="mono">-1</td><td class="mono">-6</td><td class="mono">×0.85</td></tr>
      <tr><td>雾 fog</td><td class="mono">-1</td><td class="mono">-2</td><td class="mono">×0.90</td></tr>
    </tbody>
  </table>
  <p class="muted" style="margin-bottom:0">以上为游戏内 Ti 表的实际数值，改这里只是覆盖世界广播，不改动玩法常量。</p>
</div>
<?php render_foot(); ?>
