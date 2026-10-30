<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_admin_page();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    if ((string)($_POST['do'] ?? '') === 'close') {
        $id = (int)($_POST['id'] ?? 0);
        $c  = one('SELECT * FROM ' . t('cases') . ' WHERE id=?', [$id]);
        if ($c) {
            run('UPDATE ' . t('cases') . ' SET status=1, final=truth, closed_at=? WHERE id=?', [date('Y-m-d H:i:s'), $id]);
            audit('case.close', (string)$id);
            flash("案卷 #{$id} 已按机器初判强制结案。");
        } else {
            flash('案卷不存在。', 'bad');
        }
    }
    header('Location: cases.php');
    exit;
}

$status = (string)($_GET['status'] ?? '0');
$where  = '1=1';
$args   = [];
if (in_array($status, ['0', '1'], true)) {
    $where .= ' AND c.status=?';
    $args[] = (int)$status;
}
$rows = all(
    'SELECT c.*, u.nickname, u.username FROM ' . t('cases') . ' c JOIN ' . t('users') . ' u ON u.id=c.uid
     WHERE ' . $where . ' ORDER BY c.id DESC LIMIT 60',
    $args
);
$verdictName = [2 => '善', 1 => '平', 0 => '恶', -1 => '未定'];
$open  = (int)scalar('SELECT COUNT(*) FROM ' . t('cases') . ' WHERE status=0');
$total = (int)scalar('SELECT COUNT(*) FROM ' . t('cases'));

render_head('判官案卷', 'cases');
?>
<div class="cards">
  <div class="kpi"><div class="k">待审</div><div class="v"><?= nf($open) ?></div></div>
  <div class="kpi"><div class="k">累计案卷</div><div class="v"><?= nf($total) ?></div></div>
  <div class="kpi"><div class="k">已结案</div><div class="v"><?= nf($total - $open) ?></div></div>
</div>

<div class="panel">
  <div class="inline" style="margin-bottom:12px">
    <a class="btn sm <?= $status === '0' ? 'pri' : '' ?>" href="?status=0">待审</a>
    <a class="btn sm <?= $status === '1' ? 'pri' : '' ?>" href="?status=1">已结案</a>
    <a class="btn sm <?= $status === 'all' ? 'pri' : '' ?>" href="?status=all">全部</a>
  </div>
  <?php if (!$rows): ?><div class="empty">没有案卷。</div><?php endif; ?>
  <?php foreach ($rows as $c): $frag = json_decode((string)$c['fragments'], true) ?: []; ?>
    <div style="border:1px solid var(--line);border-radius:9px;padding:14px 16px;margin-bottom:12px;background:var(--panel2)">
      <div class="inline" style="margin-bottom:10px">
        <span class="mono">#<?= (int)$c['id'] ?></span>
        <span><?= h($c['nickname'] ?: $c['username']) ?></span>
        <span class="tag mute"><?= h($c['job_name']) ?></span>
        <?php if ((int)$c['status'] === 0): ?><span class="tag warn">待审 <?= (int)$c['votes'] ?>/3</span>
        <?php else: ?><span class="tag ok">已结</span><?php endif; ?>
        <span class="muted">机器初判：<b><?= h($verdictName[(int)$c['truth']] ?? '?') ?></b></span>
        <?php if ((int)$c['final'] >= 0): ?><span class="muted">判定：<b><?= h($verdictName[(int)$c['final']] ?? '?') ?></b></span><?php endif; ?>
        <?php if ((int)$c['status'] === 0): ?>
          <form method="post" style="margin-left:auto" onsubmit="return confirm('按机器初判直接结案？')">
            <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
            <input type="hidden" name="id" value="<?= (int)$c['id'] ?>">
            <button class="btn sm danger" name="do" value="close">强制结案</button>
          </form>
        <?php endif; ?>
      </div>
      <ol style="margin:0;padding-left:20px;font-size:13px;color:var(--ink2);line-height:1.9">
        <?php foreach ($frag as $f): ?><li><?= h($f) ?></li><?php endforeach; ?>
      </ol>
      <?php
        $votes = all('SELECT v.verdict, v.speech_key, u.nickname FROM ' . t('case_votes') . ' v JOIN ' . t('users') . ' u ON u.id=v.uid WHERE v.case_id=?', [(int)$c['id']]);
      ?>
      <?php if ($votes): ?>
        <div class="inline" style="margin-top:10px;gap:8px;flex-wrap:wrap">
          <?php foreach ($votes as $v): ?>
            <span class="tag <?= (int)$v['verdict'] === (int)$c['truth'] ? 'ok' : 'bad' ?>">
              <?= h($v['nickname']) ?> 判 <?= h($verdictName[(int)$v['verdict']]) ?>
            </span>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>
  <?php endforeach; ?>
</div>
<?php render_foot(); ?>
