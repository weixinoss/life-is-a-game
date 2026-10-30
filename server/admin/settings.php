<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
$me = require_admin_page();

/** 读写 settings 表 */
function setting_get(string $k, string $d = ''): string
{
    $v = scalar('SELECT v FROM ' . t('settings') . ' WHERE k=?', [$k], null);
    return $v === null ? $d : (string)$v;
}
function setting_set(string $k, string $v): void
{
    run('INSERT INTO ' . t('settings') . ' (k,v) VALUES (?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)', [$k, $v]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $do = (string)($_POST['do'] ?? '');
    if ($do === 'save') {
        setting_set('notice', mb_substr(trim((string)($_POST['notice'] ?? '')), 0, 500));
        setting_set('maintain', !empty($_POST['maintain']) ? '1' : '0');
        setting_set('karma_hint', mb_substr(trim((string)($_POST['karma_hint'] ?? '')), 0, 200));
        audit('settings.save');
        flash('设置已保存。');
    } elseif ($do === 'save_realm') {
        // 三界判定：死亡后去地府还是天庭，规则与概率都在这里调
        setting_set('realm_enabled', !empty($_POST['realm_enabled']) ? '1' : '0');
        setting_set('realm_p_hell', (string)max(0, min(100, (int)($_POST['realm_p_hell'] ?? 100))));
        setting_set('realm_p_heaven', (string)max(0, min(100, (int)($_POST['realm_p_heaven'] ?? 100))));
        setting_set('realm_evil_need', (string)max(1, min(50, (int)($_POST['realm_evil_need'] ?? 1))));
        setting_set('realm_mercy', (string)max(0, min(50, (int)($_POST['realm_mercy'] ?? 0))));
        audit('settings.realm', '', sprintf('phell %d pheaven %d need %d mercy %d',
            (int)($_POST['realm_p_hell'] ?? 100), (int)($_POST['realm_p_heaven'] ?? 100),
            (int)($_POST['realm_evil_need'] ?? 1), (int)($_POST['realm_mercy'] ?? 0)));
        flash('三界判定已保存，下一次结局生效（前端每次开局会重新读一次）。');
    } elseif ($do === 'clear_runtime') {
        $n = 0;
        foreach (glob(LIFE_ROOT . '/runtime/*') ?: [] as $f) {
            if (is_file($f) && @unlink($f)) {
                $n++;
            }
        }
        audit('settings.clear_runtime', '', (string)$n);
        flash("已清理 {$n} 个缓存/限流文件。");
    } elseif ($do === 'repair_db') {
        // 把 schema.sql 再跑一遍：全是 CREATE TABLE IF NOT EXISTS，重复执行安全。
        // 用途：升级后新增了表（比如广告位 ads），老库不用重装也不用碰命令行。
        $prefix = (string)cfg('db.prefix', 'life_');
        $raw = (string)@file_get_contents(LIFE_ROOT . '/sql/schema.sql');
        if (trim($raw) === '') {
            flash('读不到 sql/schema.sql，请确认文件存在。', 'bad');
        } else {
            $stmts = sql_split(str_replace('{{P}}', $prefix, $raw));
            $ok = 0;
            $bad = [];
            foreach ($stmts as $one) {
                try {
                    db()->exec($one);
                    $ok++;
                } catch (Throwable $e) {
                    $bad[] = $e->getMessage();
                }
            }
            $have = [];
            foreach (db()->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN) as $tn) {
                $have[strtolower((string)$tn)] = true;
            }
            $miss = [];
            foreach (schema_tables() as $n) {
                if (!isset($have[strtolower($prefix . $n)])) {
                    $miss[] = $prefix . $n;
                }
            }
            $seeded = ad_seed(db(), $prefix);
            audit('settings.repair_db', '', 'exec ' . $ok . ' miss ' . count($miss));
            if ($miss) {
                flash('修复未完成，仍缺 ' . count($miss) . ' 张表：' . implode('、', $miss)
                    . ($bad ? '。首个错误：' . $bad[0] : ''), 'bad');
            } else {
                flash('数据表已全部就绪（执行 ' . $ok . ' 条语句）'
                    . ($seeded ? '，并写入 ' . $seeded . ' 条默认广告' : '') . '。');
            }
        }
    }
    header('Location: settings.php');
    exit;
}

$notice   = setting_get('notice');
$maintain = setting_get('maintain', '0');
$hint     = setting_get('karma_hint');
$rmOn     = setting_get('realm_enabled', '1') !== '0';
$rmHell   = (int)setting_get('realm_p_hell', '100');
$rmHeaven = (int)setting_get('realm_p_heaven', '100');
$rmNeed   = (int)setting_get('realm_evil_need', '1');
$rmMercy  = (int)setting_get('realm_mercy', '0');
$audit    = all('SELECT a.*, u.username FROM ' . t('audit') . ' a LEFT JOIN ' . t('users') . ' u ON u.id=a.uid ORDER BY a.id DESC LIMIT 40');
$mysqlVer = '—';
try {
    $mysqlVer = (string)db()->query('SELECT VERSION()')->fetchColumn();
} catch (Throwable $e) {
}

render_head('系统设置', 'settings');
?>
<form class="panel" method="post">
  <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
  <h2>运营设置</h2>
  <label style="margin-top:0">站点公告（显示在游戏登录浮层顶部，留空则不显示）</label>
  <textarea name="notice" rows="3" placeholder="例如：本周六晚八点全服放灯，记得上线。"><?= h($notice) ?></textarea>

  <label>业力卡片提示语（自定义一句，可留空）</label>
  <input type="text" name="karma_hint" value="<?= h($hint) ?>" placeholder="例如：你做过的事，别人会记得。">

  <label style="display:flex;align-items:center;gap:8px;margin-top:16px">
    <input type="checkbox" name="maintain" value="1" <?= $maintain === '1' ? 'checked' : '' ?> style="width:auto">
    维护模式（前端会提示暂停，不阻止接口调用）
  </label>

  <div class="inline" style="margin-top:20px">
    <button class="btn pri" type="submit" name="do" value="save">保存</button>
  </div>
</form>

<form class="panel" method="post">
  <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
  <h2>三界判定 <span class="muted" style="font-weight:400">死后去地府还是天庭</span></h2>
  <p class="muted" style="margin:-6px 0 14px;line-height:1.9">
    人生走到结局（撑不住 / 病倒 / 不想动 / 走满一年）时，前端按这里的规则判一次归宿：
    <b>做过恶事</b>的人魂归幽冥 <span class="mono">difu.html</span>，
    <b>一件都没做过</b>的人位列仙班 <span class="mono">tiangong.html</span>。
    判定成功时结局卡上会倒计时 8 秒自动前往，玩家也可以点「留在这一世」取消。
    概率调低，就有一部分人判完之后卡在结局页。
  </p>

  <label style="display:flex;align-items:center;gap:8px;margin-top:0">
    <input type="checkbox" name="realm_enabled" value="1" <?= $rmOn ? 'checked' : '' ?> style="width:auto">
    启用三界判定
  </label>

  <div class="row2" style="margin-top:6px">
    <div>
      <label>有恶行 → 入地府（%）</label>
      <input type="number" name="realm_p_hell" min="0" max="100" value="<?= $rmHell ?>">
    </div>
    <div>
      <label>无恶行 → 入天庭（%）</label>
      <input type="number" name="realm_p_heaven" min="0" max="100" value="<?= $rmHeaven ?>">
    </div>
  </div>

  <div class="row2">
    <div>
      <label>恶行判定阈值（做满几件算「做过坏事」）</label>
      <input type="number" name="realm_evil_need" min="1" max="50" value="<?= $rmNeed ?>">
    </div>
    <div>
      <label>善行抵过（善业 − 恶业 ≥ 此值时改判天庭，0 = 关闭）</label>
      <input type="number" name="realm_mercy" min="0" max="50" value="<?= $rmMercy ?>">
    </div>
  </div>

  <p class="muted" style="margin:14px 0 0">
    当前规则：恶行 ≥ <b><?= $rmNeed ?></b> 件 → 有 <b><?= $rmHell ?>%</b> 入地府；
    否则有 <b><?= $rmHeaven ?>%</b> 入天庭。
    <?php if ($rmMercy > 0): ?>善业比恶业多出 <b><?= $rmMercy ?></b> 件以上，罪业一笔勾销。<?php endif; ?>
    善恶只由选项决定（选项卡上会标「善业 +1 / 恶业 +1」），前端只报次数，不上报内容。
  </p>

  <div class="inline" style="margin-top:16px">
    <button class="btn pri" type="submit" name="do" value="save_realm">保存三界判定</button>
    <span class="muted">改完立即生效，不用重启。</span>
  </div>
</form>

<div class="panel">
  <h2>环境信息</h2>
  <table>
    <tr><td style="width:180px">PHP 版本</td><td class="mono"><?= h(PHP_VERSION) ?></td></tr>
    <tr><td>MySQL 版本</td><td class="mono"><?= h($mysqlVer) ?></td></tr>
    <tr><td>表前缀</td><td class="mono"><?= h(cfg('db.prefix', 'life_')) ?></td></tr>
    <tr><td>数据库</td><td class="mono"><?= h(cfg('db.name', '')) ?> @ <?= h(cfg('db.host', '')) ?>:<?= h((string)cfg('db.port', 3306)) ?></td></tr>
    <tr><td>站点时区</td><td class="mono"><?= h(cfg('site.timezone', 'Asia/Shanghai')) ?></td></tr>
    <tr><td>令牌有效期</td><td class="mono"><?= nf(cfg('site.token_ttl', 0) / 86400) ?> 天</td></tr>
    <tr><td>接口限流</td><td class="mono"><?= nf(cfg('site.rate_limit', 240)) ?> 次 / 分钟 / IP</td></tr>
    <tr><td>服务端目录</td><td class="mono"><?= h(LIFE_ROOT) ?></td></tr>
    <tr><td>已上线的玩法</td><td class="mono">
      <?php
        $on = [];
        foreach ((array)cfg('feature', []) as $k => $v) {
            if ($v) {
                $on[] = $k;
            }
        }
        echo h(implode(' · ', $on));
      ?>
    </td></tr>
  </table>
  <p class="muted" style="margin-bottom:0">
    玩法开关在 <span class="mono">server/lib/config.php</span> 的 <span class="mono">feature</span> 段，改完即时生效。
  </p>
</div>

<form class="panel" method="post">
  <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
  <h2>维护工具</h2>
  <p class="muted" style="margin:-6px 0 14px">清理后会重置所有 IP 的限流计数，不影响业务数据。</p>
  <button class="btn" type="submit" name="do" value="clear_runtime" onclick="return confirm('确认清理？')">清理 runtime 缓存</button>

  <hr style="margin:22px 0;border:none;border-top:1px solid rgba(0,0,0,.08)">

  <p class="muted" style="margin:-6px 0 14px">
    升级后新增了数据表（例如广告位 <span class="mono">ads</span>）时，不用重装、不用进数据库，
    点一下就会把 <span class="mono">sql/schema.sql</span> 补跑一遍。所有语句都是
    <span class="mono">CREATE TABLE IF NOT EXISTS</span>，已有数据不会被改动。
  </p>
  <button class="btn pri" type="submit" name="do" value="repair_db">检查并修复数据表</button>
</form>

<div class="panel">
  <h2>操作日志（最近 40 条）</h2>
  <?php if (!$audit): ?><div class="empty">还没有操作记录。</div><?php else: ?>
  <table>
    <thead><tr><th>时间</th><th>操作者</th><th>动作</th><th>对象</th><th>详情</th><th>IP</th></tr></thead>
    <tbody>
    <?php foreach ($audit as $a): ?>
      <tr>
        <td class="muted mono"><?= h(substr((string)$a['created_at'], 0, 16)) ?></td>
        <td><?= h($a['username'] ?: '—') ?></td>
        <td><span class="tag mute"><?= h($a['action']) ?></span></td>
        <td class="mono"><?= h($a['target'] ?: '—') ?></td>
        <td class="muted"><?= h($a['detail'] ?: '—') ?></td>
        <td class="muted mono"><?= h($a['ip']) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>
<?php render_foot(); ?>
