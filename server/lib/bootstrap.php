<?php
/**
 * 基础设施：数据库单例、请求解析、JSON 响应、限流、工具函数。
 * 目标运行时 PHP 8.2 / MySQL 5.7
 */
declare(strict_types=1);

if (!defined('LIFE_ROOT')) {
    define('LIFE_ROOT', dirname(__DIR__));
}

/** 全局配置（安装后由 lib/config.php 提供） */
function cfg(?string $path = null, $default = null)
{
    static $cfg = null;
    if ($cfg === null) {
        $file = LIFE_ROOT . '/lib/config.php';
        if (!is_file($file)) {
            // 未安装：引导到安装器
            if (PHP_SAPI !== 'cli') {
                $self = $_SERVER['SCRIPT_NAME'] ?? '';
                if (strpos($self, 'install.php') === false) {
                    header('Content-Type: application/json; charset=utf-8');
                    http_response_code(503);
                    echo json_encode([
                        'ok' => false,
                        'error' => ['code' => 'not_installed', 'msg' => '系统尚未安装，请先访问 install.php'],
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            }
            return $default;
        }
        $cfg = require $file;
    }
    if ($path === null) {
        return $cfg;
    }
    $node = $cfg;
    foreach (explode('.', $path) as $seg) {
        if (!is_array($node) || !array_key_exists($seg, $node)) {
            return $default;
        }
        $node = $node[$seg];
    }
    return $node;
}

/** PDO 单例 */
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $d = cfg('db', []);
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $d['host'] ?? '127.0.0.1',
        (int)($d['port'] ?? 3306),
        $d['name'] ?? '',
        $d['charset'] ?? 'utf8mb4'
    );
    try {
        $pdo = new PDO($dsn, $d['user'] ?? '', $d['pass'] ?? '', [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4, sql_mode='NO_ENGINE_SUBSTITUTION'",
        ]);
    } catch (PDOException $e) {
        fail('db_error', cfg('site.debug') ? $e->getMessage() : '数据库连接失败', 500);
    }
    return $pdo;
}

/** 表名（带前缀） */
function t(string $name): string
{
    $p = cfg('db.prefix', 'life_');
    return '`' . $p . $name . '`';
}

/** 取查询结果一行 */
function one(string $sql, array $args = []): ?array
{
    $st = db()->prepare($sql);
    $st->execute($args);
    $r = $st->fetch();
    return $r === false ? null : $r;
}

/** 取多行 */
function all(string $sql, array $args = []): array
{
    $st = db()->prepare($sql);
    $st->execute($args);
    return $st->fetchAll();
}

/** 执行并返回影响行数 */
function run(string $sql, array $args = []): int
{
    $st = db()->prepare($sql);
    $st->execute($args);
    return $st->rowCount();
}

/** 取单值 */
function scalar(string $sql, array $args = [], $default = 0)
{
    $st = db()->prepare($sql);
    $st->execute($args);
    $v = $st->fetchColumn();
    return ($v === false || $v === null) ? $default : $v;
}

// ------------------------------------------------------------
// 请求与响应
// ------------------------------------------------------------

/** 解析后的请求参数（GET + POST + JSON body 合并） */
function req(): array
{
    static $data = null;
    if ($data !== null) {
        return $data;
    }
    $data = array_merge($_GET, $_POST);
    $raw  = file_get_contents('php://input');
    if ($raw !== '' && $raw !== false) {
        $j = json_decode($raw, true);
        if (is_array($j)) {
            $data = array_merge($data, $j);
        }
    }
    return $data;
}

/** 取参数（带默认值） */
function p(string $key, $default = null)
{
    $d = req();
    return array_key_exists($key, $d) ? $d[$key] : $default;
}

/** 取整型参数 */
function pint(string $key, int $default = 0): int
{
    $v = p($key, $default);
    return is_numeric($v) ? (int)$v : $default;
}

/** 取字符串参数并裁剪长度 */
function pstr(string $key, string $default = '', int $max = 255): string
{
    $v = p($key, $default);
    if (!is_scalar($v)) {
        return $default;
    }
    $v = trim((string)$v);
    if (function_exists('mb_substr')) {
        $v = mb_substr($v, 0, $max);
    } else {
        $v = substr($v, 0, $max);
    }
    return $v;
}

/** 成功响应并终止 */
function ok($data = null, array $extra = [])
{
    if (PHP_SAPI !== 'cli' && !headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        http_response_code(200);
    }
    echo json_encode(array_merge(['ok' => true, 'data' => $data], $extra), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** 失败响应并终止 */
function fail(string $code, string $msg, int $status = 400)
{
    if (PHP_SAPI !== 'cli' && !headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($status);
    }
    echo json_encode(['ok' => false, 'error' => ['code' => $code, 'msg' => $msg]], JSON_UNESCAPED_UNICODE);
    exit;
}

/** 输出 JSON 但不终止（供内部使用） */
function json_enc($data): string
{
    return json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/** 客户端 IP */
function client_ip(): string
{
    $keys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($keys as $k) {
        if (!empty($_SERVER[$k])) {
            $ip = trim(explode(',', (string)$_SERVER[$k])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return '';
}

/**
 * 简易滑动窗口限流（文件计数，无需额外依赖）
 * @return bool true 表示放行
 */
function rate_allow(string $bucket, int $max, int $window = 60): bool
{
    $dir = LIFE_ROOT . '/runtime';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    $file = $dir . '/rl_' . preg_replace('/[^a-z0-9_]/i', '', $bucket) . '_' . md5(client_ip()) . '.json';
    $now  = time();
    $hits = [];
    if (is_file($file)) {
        $hits = json_decode((string)file_get_contents($file), true) ?: [];
    }
    $hits = array_values(array_filter($hits, fn($ts) => is_int($ts) && $ts > $now - $window));
    if (count($hits) >= $max) {
        return false;
    }
    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
    return true;
}

/** 随机抽一行（MySQL 5.7 兼容写法） */
function pick_random(string $table, string $where = '1=1', array $args = []): ?array
{
    return one("SELECT * FROM {$table} WHERE {$where} ORDER BY RAND() LIMIT 1", $args);
}

/** 统一注册异常处理 */
function install_error_handler(): void
{
    set_exception_handler(function (Throwable $e) {
        $debug = (bool)cfg('site.debug', false);
        if ($debug) {
            fail('exception', $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine(), 500);
        }
        error_log('[life] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
        fail('server_error', '服务器内部错误', 500);
    });
    set_error_handler(function ($no, $str, $file, $line) {
        if (!(error_reporting() & $no)) {
            return false;
        }
        throw new ErrorException($str, 0, $no, $file, $line);
    });
}

/** API 侧统一引导 */
function boot_api(): void
{
    install_error_handler();
    date_default_timezone_set((string)cfg('site.timezone', 'Asia/Shanghai'));
    $origin = (string)cfg('site.cors', '*');
    if (!headers_sent()) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Token');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Max-Age: 86400');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
    $limit = (int)cfg('site.rate_limit', 240);
    if ($limit > 0 && !rate_allow('api', $limit, 60)) {
        fail('rate_limited', '请求太频繁，歇一会儿', 429);
    }
}

// 表结构工具（sql_split / schema_tables / ad_seed），安装器与后台共用
require_once __DIR__ . '/schema.php';
