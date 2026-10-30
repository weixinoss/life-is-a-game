<?php
/**
 * 后台公共层：会话认证、CSRF、布局渲染。
 * 后台用 PHP Session，与前台 API 的 Token 体系相互独立。
 */
declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/auth.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('LIFEADMIN');
    session_start();
}

date_default_timezone_set((string)cfg('site.timezone', 'Asia/Shanghai'));

/** 当前后台登录者 */
function admin_user(): ?array
{
    static $u = false;
    if ($u !== false) {
        return $u;
    }
    $id = (int)($_SESSION['admin_id'] ?? 0);
    if ($id <= 0) {
        return $u = null;
    }
    $row = one('SELECT * FROM ' . t('users') . ' WHERE id=? AND role="admin" AND status=1', [$id]);
    return $u = $row ?: null;
}

/** 必须登录，否则跳登录页 */
function require_admin_page(): array
{
    $u = admin_user();
    if (!$u) {
        header('Location: login.php');
        exit;
    }
    return $u;
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function csrf_check(): void
{
    $t = (string)($_POST['_csrf'] ?? '');
    if ($t === '' || !hash_equals((string)($_SESSION['csrf'] ?? ''), $t)) {
        http_response_code(419);
        exit('表单已过期，请刷新页面重试。');
    }
}

function flash(string $msg, string $type = 'ok'): void
{
    $_SESSION['flash'] = ['m' => $msg, 't' => $type];
}

function flash_take(): ?array
{
    $f = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $f;
}

/** 写审计日志 */
function audit(string $action, string $target = '', string $detail = ''): void
{
    $u = admin_user();
    run('INSERT INTO ' . t('audit') . ' (uid,action,target,detail,ip,created_at) VALUES (?,?,?,?,?,?)', [
        (int)($u['id'] ?? 0), $action, $target, $detail, client_ip(), date('Y-m-d H:i:s'),
    ]);
}

function h($s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

/** 数字友好显示 */
function nf($n): string
{
    return number_format((float)$n, 0, '.', ',');
}

/** 表是否存在（老库升级后还没补表时，页面不该白屏） */
function table_exists(string $name): bool
{
    static $cache = [];
    if (array_key_exists($name, $cache)) {
        return $cache[$name];
    }
    $full = (string)cfg('db.prefix', 'life_') . $name;
    try {
        $v = (int)scalar(
            'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',
            [$full]
        );
    } catch (Throwable $e) {
        $v = 0;
    }
    return $cache[$name] = $v > 0;
}

/** 渲染页头 */
function render_head(string $title, string $active = ''): void
{
    $u = admin_user();
    $nav = [
        'index'    => ['数据概览', 'index.php'],
        'users'    => ['用户', 'users.php'],
        'lives'    => ['对局记录', 'lives.php'],
        'world'    => ['世界状态', 'world.php'],
        'ads'      => ['广告位', 'ads.php'],
        'orders'   => ['交易所', 'orders.php'],
        'cases'    => ['判官案卷', 'cases.php'],
        'settings' => ['系统设置', 'settings.php'],
    ];
    ?><!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= h($title) ?> · 管理后台</title>
<link rel="stylesheet" href="assets/admin.css">
</head>
<body>
<div class="shell">
  <aside class="side">
    <div class="brand">人生·管理后台</div>
    <nav>
      <?php foreach ($nav as $k => $v): ?>
        <a href="<?= h($v[1]) ?>" class="<?= $active === $k ? 'on' : '' ?>"><?= h($v[0]) ?></a>
      <?php endforeach; ?>
    </nav>
    <div class="side-foot">
      <div class="who"><?= h($u['nickname'] ?: $u['username']) ?></div>
      <a href="logout.php" class="out">退出</a>
    </div>
  </aside>
  <main class="main">
    <header class="page-head"><h1><?= h($title) ?></h1></header>
    <?php if ($f = flash_take()): ?>
      <div class="flash <?= h($f['t']) ?>"><?= h($f['m']) ?></div>
    <?php endif; ?>
<?php
}

function render_foot(): void
{
    ?>
  </main>
</div>
</body>
</html><?php
}
