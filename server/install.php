<?php
/**
 * ============================================================
 *  一键安装向导
 *  ------------------------------------------------------------
 *  使用：把整个 server/ 目录丢到网站根目录，浏览器访问 /install.php
 *  流程：环境检测 → 填写数据库与管理员 → 自动建库建表 → 生成配置 → 上锁
 *  安装完成后会生成 install.lock，再次访问会被拒绝（防重复安装）。
 * ============================================================
 */
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');
@set_time_limit(300);

define('ROOT', __DIR__);
require_once ROOT . '/lib/schema.php';   // sql_split / schema_tables / ad_seed
$lockFile = ROOT . '/install.lock';
$cfgFile  = ROOT . '/lib/config.php';
$installed = is_file($lockFile) || is_file($cfgFile);

// ------------------------------------------------------------
// 环境检测
// ------------------------------------------------------------
$checks = [];
$checks[] = ['PHP 版本 ≥ 8.2', PHP_VERSION, version_compare(PHP_VERSION, '8.2.0', '>='), true];
foreach (['pdo_mysql' => 'PDO MySQL 扩展', 'json' => 'JSON 扩展', 'mbstring' => 'mbstring 扩展', 'openssl' => 'OpenSSL 扩展'] as $ext => $label) {
    $checks[] = [$label, extension_loaded($ext) ? '已启用' : '未启用', extension_loaded($ext), $ext !== 'mbstring'];
}
$checks[] = ['lib/ 目录可写', is_writable(ROOT . '/lib') ? '可写' : '不可写', is_writable(ROOT . '/lib'), true];
$checks[] = ['根目录可写（写锁文件）', is_writable(ROOT) ? '可写' : '不可写', is_writable(ROOT), true];
$checks[] = ['建表脚本 schema.sql', is_file(ROOT . '/sql/schema.sql') ? '存在' : '缺失', is_file(ROOT . '/sql/schema.sql'), true];
$envOk = true;
foreach ($checks as $c) {
    if (!$c[2] && $c[3]) {
        $envOk = false;
    }
}

// ------------------------------------------------------------
// 执行安装
// ------------------------------------------------------------
$errors  = [];
$done    = false;
$summary = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$installed) {
    $in = fn(string $k, string $d = ''): string => trim((string)($_POST[$k] ?? $d));

    $dbHost = $in('db_host', '127.0.0.1');
    $dbPort = (int)$in('db_port', '3306');
    $dbName = $in('db_name', 'life_game');
    $dbUser = $in('db_user', 'root');
    $dbPass = (string)($_POST['db_pass'] ?? '');
    $prefix = preg_replace('/[^a-z0-9_]/i', '', $in('db_prefix', 'life_'));
    $autoDb = !empty($_POST['auto_db']);

    $aUser  = $in('admin_user', 'admin');
    $aPass  = (string)($_POST['admin_pass'] ?? '');
    $aPass2 = (string)($_POST['admin_pass2'] ?? '');
    $site   = $in('site_name', '人生就是一场游戏');

    if ($prefix === '') {
        $prefix = 'life_';
    }
    if (!preg_match('/^[A-Za-z0-9_]{3,20}$/', $aUser)) {
        $errors[] = '管理员账号需 3-20 位字母、数字或下划线。';
    }
    if (strlen($aPass) < 8) {
        $errors[] = '管理员密码至少 8 位（建议包含大小写与数字）。';
    }
    if ($aPass !== $aPass2) {
        $errors[] = '两次输入的管理员密码不一致。';
    }
    if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', $dbName)) {
        $errors[] = '数据库名只能包含字母、数字、下划线。';
    }

    $pdo = null;
    if (!$errors) {
        try {
            $opt = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ];
            $pdo = new PDO("mysql:host={$dbHost};port={$dbPort};charset=utf8mb4", $dbUser, $dbPass, $opt);
            $ver = (string)$pdo->query('SELECT VERSION()')->fetchColumn();
            $summary[] = '连接数据库成功：MySQL ' . $ver;

            $exists = (int)$pdo->query("SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=" . $pdo->quote($dbName))->fetchColumn();
            if (!$exists) {
                if (!$autoDb) {
                    $errors[] = "数据库 `{$dbName}` 不存在。请先手动创建，或勾选「不存在时自动创建」。";
                } else {
                    $pdo->exec("CREATE DATABASE `{$dbName}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $summary[] = "已创建数据库 `{$dbName}`";
                    $exists = 1;
                }
            }
            if (!$errors && $exists) {
                $pdo->exec("USE `{$dbName}`");
                $pdo->exec("SET NAMES utf8mb4");
            }
        } catch (Throwable $e) {
            $errors[] = '数据库连接失败：' . $e->getMessage();
        }
    }

    // 建表
    if (!$errors && $pdo instanceof PDO) {
        try {
            $raw = (string)@file_get_contents(ROOT . '/sql/schema.sql');
            if (trim($raw) === '') {
                throw new RuntimeException('读取 sql/schema.sql 失败，请确认文件存在且可读。');
            }
            $raw = str_replace('{{P}}', $prefix, $raw);
            $stmts = sql_split($raw);
            if (!$stmts) {
                throw new RuntimeException('schema.sql 解析出 0 条语句，文件可能已损坏。');
            }
            $cnt = 0;
            $stmtErrors = [];
            foreach ($stmts as $idx => $stmt) {
                try {
                    $pdo->exec($stmt);
                    $cnt++;
                } catch (Throwable $e) {
                    // 单条失败不中断：继续建后面的表，最后统一汇总，避免「一条卡住全盘皆输」
                    $stmtErrors[] = '第 ' . ($idx + 1) . ' 条：' . $e->getMessage() . '【' . brief($stmt, 80) . '】';
                }
            }

            // 建表之后必须校验：缺任何一张都直接失败，不要拖到后面报「表不存在」
            $need = schema_tables();
            $have = [];
            foreach ($pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) as $tn) {
                $have[strtolower((string)$tn)] = true;
            }
            $miss = [];
            foreach ($need as $n) {
                if (!isset($have[strtolower($prefix . $n)])) {
                    $miss[] = $prefix . $n;
                }
            }

            if ($miss) {
                $msg = '建表不完整，缺少 ' . count($miss) . ' 张表：' . implode('、', $miss);
                if ($stmtErrors) {
                    $msg .= '。失败原因：' . implode('；', array_slice($stmtErrors, 0, 3));
                }
                $msg .= '。若数据库账号无建表权限请先授权；也可用 phpMyAdmin 手动导入 server/sql/schema.sql'
                      . '（把 {{P}} 替换为 `' . $prefix . '`），导入后回到本页重试即可。';
                throw new RuntimeException($msg);
            }
            $summary[] = "建表完成：执行 {$cnt} 条语句，{$prefix}* 共 " . count($need) . ' 张表全部就绪';
            if ($stmtErrors) {
                $summary[] = '（有 ' . count($stmtErrors) . ' 条非关键语句告警：' . brief(implode(' | ', $stmtErrors), 160) . '）';
            }

            // 中央广场默认广告：只在表为空时灌一次，服主删了不会再长回来
            $adN = ad_seed($pdo, $prefix);
            if ($adN > 0) {
                $summary[] = "已写入 {$adN} 条默认广告（后台 → 广告位 可改可删）";
            }
        } catch (Throwable $e) {
            $errors[] = '建表失败：' . $e->getMessage();
        }
    }

    // 管理员
    if (!$errors && $pdo instanceof PDO) {
        try {
            $now  = date('Y-m-d H:i:s');
            $hash = password_hash($aPass, PASSWORD_DEFAULT);
            $st = $pdo->prepare("SELECT id FROM `{$prefix}users` WHERE username=? LIMIT 1");
            $st->execute([$aUser]);
            $uid = $st->fetchColumn();
            if ($uid) {
                $pdo->prepare("UPDATE `{$prefix}users` SET password=?,role='admin',status=1 WHERE id=?")->execute([$hash, $uid]);
                $summary[] = "管理员 `{$aUser}` 已存在，密码与权限已更新";
            } else {
                $pdo->prepare("INSERT INTO `{$prefix}users` (username,password,nickname,role,status,created_at) VALUES (?,?,?,?,1,?)")
                    ->execute([$aUser, $hash, '服主', 'admin', $now]);
                $summary[] = "管理员 `{$aUser}` 创建成功";
            }
        } catch (Throwable $e) {
            $errors[] = '创建管理员失败：' . $e->getMessage();
        }
    }

    // 写配置
    if (!$errors) {
        $conf = [
            'db' => [
                'host' => $dbHost, 'port' => $dbPort, 'name' => $dbName,
                'user' => $dbUser, 'pass' => $dbPass, 'charset' => 'utf8mb4', 'prefix' => $prefix,
            ],
            'site' => [
                'name' => $site, 'timezone' => 'Asia/Shanghai', 'debug' => false,
                'cors' => '*', 'token_ttl' => 2592000, 'rate_limit' => 240,
            ],
            'feature' => [
                'karma' => true, 'relic' => true, 'bottle' => true, 'letter' => true,
                'home' => true, 'jury' => true, 'rank' => true, 'report' => true,
                'market' => true, 'pledge' => true, 'lifeloan' => false,
                'wish' => true, 'ghost' => true, 'track' => true,
            ],
            'world' => [
                'weather_tick' => 1800, 'price_min' => 0.70, 'price_max' => 1.60,
                'inflation_per_10k' => 0.004,
            ],
        ];
        $php = "<?php\n// 由 install.php 于 " . date('Y-m-d H:i:s') . " 自动生成，请勿提交到公开仓库\nreturn " . var_export($conf, true) . ";\n";
        if (@file_put_contents($cfgFile, $php, LOCK_EX) === false) {
            $errors[] = '配置写入失败，请检查 lib/ 目录权限。';
        } else {
            @chmod($cfgFile, 0640);
            $summary[] = '配置文件 lib/config.php 已生成';
        }
    }

    if (!$errors) {
        if (!is_dir(ROOT . '/runtime')) {
            @mkdir(ROOT . '/runtime', 0775, true);
        }
        @file_put_contents($lockFile, 'installed at ' . date('c') . "\n");
        $done = true;
        $summary[] = '安装锁 install.lock 已写入';
    }
}

function h($s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

/** 报错时截取语句片段，避免把整段 SQL 甩到页面上 */
function brief(string $s, int $len = 110): string
{
    $s = (string)preg_replace('/\s+/', ' ', trim($s));
    if (function_exists('mb_substr')) {
        return mb_strlen($s, 'UTF-8') > $len ? mb_substr($s, 0, $len, 'UTF-8') . '…' : $s;
    }
    return strlen($s) > $len ? substr($s, 0, $len) . '…' : $s;
}

?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>安装 · 人生就是一场游戏</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f4f2ee;color:#1c1b19;font:15px/1.7 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:44px 22px 90px}
h1{font-size:26px;margin:0 0 6px}
.sub{color:#6b665f;font-size:14px;margin:0 0 26px}
.card{background:#fff;border:1px solid #e3ded4;border-radius:14px;padding:22px 24px;margin-bottom:16px}
.card h2{font-size:16px;margin:0 0 14px;display:flex;align-items:center;gap:9px}
.card h2 .n{width:24px;height:24px;border-radius:6px;background:#8a5a2b;color:#fff;font-size:13px;display:inline-flex;align-items:center;justify-content:center}
table{width:100%;border-collapse:collapse;font-size:14px}
td{padding:7px 0;border-bottom:1px dashed #eee8dd}
td:last-child{text-align:right;font-variant-numeric:tabular-nums}
.ok{color:#2e7d54;font-weight:600}.no{color:#c0392b;font-weight:600}
label{display:block;font-size:13px;color:#5c5751;margin:12px 0 5px}
input[type=text],input[type=password],input[type=number]{width:100%;padding:9px 11px;border:1px solid #dcd6cb;border-radius:8px;font-size:14px;background:#fdfcfa;font-family:inherit}
input:focus{outline:none;border-color:#8a5a2b;background:#fff}
.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.btn{display:inline-block;background:#8a5a2b;color:#fff;border:0;border-radius:9px;padding:12px 26px;font-size:15px;cursor:pointer;font-family:inherit}
.btn:hover{background:#71481f}
.btn:disabled{background:#b7aa98;cursor:not-allowed}
.tip{font-size:12.5px;color:#8b857c;margin-top:6px}
.err{background:#fdeceb;border:1px solid #f3c3bf;color:#a12e22;border-radius:10px;padding:12px 15px;font-size:14px;margin-bottom:14px}
.err ul{margin:0;padding-left:18px}
.suc{background:#eaf5ee;border:1px solid #bfe0cb;color:#1f6141;border-radius:10px;padding:12px 15px;font-size:14px;margin-bottom:14px}
.suc ul{margin:0;padding-left:18px}
.chk{display:flex;align-items:center;gap:8px;font-size:13.5px;color:#5c5751;margin-top:12px}
code{background:#f5ece1;color:#8a5a2b;padding:1px 6px;border-radius:4px;font-family:ui-monospace,Consolas,monospace;font-size:13px}
a{color:#8a5a2b}
.done-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.done-links a{display:inline-block;padding:10px 20px;border-radius:9px;text-decoration:none;font-size:14px;background:#fff;border:1px solid #d8d2c6;color:#3b3730}
.done-links a.pri{background:#8a5a2b;border-color:#8a5a2b;color:#fff}
</style>
</head>
<body>
<div class="wrap">
  <h1>人生就是一场游戏 · 服务端安装</h1>
  <p class="sub">PHP 8.2 + MySQL 5.7 · 三步完成 · 装完即可直接开局</p>

<?php if ($installed && !$done): ?>
  <div class="suc">
    <b>系统已经安装过了。</b><br>
    为了防止被覆盖，安装器已自动锁定。如需重装，请先删除根目录下的
    <code>install.lock</code> 与 <code>lib/config.php</code>。
  </div>
  <div class="card">
    <h2><span class="n">→</span>接下来做什么</h2>
    <div class="done-links">
      <a class="pri" href="../index.html">进入游戏</a>
      <a href="admin/">进入管理后台</a>
    </div>
  </div>
<?php elseif ($done): ?>
  <div class="suc">
    <b>安装完成。</b>服务端已经可以用了。
    <ul><?php foreach ($summary as $s): ?><li><?= h($s) ?></li><?php endforeach; ?></ul>
  </div>
  <div class="card">
    <h2><span class="n">!</span>最后两件事</h2>
    <p style="margin:0 0 10px;font-size:14px;color:#5c5751">
      1. 建议把 <code>server/install.php</code> 删掉（或保留，它已被锁文件保护）。<br>
      2. 前台默认连接 <code>server/api/</code>，若你把 server 放在了别的路径，改
      <code>js/net/api.js</code> 里的 <code>BASE</code> 即可。
    </p>
    <div class="done-links">
      <a class="pri" href="../index.html">进入游戏</a>
      <a href="admin/">进入管理后台</a>
    </div>
  </div>
<?php else: ?>
  <?php if ($errors): ?>
    <div class="err"><b>安装没有完成：</b><ul><?php foreach ($errors as $e): ?><li><?= h($e) ?></li><?php endforeach; ?></ul></div>
    <?php if ($summary): ?>
    <div class="suc" style="background:#f7f4ee;border-color:#e0d9cb;color:#5c5751">
      <b>本次已经做完的步骤（修正问题后可直接重试，建表语句全部带 IF NOT EXISTS，不会重复出错）：</b>
      <ul><?php foreach ($summary as $s): ?><li><?= h($s) ?></li><?php endforeach; ?></ul>
    </div>
    <?php endif; ?>
  <?php endif; ?>

  <div class="card">
    <h2><span class="n">1</span>环境检测</h2>
    <table>
      <?php foreach ($checks as $c): ?>
      <tr><td><?= h($c[0]) ?></td><td class="<?= $c[2] ? 'ok' : 'no' ?>"><?= $c[2] ? '✓ ' : '✗ ' ?><?= h($c[1]) ?></td></tr>
      <?php endforeach; ?>
    </table>
    <?php if (!$envOk): ?>
      <p class="tip" style="color:#c0392b">有必检项未通过，请先在服务器上补齐后再安装。</p>
    <?php endif; ?>
  </div>

  <form method="post">
  <div class="card">
    <h2><span class="n">2</span>数据库</h2>
    <div class="row">
      <div><label>主机</label><input type="text" name="db_host" value="<?= h($_POST['db_host'] ?? '127.0.0.1') ?>"></div>
      <div><label>端口</label><input type="number" name="db_port" value="<?= h($_POST['db_port'] ?? '3306') ?>"></div>
    </div>
    <div class="row">
      <div><label>数据库名</label><input type="text" name="db_name" value="<?= h($_POST['db_name'] ?? 'life_game') ?>"></div>
      <div><label>表前缀</label><input type="text" name="db_prefix" value="<?= h($_POST['db_prefix'] ?? 'life_') ?>"></div>
    </div>
    <div class="row">
      <div><label>用户名</label><input type="text" name="db_user" value="<?= h($_POST['db_user'] ?? 'root') ?>"></div>
      <div><label>密码</label><input type="password" name="db_pass" value="<?= h($_POST['db_pass'] ?? '') ?>"></div>
    </div>
    <label class="chk"><input type="checkbox" name="auto_db" value="1" <?= !isset($_POST['auto_db']) || $_POST['auto_db'] ? 'checked' : '' ?>> 数据库不存在时自动创建（需要账号有建库权限）</label>
  </div>

  <div class="card">
    <h2><span class="n">3</span>管理员与站点</h2>
    <div class="row">
      <div><label>管理员账号</label><input type="text" name="admin_user" value="<?= h($_POST['admin_user'] ?? 'admin') ?>"></div>
      <div><label>站点名称</label><input type="text" name="site_name" value="<?= h($_POST['site_name'] ?? '人生就是一场游戏') ?>"></div>
    </div>
    <div class="row">
      <div><label>管理员密码（≥8 位）</label><input type="password" name="admin_pass"></div>
      <div><label>再输一次</label><input type="password" name="admin_pass2"></div>
    </div>
    <p class="tip">这个账号可以登录 <code>server/admin/</code> 管理后台，请记牢。</p>
  </div>

  <button class="btn" type="submit" <?= $envOk ? '' : 'disabled' ?>>开始安装</button>
  </form>
<?php endif; ?>
</div>
</body>
</html>
