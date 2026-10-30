<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_admin_page();

$q      = trim((string)($_GET['q'] ?? ''));
$job    = trim((string)($_GET['job'] ?? ''));
$closed = (string)($_GET['closed'] ?? '');
$page   = max(1, (int)($_GET['page'] ?? 1));
$size   = 25;

$where = '1=1';
$args  = [];
if ($q !== '') {
    $where .= ' AND (u.username LIKE ? OR u.nickname LIKE ? OR l.job_name LIKE ?)';
    array_push($args, "%{$q}%", "%{$q}%", "%{$q}%");
}
if ($job !== '') {
    $where .= ' AND l.job=?';
    $args[] = $job;
}
if ($closed === '0' || $closed === '1') {
    $where .= ' AND l.closed=?';
    $args[] = (int)$closed;
}

$total = (int)scalar('SELECT COUNT(*) FROM ' . t('lives') . ' l JOIN ' . t('users') . ' u ON u.id=l.uid WHERE ' . $where, $args);
$pages = max(1, (int)ceil($total / $size));
$page  = min($page, $pages);
$rows  = all(
    'SELECT l.*, u.username, u.nickname FROM ' . t('lives') . ' l JOIN ' . t('users') . ' u ON u.id=l.uid
     WHERE ' . $where . ' ORDER BY l.id DESC LIMIT ' . (($page - 1) * $size) . ',' . $size,
    $args
);
$jobs = all('SELECT DISTINCT job, job_name FROM ' . t('lives') . ' WHERE job<>"" ORDER BY job_name ASC');

render_head('对局记录', 'lives');
?>
<form class="panel" method="get">
  <div class="row3">
    <div><label style="margin-top:0">关键词（玩家 / 身份）</label><input type="text" name="q" value="<?= h($q) ?>"></div>
    <div><label style="margin-top:0">身份</label>
      <select name="job">
        <option value="">全部</option>
        <?php foreach ($jobs as $j): ?>
          <option value="<?= h($j['job']) ?>" <?= $job === $j['job'] ? 'selected' : '' ?>><?= h($j['job_name']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div><label style="margin-top:0">状态</label>
      <select name="closed">
        <option value="">全部</option>
        <option value="1" <?= $closed === '1' ? 'selected' : '' ?>>已结算</option>
        <option value="0" <?= $closed === '0' ? 'selected' : '' ?>>进行中</option>
      </select>
    </div>
  </div>
  <div class="inline" style="margin-top:14px">
    <button class="btn pri" type="submit">筛选</button>
    <a class="btn" href="lives.php">重置</a>
    <span class="muted" style="margin-left:auto">共 <?= nf($total) ?> 局</span>
  </div>
</form>

<div class="panel">
  <table>
    <thead><tr><th>ID</th><th>玩家</th><th>身份</th><th>世</th><th>天数</th><th>资产</th><th>评分</th><th>体面低头</th><th>善举</th><th>省份</th><th>结局</th><th>状态</th><th>开始</th></tr></thead>
    <tbody>
    <?php if (!$rows): ?>
      <tr><td colspan="13"><div class="empty">没有匹配的记录。</div></td></tr>
    <?php endif; ?>
    <?php foreach ($rows as $r): ?>
      <tr>
        <td class="mono">#<?= (int)$r['id'] ?></td>
        <td><?= h($r['nickname'] ?: $r['username']) ?></td>
        <td><?= h($r['job_name']) ?></td>
        <td><?= (int)$r['season_no'] ?></td>
        <td class="mono"><?= (int)$r['day'] ?></td>
        <td class="mono"><?= nf($r['money']) ?></td>
        <td class="mono"><?= (int)$r['score'] ?></td>
        <td class="mono"><?= (int)$r['dignity_low'] ?></td>
        <td class="mono"><?= (int)$r['karma_cnt'] ?></td>
        <td class="muted"><?= h($r['province'] ?: '—') ?></td>
        <td><?= h($r['ending'] ?: '—') ?></td>
        <td><?= (int)$r['closed'] === 1 ? '<span class="tag ok">已结算</span>' : '<span class="tag warn">进行中</span>' ?></td>
        <td class="muted mono"><?= h(substr((string)$r['started_at'], 0, 16)) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>

<?php if ($pages > 1): ?>
<div class="panel inline" style="justify-content:center">
  <?php for ($i = 1; $i <= $pages; $i++): ?>
    <?php if ($i === 1 || $i === $pages || abs($i - $page) <= 2): ?>
      <a class="btn sm <?= $i === $page ? 'pri' : '' ?>" href="?page=<?= $i ?>&q=<?= urlencode($q) ?>&job=<?= urlencode($job) ?>&closed=<?= urlencode($closed) ?>"><?= $i ?></a>
    <?php elseif (abs($i - $page) === 3): ?><span class="muted">…</span><?php endif; ?>
  <?php endfor; ?>
</div>
<?php endif; ?>

<div class="panel">
  <h2>身份通关率</h2>
  <?php $js = all('SELECT job_name, COUNT(*) plays, ROUND(AVG(score),1) avg_score, ROUND(AVG(day),1) avg_day, SUM(CASE WHEN score>=60 THEN 1 ELSE 0 END) pass_cnt FROM ' . t('lives') . ' WHERE closed=1 AND job_name<>"" GROUP BY job_name ORDER BY plays DESC'); ?>
  <?php if (!$js): ?><div class="empty">暂无已结算数据。</div><?php else: ?>
  <table>
    <thead><tr><th>身份</th><th>局数</th><th>平均分</th><th>平均天数</th><th>通关率</th></tr></thead>
    <tbody>
    <?php foreach ($js as $j): $rate = (int)$j['plays'] > 0 ? round((int)$j['pass_cnt'] / (int)$j['plays'] * 100, 1) : 0; ?>
      <tr>
        <td><?= h($j['job_name']) ?></td>
        <td class="mono"><?= (int)$j['plays'] ?></td>
        <td class="mono"><?= h($j['avg_score']) ?></td>
        <td class="mono"><?= h($j['avg_day']) ?></td>
        <td><div class="inline"><div class="bar" style="width:90px"><i style="width:<?= max(2, $rate) ?>%"></i></div><span class="mono" style="font-size:12px"><?= $rate ?>%</span></div></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>
<?php render_foot(); ?>
