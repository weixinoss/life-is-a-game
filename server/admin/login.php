<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

if (admin_user()) {
    header('Location: index.php');
    exit;
}

$err = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    if (!rate_allow('admin_login', 8, 300)) {
        $err = '尝试太频繁，请 5 分钟后再试。';
    } else {
        $name = trim((string)($_POST['username'] ?? ''));
        $pass = (string)($_POST['password'] ?? '');
        $row  = one('SELECT * FROM ' . t('users') . ' WHERE username=? LIMIT 1', [$name]);
        if (!$row || !password_verify($pass, (string)$row['password'])) {
            $err = '账号或密码不对。';
        } elseif ($row['role'] !== 'admin') {
            $err = '这个账号不是管理员。';
        } elseif ((int)$row['status'] !== 1) {
            $err = '这个账号已被封禁。';
        } else {
            session_regenerate_id(true);
            $_SESSION['admin_id'] = (int)$row['id'];
            run('UPDATE ' . t('users') . ' SET last_login_at=?, last_ip=? WHERE id=?', [
                date('Y-m-d H:i:s'), client_ip(), (int)$row['id'],
            ]);
            audit('login', (string)$row['username']);
            header('Location: index.php');
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>登录 · 管理后台</title>
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<div class="login-wrap">
  <form class="login-card" method="post">
    <h1>管理后台</h1>
    <p class="sub">人生就是一场游戏 · 三界联网</p>
    <?php if ($err): ?><div class="err-box"><?= h($err) ?></div><?php endif; ?>
    <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
    <label>账号</label>
    <input type="text" name="username" autocomplete="username" required autofocus value="<?= h($_POST['username'] ?? '') ?>">
    <label>密码</label>
    <input type="password" name="password" autocomplete="current-password" required>
    <button class="btn pri" type="submit">登录</button>
  </form>
</div>
</body>
</html>
