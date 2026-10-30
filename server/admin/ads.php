<?php
/**
 * ============================================================
 *  广告位管理
 *  ------------------------------------------------------------
 *  对应棋盘中央广场的三类位置（js/life/77-plaza.js）：
 *    tower  社会时钟塔 塔身四面，2.15×2.35 米灯箱，画面比例约 1:1.1
 *    pillar 四柱灯箱   每根柱子前后各一面，共 8 面，画面比例约 2:3
 *    ground 地面地贴   四块 3×3 米，画面正方形
 *
 *  前台只读不写：游戏启动时请求 action=ads.list，拿不到就用内置文案。
 *  所以这里改完立刻生效，不用重新部署前端。
 * ============================================================
 */
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
$me = require_admin_page();

const AD_SLOTS = [
    'tower'  => ['社会时钟塔 · 塔身四面', 4, '2.15 × 2.35 米 / 画布 512×640'],
    'pillar' => ['四柱灯箱 · 八面', 8, '1.16 × 1.72 米 / 画布 512×768'],
    'ground' => ['地面地贴 · 四块', 4, '3 × 3 米 / 画布 512×512'],
];

/** 洗一遍颜色，非法值回落到默认 */
function ad_color(string $v, string $dft): string
{
    $v = trim($v);
    return preg_match('/^#[0-9a-fA-F]{6}$/', $v) ? strtolower($v) : $dft;
}

/** 只留 http(s) 链接，其它（javascript: 等）一律清空 */
function ad_link(string $v): string
{
    $v = trim($v);
    if ($v === '') {
        return '';
    }
    if (!preg_match('#^https?://#i', $v)) {
        return '';
    }
    return mb_substr($v, 0, 191);
}

function ad_dt(string $v): ?string
{
    $v = trim($v);
    if ($v === '') {
        return null;
    }
    $ts = strtotime($v);
    return $ts ? date('Y-m-d H:i:s', $ts) : null;
}

// ------------------------------------------------------------
// 操作
// ------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $do = (string)($_POST['do'] ?? '');
    $id = (int)($_POST['id'] ?? 0);

    if ($do === 'del' && $id > 0) {
        run('DELETE FROM ' . t('ads') . ' WHERE id=?', [$id]);
        audit('ad.del', (string)$id);
        flash('已删除该广告。');
    } elseif ($do === 'toggle' && $id > 0) {
        run('UPDATE ' . t('ads') . ' SET status=1-status, updated_at=? WHERE id=?', [date('Y-m-d H:i:s'), $id]);
        audit('ad.toggle', (string)$id);
        flash('已切换上下架状态。');
    } elseif ($do === 'reset' && $id > 0) {
        run('UPDATE ' . t('ads') . ' SET impressions=0, clicks=0 WHERE id=?', [$id]);
        audit('ad.reset', (string)$id);
        flash('曝光与点击已清零。');
    } elseif ($do === 'save') {
        $slot = (string)($_POST['slot'] ?? 'pillar');
        if (!isset(AD_SLOTS[$slot])) {
            $slot = 'pillar';
        }
        $maxPos = AD_SLOTS[$slot][1] - 1;
        $pos    = max(0, min($maxPos, (int)($_POST['pos'] ?? 0)));

        $row = [
            'slot'     => $slot,
            'pos'      => $pos,
            'brand'    => mb_substr(trim((string)($_POST['brand'] ?? '')), 0, 24),
            'title'    => mb_substr(trim((string)($_POST['title'] ?? '')), 0, 48),
            'subtitle' => mb_substr(trim((string)($_POST['subtitle'] ?? '')), 0, 48),
            'note'     => mb_substr(trim((string)($_POST['note'] ?? '')), 0, 48),
            'bg'       => ad_color((string)($_POST['bg'] ?? ''), '#fdf8ee'),
            'fg'       => ad_color((string)($_POST['fg'] ?? ''), '#241f1a'),
            'accent'   => ad_color((string)($_POST['accent'] ?? ''), '#f97316'),
            'link'     => ad_link((string)($_POST['link'] ?? '')),
            'weight'   => max(0, min(999, (int)($_POST['weight'] ?? 10))),
            'status'   => !empty($_POST['status']) ? 1 : 0,
            'start_at' => ad_dt((string)($_POST['start_at'] ?? '')),
            'end_at'   => ad_dt((string)($_POST['end_at'] ?? '')),
        ];

        if ($row['title'] === '') {
            flash('标题不能为空 —— 灯箱上总得有一句话。', 'bad');
        } else {
            $now = date('Y-m-d H:i:s');
            if ($id > 0) {
                run(
                    'UPDATE ' . t('ads') . ' SET slot=?,pos=?,brand=?,title=?,subtitle=?,note=?,bg=?,fg=?,accent=?,link=?,
                        weight=?,status=?,start_at=?,end_at=?,updated_at=? WHERE id=?',
                    [
                        $row['slot'], $row['pos'], $row['brand'], $row['title'], $row['subtitle'], $row['note'],
                        $row['bg'], $row['fg'], $row['accent'], $row['link'], $row['weight'], $row['status'],
                        $row['start_at'], $row['end_at'], $now, $id,
                    ]
                );
                audit('ad.save', (string)$id, $row['title']);
                flash('已保存。前台下次刷新即生效。');
            } else {
                run(
                    'INSERT INTO ' . t('ads') . '
                        (slot,pos,brand,title,subtitle,note,bg,fg,accent,link,weight,status,start_at,end_at,created_at,updated_at)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                    [
                        $row['slot'], $row['pos'], $row['brand'], $row['title'], $row['subtitle'], $row['note'],
                        $row['bg'], $row['fg'], $row['accent'], $row['link'], $row['weight'], $row['status'],
                        $row['start_at'], $row['end_at'], $now, $now,
                    ]
                );
                audit('ad.add', (string)db()->lastInsertId(), $row['title']);
                flash('已添加。前台下次刷新即生效。');
            }
        }
    }
    header('Location: ads.php');
    exit;
}

// ------------------------------------------------------------
// 读数据
// ------------------------------------------------------------
$editId = (int)($_GET['edit'] ?? 0);
$edit   = null;
if ($editId > 0) {
    $edit = one('SELECT * FROM ' . t('ads') . ' WHERE id=?', [$editId]);
}
$rows = [];
try {
    $rows = all('SELECT * FROM ' . t('ads') . ' ORDER BY slot ASC, pos ASC, weight DESC, id ASC');
} catch (Throwable $e) {
    flash('ads 表还不存在，请到「系统设置 → 检查并修复数据表」先建表。', 'bad');
}

$defaults = [
    'slot' => 'pillar', 'pos' => 0, 'brand' => '', 'title' => '', 'subtitle' => '', 'note' => '',
    'bg' => '#fdf8ee', 'fg' => '#241f1a', 'accent' => '#f97316', 'link' => '',
    'weight' => 10, 'status' => 1, 'start_at' => '', 'end_at' => '',
];
$v = $edit ? array_merge($defaults, $edit) : $defaults;

render_head('广告位', 'ads');
?>

<div class="cards">
  <?php
  $totalImp = 0;
  $totalClk = 0;
  $bySlot   = ['tower' => 0, 'pillar' => 0, 'ground' => 0];
  foreach ($rows as $r) {
      $totalImp += (int)$r['impressions'];
      $totalClk += (int)$r['clicks'];
      $bySlot[$r['slot']] = ($bySlot[$r['slot']] ?? 0) + 1;
  }
  ?>
  <div class="kpi"><div class="k">广告条数</div><div class="n"><?= nf(count($rows)) ?></div><div class="s">塔 <?= (int)$bySlot['tower'] ?> · 灯箱 <?= (int)$bySlot['pillar'] ?> · 地贴 <?= (int)$bySlot['ground'] ?></div></div>
  <div class="kpi"><div class="k">累计曝光</div><div class="n"><?= nf($totalImp) ?></div><div class="s">每次进入游戏计一次</div></div>
  <div class="kpi"><div class="k">累计点击</div><div class="n"><?= nf($totalClk) ?></div><div class="s">点击率 <?= $totalImp > 0 ? round($totalClk / $totalImp * 100, 2) : '0.00' ?>%</div></div>
  <div class="kpi"><div class="k">在架</div><div class="n"><?= nf(count(array_filter($rows, fn($r) => (int)$r['status'] === 1))) ?></div><div class="s">下架的不展示</div></div>
</div>

<form class="panel" method="post" id="adForm">
  <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
  <input type="hidden" name="do" value="save">
  <input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
  <h2><?= $edit ? '编辑广告 #' . (int)$edit['id'] : '新增广告' ?></h2>

  <div class="row">
    <div>
      <label>位置</label>
      <select name="slot" id="slotSel">
        <?php foreach (AD_SLOTS as $k => $s): ?>
          <option value="<?= h($k) ?>" <?= $v['slot'] === $k ? 'selected' : '' ?>><?= h($s[0]) ?></option>
        <?php endforeach; ?>
      </select>
      <p class="muted" style="margin:6px 0 0;font-size:12px" id="slotHint"></p>
    </div>
    <div>
      <label>摆位序号</label>
      <input type="number" name="pos" min="0" max="7" value="<?= (int)$v['pos'] ?>">
      <p class="muted" style="margin:6px 0 0;font-size:12px">同一位置有多条时，按权重轮播</p>
    </div>
    <div>
      <label>权重</label>
      <input type="number" name="weight" min="0" max="999" value="<?= (int)$v['weight'] ?>">
    </div>
  </div>

  <div class="row">
    <div>
      <label>角标（左上小标签，可空）</label>
      <input type="text" name="brand" maxlength="24" value="<?= h($v['brand']) ?>" placeholder="例：相亲角">
    </div>
    <div>
      <label>标题（必填）</label>
      <input type="text" name="title" maxlength="48" value="<?= h($v['title']) ?>" placeholder="例：有房有车优先">
    </div>
  </div>

  <div class="row">
    <div>
      <label>副标题</label>
      <input type="text" name="subtitle" maxlength="48" value="<?= h($v['subtitle']) ?>" placeholder="例：父母替你排队的第三年">
    </div>
    <div>
      <label>底部小字（留空用默认免责声明）</label>
      <input type="text" name="note" maxlength="48" value="<?= h($v['note']) ?>" placeholder="游戏内虚构 · 与现实品牌无关">
    </div>
  </div>

  <div class="row">
    <div>
      <label>底色</label>
      <input type="color" name="bg" value="<?= h($v['bg']) ?>" style="height:42px;padding:4px">
    </div>
    <div>
      <label>文字色</label>
      <input type="color" name="fg" value="<?= h($v['fg']) ?>" style="height:42px;padding:4px">
    </div>
    <div>
      <label>强调色</label>
      <input type="color" name="accent" value="<?= h($v['accent']) ?>" style="height:42px;padding:4px">
    </div>
  </div>

  <div class="row">
    <div>
      <label>开始时间（可空）</label>
      <input type="datetime-local" name="start_at" value="<?= h($v['start_at'] ? date('Y-m-d\TH:i', strtotime((string)$v['start_at'])) : '') ?>">
    </div>
    <div>
      <label>结束时间（可空）</label>
      <input type="datetime-local" name="end_at" value="<?= h($v['end_at'] ? date('Y-m-d\TH:i', strtotime((string)$v['end_at'])) : '') ?>">
    </div>
    <div>
      <label>链接（仅 http/https，可空）</label>
      <input type="text" name="link" maxlength="191" value="<?= h($v['link']) ?>" placeholder="https://">
    </div>
  </div>

  <label style="display:flex;align-items:center;gap:8px;margin-top:16px">
    <input type="checkbox" name="status" value="1" <?= (int)$v['status'] === 1 ? 'checked' : '' ?> style="width:auto">
    上架（不勾选则前台不展示）
  </label>

  <div class="inline" style="margin-top:20px">
    <button class="btn pri" type="submit"><?= $edit ? '保存修改' : '添加' ?></button>
    <?php if ($edit): ?><a class="btn" href="ads.php">取消编辑</a><?php endif; ?>
  </div>
</form>

<div class="panel">
  <h2>全部广告</h2>
  <?php if (!$rows): ?>
    <div class="empty">还没有广告。上面填一条，前台中央广场立刻就有内容了。</div>
  <?php else: ?>
  <table>
    <thead>
      <tr><th>#</th><th>位置</th><th>画面</th><th>标题 / 副标题</th><th>排期</th><th>曝光</th><th>状态</th><th>操作</th></tr>
    </thead>
    <tbody>
    <?php foreach ($rows as $r): ?>
      <tr>
        <td class="mono muted"><?= (int)$r['id'] ?></td>
        <td>
          <span class="tag"><?= h(AD_SLOTS[$r['slot']][0] ?? $r['slot']) ?></span>
          <div class="muted mono" style="font-size:11px">pos <?= (int)$r['pos'] ?> · w<?= (int)$r['weight'] ?></div>
        </td>
        <td>
          <div style="width:78px;padding:7px 8px;border-radius:6px;border:1px solid rgba(0,0,0,.12);background:<?= h($r['bg']) ?>;color:<?= h($r['fg']) ?>">
            <?php if ($r['brand']): ?><div style="font-size:9px;color:<?= h($r['accent']) ?>;font-weight:700"><?= h($r['brand']) ?></div><?php endif; ?>
            <div style="font-size:11px;font-weight:700;line-height:1.25"><?= h(mb_substr((string)$r['title'], 0, 10)) ?></div>
          </div>
        </td>
        <td>
          <div style="font-weight:600"><?= h($r['title']) ?></div>
          <div class="muted" style="font-size:12px"><?= h($r['subtitle'] ?: '—') ?></div>
        </td>
        <td class="muted mono" style="font-size:11px">
          <?= $r['start_at'] ? h(substr((string)$r['start_at'], 0, 16)) : '即时' ?>
          <br>→ <?= $r['end_at'] ? h(substr((string)$r['end_at'], 0, 16)) : '长期' ?>
        </td>
        <td class="mono">
          <?= nf((int)$r['impressions']) ?>
          <div class="muted" style="font-size:11px">点 <?= nf((int)$r['clicks']) ?></div>
        </td>
        <td>
          <?php if ((int)$r['status'] === 1): ?>
            <span class="tag ok">在架</span>
          <?php else: ?>
            <span class="tag mute">下架</span>
          <?php endif; ?>
        </td>
        <td>
          <div class="inline" style="gap:6px">
            <a class="btn" href="ads.php?edit=<?= (int)$r['id'] ?>">编辑</a>
            <form method="post" style="display:inline">
              <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
              <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
              <button class="btn" type="submit" name="do" value="toggle"><?= (int)$r['status'] === 1 ? '下架' : '上架' ?></button>
            </form>
            <form method="post" style="display:inline" onsubmit="return confirm('确认删除这条广告？')">
              <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
              <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
              <button class="btn" type="submit" name="do" value="del">删除</button>
            </form>
          </div>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>

<script>
(function () {
  var hints = <?= json_encode(array_map(fn($s) => $s[0] . ' · ' . $s[2] . ' · 最多 ' . $s[1] . ' 条同显', AD_SLOTS), JSON_UNESCAPED_UNICODE) ?>;
  var sel = document.getElementById('slotSel');
  var hint = document.getElementById('slotHint');
  function sync() {
    hint.textContent = hints[sel.value] || '';
    var pos = document.querySelector('input[name=pos]');
    var max = (sel.value === 'pillar') ? 7 : 3;
    pos.max = max;
    if (+pos.value > max) { pos.value = max; }
  }
  sel.addEventListener('change', sync);
  sync();
})();
</script>
<?php render_foot(); ?>
