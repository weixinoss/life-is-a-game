<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
$me = require_admin_page();

// ---------------- 操作 ----------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $uid    = (int)($_POST['uid'] ?? 0);
    $action = (string)($_POST['do'] ?? '');
    $target = one('SELECT * FROM ' . t('users') . ' WHERE id=?', [$uid]);

    if (!$target) {
        flash('用户不存在。', 'bad');
    } elseif ($action === 'ban' && $uid === (int)$me['id']) {
        flash('不能封禁自己。', 'bad');
    } else {
        switch ($action) {
            case 'ban':
                run('UPDATE ' . t('users') . ' SET status=0 WHERE id=?', [$uid]);
                run('DELETE FROM ' . t('sessions') . ' WHERE uid=?', [$uid]);
                audit('user.ban', (string)$target['username']);
                flash('已封禁 ' . $target['username'] . '，并踢下线。');
                break;
            case 'unban':
                run('UPDATE ' . t('users') . ' SET status=1 WHERE id=?', [$uid]);
                audit('user.unban', (string)$target['username']);
                flash('已解封 ' . $target['username'] . '。');
                break;
            case 'to_admin':
                run('UPDATE ' . t('users') . ' SET role="admin" WHERE id=?', [$uid]);
                audit('user.to_admin', (string)$target['username']);
                flash($target['username'] . ' 已升为管理员。');
                break;
            case 'to_player':
                run('UPDATE ' . t('users') . ' SET role="player" WHERE id=?', [$uid]);
                audit('user.to_player', (string)$target['username']);
                flash($target['username'] . ' 已降为普通玩家。');
                break;
            case 'reset':
                $pw = (string)($_POST['newpass'] ?? '');
                if (strlen($pw) < 8) {
                    flash('新密码至少 8 位。', 'bad');
                } else {
                    run('UPDATE ' . t('users') . ' SET password=? WHERE id=?', [password_hash($pw, PASSWORD_DEFAULT), $uid]);
                    run('DELETE FROM ' . t('sessions') . ' WHERE uid=?', [$uid]);
                    audit('user.reset', (string)$target['username']);
                    flash('密码已重置，该用户需重新登录。');
                }
                break;
            case 'grant':
                $m = (int)($_POST['merit'] ?? 0);
                $l = (int)($_POST['lifespan'] ?? 0);
                if ($m !== 0 || $l !== 0) {
                    run('UPDATE ' . t('users') . ' SET merit=GREATEST(0,merit+?), lifespan=GREATEST(0,lifespan+?) WHERE id=?', [$m, $l, $uid]);
                    audit('user.grant', (string)$target['username'], "merit{$m} lifespan{$l}");
                    flash("已调整：阴德 " . ($m >= 0 ? '+' : '') . $m . '，阳寿 ' . ($l >= 0 ? '+' : '') . $l);
                } else {
                    flash('没有填写要调整的数值。', 'bad');
                }
                break;
            case 'kick':
                run('DELETE FROM ' . t('sessions') . ' WHERE uid=?', [$uid]);
                audit('user.kick', (string)$target['username']);
                flash('已踢下线。');
                break;
        }
    }
    header('Location: users.php' . (isset($_GET['q']) ? '?q=' . urlencode((string)$_GET['q']) : ''));
    exit;
}

// ---------------- 查询 ----------------
$q     = trim((string)($_GET['q'] ?? ''));
$page  = max(1, (int)($_GET['page'] ?? 1));
$size  = 20;
$where = '1=1';
$args  = [];
if ($q !== '') {
    $where .= ' AND (username LIKE ? OR nickname LIKE ?)';
    $args[] = "%{$q}%";
    $args[] = "%{$q}%";
}
$total = (int)scalar('SELECT COUNT(*) FROM ' . t('users') . ' WHERE ' . $where, $args);
$pages = max(1, (int)ceil($total / $size));
$page  = min($page, $pages);
$rows  = all('SELECT * FROM ' . t('users') . ' WHERE ' . $where . ' ORDER BY id DESC LIMIT ' . (($page - 1) * $size) . ',' . $size, $args);

render_head('用户管理', 'users');
?>
<form class="panel" method="get" style="display:flex;gap:10px;align-items:flex-end">
  <div style="flex:1;max-width:320px">
    <label style="margin-top:0">搜索登录名 / 昵称</label>
    <input type="text" name="q" value="<?= h($q) ?>" placeholder="输入关键词">
  </div>
  <button class="btn" type="submit">搜索</button>
  <?php if ($q !== ''): ?><a class="btn" href="users.php">清空</a><?php endif; ?>
  <span class="muted" style="margin-left:auto">共 <?= nf($total) ?> 个账号</span>
</form>

<div class="panel">
  <table>
    <thead>
      <tr><th>ID</th><th>账号</th><th>昵称</th><th>身份</th><th>阴德</th><th>阳寿</th><th>明察</th><th>注册</th><th>最近登录</th><th style="width:330px">操作</th></tr>
    </thead>
    <tbody>
    <?php if (!$rows): ?>
      <tr><td colspan="10"><div class="empty">没有匹配的账号。</div></td></tr>
    <?php endif; ?>
    <?php foreach ($rows as $r): $id = (int)$r['id']; ?>
      <tr>
        <td class="mono"><?= $id ?></td>
        <td><?= h($r['username']) ?><?php if ($id === (int)$me['id']): ?> <span class="tag acc">你</span><?php endif; ?></td>
        <td><?= h($r['nickname']) ?></td>
        <td>
          <?= $r['role'] === 'admin' ? '<span class="tag acc">管理员</span>' : '<span class="tag mute">玩家</span>' ?>
          <?= (int)$r['status'] === 1 ? '<span class="tag ok">正常</span>' : '<span class="tag bad">封禁</span>' ?>
        </td>
        <td class="mono"><?= nf($r['merit']) ?></td>
        <td class="mono"><?= nf($r['lifespan']) ?></td>
        <td class="mono"><?= nf($r['judge_score']) ?></td>
        <td class="muted mono"><?= h(substr((string)$r['created_at'], 0, 10)) ?></td>
        <td class="muted mono"><?= h($r['last_login_at'] ? substr((string)$r['last_login_at'], 0, 16) : '—') ?></td>
        <td>
          <div class="inline">
            <form method="post" onsubmit="return confirm('确认执行？')">
              <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
              <input type="hidden" name="uid" value="<?= $id ?>">
              <?php if ((int)$r['status'] === 1): ?>
                <button class="btn sm danger" name="do" value="ban">封禁</button>
              <?php else: ?>
                <button class="btn sm" name="do" value="unban">解封</button>
              <?php endif; ?>
            </form>
            <form method="post">
              <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
              <input type="hidden" name="uid" value="<?= $id ?>">
              <?php if ($r['role'] === 'admin'): ?>
                <button class="btn sm" name="do" value="to_player">降为玩家</button>
              <?php else: ?>
                <button class="btn sm" name="do" value="to_admin">设为管理员</button>
              <?php endif; ?>
            </form>
            <form method="post">
              <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
              <input type="hidden" name="uid" value="<?= $id ?>">
              <button class="btn sm" name="do" value="kick">踢下线</button>
            </form>
          </div>
          <details style="margin-top:6px">
            <summary class="muted" style="cursor:pointer;font-size:12px">更多（重置密码 / 调整数值）</summary>
            <div class="row2" style="margin-top:8px">
              <form method="post" class="inline">
                <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
                <input type="hidden" name="uid" value="<?= $id ?>">
                <input type="text" name="newpass" placeholder="新密码≥8位" style="width:120px">
                <button class="btn sm" name="do" value="reset">重置</button>
              </form>
              <form method="post" class="inline">
                <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
                <input type="hidden" name="uid" value="<?= $id ?>">
                <input type="number" name="merit" placeholder="阴德±" style="width:70px">
                <input type="number" name="lifespan" placeholder="阳寿±" style="width:70px">
                <button class="btn sm" name="do" value="grant">调整</button>
              </form>
            </div>
          </details>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</div>

<?php if ($pages > 1): ?>
<div class="panel inline" style="justify-content:center">
  <?php for ($i = 1; $i <= $pages; $i++): ?>
    <?php if ($i === 1 || $i === $pages || abs($i - $page) <= 2): ?>
      <a class="btn sm <?= $i === $page ? 'pri' : '' ?>" href="?page=<?= $i ?><?= $q !== '' ? '&q=' . urlencode($q) : '' ?>"><?= $i ?></a>
    <?php elseif (abs($i - $page) === 3): ?>
      <span class="muted">…</span>
    <?php endif; ?>
  <?php endfor; ?>
</div>
<?php endif; ?>
<?php render_foot(); ?>
