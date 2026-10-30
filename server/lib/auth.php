<?php
/**
 * 账号与会话：注册、登录、令牌校验、权限判定。
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/** 允许的登录名字符：字母、数字、下划线、中文，3-20 位 */
function valid_username(string $u): bool
{
    $len = function_exists('mb_strlen') ? mb_strlen($u) : strlen($u);
    return $len >= 3 && $len <= 20 && preg_match('/^[\w\x{4e00}-\x{9fa5}]+$/u', $u) === 1;
}

/** 注册 */
function auth_register(string $username, string $password, string $nickname = ''): array
{
    if (!valid_username($username)) {
        fail('bad_username', '登录名需 3-20 位，仅限中英文、数字、下划线');
    }
    if (strlen($password) < 6 || strlen($password) > 72) {
        fail('bad_password', '密码长度需 6-72 位');
    }
    $dup = scalar('SELECT COUNT(*) FROM ' . t('users') . ' WHERE username=?', [$username]);
    if ((int)$dup > 0) {
        fail('username_taken', '这个登录名已经有人用了');
    }
    $now = date('Y-m-d H:i:s');
    $nickname = $nickname !== '' ? $nickname : $username;
    run(
        'INSERT INTO ' . t('users') . ' (username,password,nickname,role,status,merit,lifespan,created_at,last_ip) VALUES (?,?,?,?,?,?,?,?,?)',
        [$username, password_hash($password, PASSWORD_DEFAULT), $nickname, 'player', 1, 10, 30, $now, client_ip()]
    );
    $uid = (int)db()->lastInsertId();
    return ['uid' => $uid] + auth_issue_token($uid);
}

/** 登录 */
function auth_login(string $username, string $password): array
{
    // 登录失败也限流，防爆破
    if (!rate_allow('login', 12, 300)) {
        fail('rate_limited', '尝试太频繁，请 5 分钟后再试', 429);
    }
    $u = one('SELECT * FROM ' . t('users') . ' WHERE username=? LIMIT 1', [$username]);
    if (!$u || !password_verify($password, (string)$u['password'])) {
        fail('bad_credentials', '登录名或密码不对');
    }
    if ((int)$u['status'] !== 1) {
        fail('banned', '这个账号已被封禁', 403);
    }
    run('UPDATE ' . t('users') . ' SET last_login_at=?, last_ip=? WHERE id=?', [date('Y-m-d H:i:s'), client_ip(), (int)$u['id']]);
    return ['uid' => (int)$u['id'], 'user' => public_user($u)] + auth_issue_token((int)$u['id']);
}

/** 发令牌（同账号只保留最近 8 个会话） */
function auth_issue_token(int $uid): array
{
    $token = bin2hex(random_bytes(32));
    $ttl   = (int)cfg('site.token_ttl', 2592000);
    $now   = date('Y-m-d H:i:s');
    run('INSERT INTO ' . t('sessions') . ' (token,uid,expires_at,created_at,ip) VALUES (?,?,?,?,?)', [
        $token, $uid, date('Y-m-d H:i:s', time() + $ttl), $now, client_ip(),
    ]);
    run('DELETE FROM ' . t('sessions') . ' WHERE uid=? AND token NOT IN (SELECT token FROM (SELECT token FROM ' . t('sessions') . ' WHERE uid=? ORDER BY created_at DESC LIMIT 8) x)', [$uid, $uid]);
    run('DELETE FROM ' . t('sessions') . ' WHERE expires_at < ?', [$now]);
    return ['token' => $token, 'expires_in' => $ttl];
}

/** 从请求里取令牌 */
function auth_token(): string
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($h !== '' && stripos($h, 'Bearer ') === 0) {
        return trim(substr($h, 7));
    }
    $x = $_SERVER['HTTP_X_TOKEN'] ?? '';
    if ($x !== '') {
        return trim($x);
    }
    return (string)p('token', '');
}

/** 当前用户（未登录返回 null） */
function auth_user(): ?array
{
    static $cache = false;
    if ($cache !== false) {
        return $cache;
    }
    $token = auth_token();
    if ($token === '' || strlen($token) !== 64) {
        return $cache = null;
    }
    $row = one(
        'SELECT u.* FROM ' . t('sessions') . ' s JOIN ' . t('users') . ' u ON u.id=s.uid WHERE s.token=? AND s.expires_at>? LIMIT 1',
        [$token, date('Y-m-d H:i:s')]
    );
    if (!$row || (int)$row['status'] !== 1) {
        return $cache = null;
    }
    return $cache = $row;
}

/** 必须登录 */
function require_login(): array
{
    $u = auth_user();
    if (!$u) {
        fail('need_login', '请先登录', 401);
    }
    return $u;
}

/** 必须管理员 */
function require_admin(): array
{
    $u = require_login();
    if (($u['role'] ?? '') !== 'admin') {
        fail('need_admin', '需要管理员权限', 403);
    }
    return $u;
}

/** 对外可见的用户字段 */
function public_user(array $u): array
{
    return [
        'id'          => (int)$u['id'],
        'username'    => $u['username'],
        'nickname'    => $u['nickname'] !== '' ? $u['nickname'] : $u['username'],
        'role'        => $u['role'],
        'merit'       => (int)$u['merit'],
        'lifespan'    => (int)$u['lifespan'],
        'judge_score' => (int)$u['judge_score'],
        'season_score'=> (int)$u['season_score'],
        'badge'       => $u['badge'],
        'created_at'  => $u['created_at'],
    ];
}

/** 退出登录 */
function auth_logout(): void
{
    $token = auth_token();
    if ($token !== '') {
        run('DELETE FROM ' . t('sessions') . ' WHERE token=?', [$token]);
    }
}
