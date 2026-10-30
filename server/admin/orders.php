<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_admin_page();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    if ((string)($_POST['do'] ?? '') === 'cancel') {
        $id = (int)($_POST['id'] ?? 0);
        $n  = run('UPDATE ' . t('orders') . ' SET status=2 WHERE id=? AND status=0', [$id]);
        audit('order.cancel', (string)$id);
        flash($n > 0 ? "订单 #{$id} 已撤销。" : '撤销失败，可能已成交。', $n > 0 ? 'ok' : 'bad');
    }
    header('Location: orders.php');
    exit;
}

$status = (string)($_GET['status'] ?? '0');
$where  = '1=1';
$args   = [];
if (in_array($status, ['0', '1', '2'], true)) {
    $where .= ' AND o.status=?';
    $args[] = (int)$status;
}
$rows = all(
    'SELECT o.*, u.nickname, u.username FROM ' . t('orders') . ' o JOIN ' . t('users') . ' u ON u.id=o.uid
     WHERE ' . $where . ' ORDER BY o.id DESC LIMIT 100',
    $args
);
$stat = [
    'open'   => (int)scalar('SELECT COUNT(*) FROM ' . t('orders') . ' WHERE status=0'),
    'filled' => (int)scalar('SELECT COUNT(*) FROM ' . t('orders') . ' WHERE status=1'),
    'cancel' => (int)scalar('SELECT COUNT(*) FROM ' . t('orders') . ' WHERE status=2'),
    'volume' => (int)scalar('SELECT COALESCE(SUM(qty*price),0) FROM ' . t('orders') . ' WHERE status=1'),
];
$pledges = all(
    'SELECT p.*, u.nickname FROM ' . t('pledges') . ' p JOIN ' . t('users') . ' u ON u.id=p.uid
     WHERE p.status=0 ORDER BY p.id DESC LIMIT 30'
);

render_head('交易所', 'orders');
?>
<div class="cards">
  <div class="kpi"><div class="k">挂单中</div><div class="v"><?= nf($stat['open']) ?></div></div>
  <div class="kpi"><div class="k">已成交</div><div class="v"><?= nf($stat['filled']) ?></div></div>
  <div class="kpi"><div class="k">已撤销</div><div class="v"><?= nf($stat['cancel']) ?></div></div>
  <div class="kpi"><div class="k">累计成交阴德</div><div class="v"><?= nf($stat['volume']) ?></div></div>
</div>

<div class="panel">
  <h2>订单（阴德 ↔ 阳寿）</h2>
  <div class="inline" style="margin-bottom:12px">
    <a class="btn sm <?= $status === '0' ? 'pri' : '' ?>" href="?status=0">挂单中</a>
    <a class="btn sm <?= $status === '1' ? 'pri' : '' ?>" href="?status=1">已成交</a>
    <a class="btn sm <?= $status === '2' ? 'pri' : '' ?>" href="?status=2">已撤销</a>
    <a class="btn sm <?= $status === 'all' ? 'pri' : '' ?>" href="?status=all">全部</a>
  </div>
  <table>
    <thead><tr><th>ID</th><th>玩家</th><th>方向</th><th>数量</th><th>单价</th><th>总额</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
    <tbody>
    <?php if (!$rows): ?><tr><td colspan="9"><div class="empty">没有订单。</div></td></tr><?php endif; ?>
    <?php foreach ($rows as $r): ?>
      <tr>
        <td class="mono">#<?= (int)$r['id'] ?></td>
        <td><?= h($r['nickname'] ?: $r['username']) ?></td>
        <td><?= $r['side'] === 'sell' ? '<span class="tag warn">出让阳寿</span>' : '<span class="tag acc">买入阳寿</span>' ?></td>
        <td class="mono"><?= (int)$r['qty'] ?> 天</td>
        <td class="mono"><?= (int)$r['price'] ?></td>
        <td class="mono"><?= nf((int)$r['qty'] * (int)$r['price']) ?></td>
        <td>
          <?php if ((int)$r['status'] === 0): ?><span class="tag warn">挂单中</span>
          <?php elseif ((int)$r['status'] === 1): ?><span class="tag ok">已成交</span>
          <?php else: ?><span class="tag mute">已撤销</span><?php endif; ?>
        </td>
        <td class="muted mono"><?= h(substr((string)$r['created_at'], 0, 16)) ?></td>
        <td>
          <?php if ((int)$r['status'] === 0): ?>
          <form method="post" onsubmit="return confirm('确认撤销这单？')">
            <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
            <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">
            <button class="btn sm danger" name="do" value="cancel">撤销</button>
          </form>
          <?php else: ?><span class="muted">—</span><?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>

<div class="panel">
  <h2>未赎回的当票</h2>
  <?php if (!$pledges): ?><div class="empty">没有未赎回的当票。</div><?php else: ?>
  <table>
    <thead><tr><th>ID</th><th>玩家</th><th>抵押天数</th><th>得阴德</th><th>到期天</th><th>创建</th></tr></thead>
    <tbody>
    <?php foreach ($pledges as $p): ?>
      <tr>
        <td class="mono">#<?= (int)$p['id'] ?></td>
        <td><?= h($p['nickname']) ?></td>
        <td class="mono"><?= (int)$p['days'] ?></td>
        <td class="mono"><?= (int)$p['cash'] ?></td>
        <td class="mono">第 <?= (int)$p['due_day'] ?> 天</td>
        <td class="muted mono"><?= h(substr((string)$p['created_at'], 0, 16)) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>
<?php render_foot(); ?>
