<?php
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/../lib/game.php';
require_once __DIR__ . '/../lib/visit.php';

require_admin_page();

$todayStart = date('Y-m-d 00:00:00');
// 老库还没补 visits 表时，页面降级显示提示，不白屏
$hasVisit = table_exists('visits');

// ------------------------------------------------------------
// 维护动作
// ------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    if ((string)($_POST['do'] ?? '') === 'purge_visits') {
        $n = visit_purge(180);
        audit('visits.purge', '', (string)$n);
        flash("已清理 180 天前的访问日志，共 {$n} 条。");
    }
    header('Location: index.php');
    exit;
}

// ------------------------------------------------------------
// 小工具
// ------------------------------------------------------------
/** 中国大陆省级地区名（与 geoip_data.php 输出一致；港澳台单列，不算「大陆」） */
function cn_areas(): array
{
    return [
        '北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江',
        '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南',
        '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '内蒙古',
        '广西', '西藏', '宁夏', '新疆',
    ];
}

/** KPI 卡：$v 允许带 HTML（数字里夹 <small>） */
function kpi_card(string $k, string $v, string $sub = ''): string
{
    return '<div class="kpi"><div class="k">' . h($k) . '</div><div class="v">' . $v
        . ($sub !== '' ? '<small>' . $sub . '</small>' : '') . '</div></div>';
}

/**
 * 柱顶数字缩写：万以下照原样，万以上用「万 / 亿」
 * 窄列里 ¥473,300 会跟隔壁挤成一团，缩成 ¥47.3万 才放得下；精确值留在悬停提示里。
 */
function short_num(float $v, bool $money = false): string
{
    $pre = $money ? '¥' : '';
    $a   = abs($v);
    if ($a >= 1e8) {
        return $pre . rtrim(rtrim(number_format($v / 1e8, 1, '.', ''), '0'), '.') . '亿';
    }
    if ($a >= 1e4) {
        return $pre . rtrim(rtrim(number_format($v / 1e4, 1, '.', ''), '0'), '.') . '万';
    }
    return $pre . number_format($v, 0, '.', ',');
}

/**
 * 竖向柱状统计图（所有排行面板共用）
 *
 * @param array $rows  每项 ['k'=>横轴标签, 'v'=>数值, 'sub'=>轴下小字, 'title'=>悬停详情]
 * @param bool  $money 数值是否按金额显示（¥ 前缀 + 千分位）
 *
 * 柱高按本组最大值归一，最小 2.5% 保证 0 附近的柱子仍可见；
 * 第 1 名高亮。标签与柱子分两行 flex，各列 flex:1 + 同 gap，天然对齐。
 */
function vchart(array $rows, bool $money = false): void
{
    if (!$rows) {
        return;
    }
    $max = 1;
    foreach ($rows as $r) {
        $max = max($max, (float)$r['v']);
    }
    $narrow = count($rows) >= 7 ? ' narrow' : '';

    echo '<div class="vchart' . $narrow . '"><div class="vc-plot">';
    foreach ($rows as $i => $r) {
        $v = (float)$r['v'];
        $h = $v > 0 ? max(2.5, $v / $max * 100) : 0;
        $txt = short_num($v, $money);
        $tip = isset($r['title']) && $r['title'] !== '' ? (string)$r['title'] : ((string)$r['k'] . '：' . $txt);
        echo '<div class="vc-col' . ($i === 0 ? ' top' : '') . '" title="' . h($tip) . '">'
            . '<b>' . $txt . '</b>'
            . '<i style="--h:' . round($h / 100, 4) . '"></i>'
            . '</div>';
    }
    echo '</div><div class="vc-x">';
    foreach ($rows as $r) {
        $sub = (string)($r['sub'] ?? '');
        echo '<div><span class="vc-k" title="' . h((string)$r['k']) . '">' . h((string)$r['k']) . '</span>'
            . ($sub !== '' ? '<span class="vc-s">' . h($sub) . '</span>' : '')
            . '</div>';
    }
    echo '</div></div>';
}

/** 窄柱里的显示名：把「QQ 浏览器」「微信内置」这类长标签压短，完整名放悬停提示 */
function chart_label(string $k): string
{
    static $map = [
        '微信内置' => '微信', '支付宝内置' => '支付宝',
        'QQ 浏览器' => 'QQ', 'QQ浏览器' => 'QQ',
        'UC 浏览器' => 'UC', 'UC浏览器' => 'UC',
        '华为浏览器' => '华为', '小米浏览器' => '小米',
        'Windows 10/11' => 'Win10/11',
        '人生就是一场游戏' => '人生大富翁',
    ];
    return $map[$k] ?? $k;
}

/** 把 [['k'=>..,'c'=>..]] 的查询结果换成 vchart 行，占比写进轴下小字 */
function vchart_rows(array $rows, string $labelKey, string $valueKey, int $total): array
{
    $out = [];
    foreach ($rows as $r) {
        $raw = (string)$r[$labelKey];
        if ($raw === '') {
            $raw = '未知';
        }
        $k   = chart_label($raw);
        $v   = (int)$r[$valueKey];
        $pct = $total > 0 ? round($v / $total * 100, 1) : 0;
        $out[] = ['k' => $k, 'v' => $v, 'sub' => $pct . '%', 'title' => $raw . '：' . nf($v) . ' 次'];
    }
    return $out;
}

// ------------------------------------------------------------
// 基础指标
// ------------------------------------------------------------
$kpi = [
    'users'  => (int)scalar('SELECT COUNT(*) FROM ' . t('users') . ' WHERE status=1'),
    'banned' => (int)scalar('SELECT COUNT(*) FROM ' . t('users') . ' WHERE status=0'),
    'new'    => (int)scalar('SELECT COUNT(*) FROM ' . t('users') . ' WHERE created_at>=?', [$todayStart]),
    'lives'  => (int)scalar('SELECT COUNT(*) FROM ' . t('lives')),
    'closed' => (int)scalar('SELECT COUNT(*) FROM ' . t('lives') . ' WHERE closed=1'),
    'today'  => (int)scalar('SELECT COUNT(*) FROM ' . t('lives') . ' WHERE started_at>=?', [$todayStart]),
    'karma'  => (int)scalar('SELECT COUNT(*) FROM ' . t('karma') . ' WHERE claimed_by=0'),
    'cases'  => (int)scalar('SELECT COUNT(*) FROM ' . t('cases') . ' WHERE status=0'),
];

$world = world_state(false);

// ------------------------------------------------------------
// 访问数据
// ------------------------------------------------------------
$visit = [
    'pv_today' => 0, 'uv_today' => 0,
    'pv_all'   => 0, 'uv_all'   => 0,
    'areas'    => 0, 'areas_cn' => 0, 'areas_out' => 0,
];
$devRows = [];
$osRows  = [];
$brRows  = [];
$areaRows = [];
$areaTotal = 0;
$pathRows = [];

if ($hasVisit) {
    $visit['pv_today'] = (int)scalar('SELECT COUNT(*) FROM ' . t('visits') . ' WHERE created_at>=?', [$todayStart]);
    $visit['uv_today'] = (int)scalar('SELECT COUNT(DISTINCT vid) FROM ' . t('visits') . ' WHERE created_at>=?', [$todayStart]);
    $visit['pv_all']   = (int)scalar('SELECT COUNT(*) FROM ' . t('visits'));
    $visit['uv_all']   = (int)scalar('SELECT COUNT(DISTINCT vid) FROM ' . t('visits'));

    $devRows = all('SELECT device k, COUNT(*) c FROM ' . t('visits') . ' GROUP BY device ORDER BY c DESC');
    $osRows  = all('SELECT os k, COUNT(*) c FROM ' . t('visits') . ' GROUP BY os ORDER BY c DESC LIMIT 6');
    $brRows  = all('SELECT browser k, COUNT(*) c FROM ' . t('visits') . ' GROUP BY browser ORDER BY c DESC LIMIT 6');
    $pathRows = all('SELECT path k, COUNT(*) c FROM ' . t('visits') . ' GROUP BY path ORDER BY c DESC');

    $areaAll = all(
        'SELECT area k, COUNT(*) c FROM ' . t('visits') . "
          WHERE area<>'' AND area<>'内网' AND area<>'未知'
          GROUP BY area ORDER BY c DESC"
    );
    $cnSet = array_flip(cn_areas());
    foreach ($areaAll as $r) {
        if (isset($cnSet[(string)$r['k']])) {
            $visit['areas_cn']++;
        }
    }
    // 覆盖地区 = 大陆省 + 港澳台 + 境外；KPI 里第二项统一叫「其他」
    $visit['areas'] = count($areaAll);
    $visit['areas_out'] = $visit['areas'] - $visit['areas_cn'];
    $areaTotal = array_sum(array_map(fn($r) => (int)$r['c'], $areaAll));
    $areaRows  = array_slice($areaAll, 0, 8);
}

// ------------------------------------------------------------
// 七天注册趋势
// ------------------------------------------------------------
$trend = [];
for ($i = 6; $i >= 0; $i--) {
    $trend[date('Y-m-d', strtotime("-{$i} day"))] = 0;
}
foreach (all(
    'SELECT DATE(created_at) d, COUNT(*) c FROM ' . t('users') . '
      WHERE created_at>=? GROUP BY DATE(created_at)',
    [date('Y-m-d 00:00:00', strtotime('-6 day'))]
) as $r) {
    $k = (string)$r['d'];
    if (isset($trend[$k])) {
        $trend[$k] = (int)$r['c'];
    }
}
$trendMax = max(1, max($trend));
$trendSum = array_sum($trend);

// ------------------------------------------------------------
// 排行
// ------------------------------------------------------------
$scoreRank = all(
    'SELECT u.nickname,u.username,COUNT(l.id) cnt,SUM(l.score) total,MAX(l.score) best
       FROM ' . t('lives') . ' l JOIN ' . t('users') . ' u ON u.id=l.uid
      WHERE l.closed=1
      GROUP BY u.id,u.nickname,u.username
      ORDER BY total DESC, best DESC
      LIMIT 8'
);
$moneyRank = all(
    'SELECT u.nickname,u.username,MAX(l.money) money,MAX(l.day) day,COUNT(l.id) cnt
       FROM ' . t('lives') . ' l JOIN ' . t('users') . ' u ON u.id=l.uid
      GROUP BY u.id,u.nickname,u.username
      ORDER BY money DESC
      LIMIT 8'
);
$jobDist = all(
    'SELECT job_name, COUNT(*) c, ROUND(AVG(score)) avg_score, MAX(score) best
       FROM ' . t('lives') . " WHERE job_name<>''
      GROUP BY job_name ORDER BY c DESC LIMIT 10"
);
$jobTotal = (int)scalar('SELECT COUNT(*) FROM ' . t('lives') . " WHERE job_name<>''");

$recent = all(
    'SELECT l.id,l.job_name,l.season_no,l.day,l.money,l.score,l.ending,l.closed,l.started_at,u.nickname,u.username
     FROM ' . t('lives') . ' l JOIN ' . t('users') . ' u ON u.id=l.uid
     ORDER BY l.id DESC LIMIT 12'
);

render_head('数据概览', 'index');
?>

<!-- ================= 玩家与对局 ================= -->
<div class="sec-head"><h2>玩家与对局</h2><a class="muted" href="users.php">用户管理 →</a></div>
<div class="cards c6">
  <?= kpi_card('注册玩家', nf($kpi['users']), $kpi['banned'] ? '封禁 ' . $kpi['banned'] : '') ?>
  <?= kpi_card('今日新增', nf($kpi['new'])) ?>
  <?= kpi_card('累计对局', nf($kpi['lives']), '已结算 ' . nf($kpi['closed'])) ?>
  <?= kpi_card('今日开局', nf($kpi['today'])) ?>
  <?= kpi_card('待领取业力', nf($kpi['karma'])) ?>
  <?= kpi_card('待审案卷', nf($kpi['cases'])) ?>
</div>

<!-- ================= 访问概览 ================= -->
<div class="sec-head">
  <h2>访问概览</h2>
  <?php if ($hasVisit && $visit['pv_all'] > 0): ?>
    <form method="post" onsubmit="return confirm('只清理 180 天前的记录，最近半年的不动。继续？')">
      <input type="hidden" name="_csrf" value="<?= h(csrf_token()) ?>">
      <button class="btn sm" type="submit" name="do" value="purge_visits">清理旧访问日志</button>
    </form>
  <?php endif; ?>
</div>

<?php if (!$hasVisit): ?>
  <div class="panel">
    <div class="empty">
      还没有 <span class="mono">visits</span> 数据表，访问统计暂不可用。<br>
      到「系统设置 → 检查并修复数据表」点一下就会自动补上，已有数据不受影响。
    </div>
    <div style="text-align:center"><a class="btn pri sm" href="settings.php">去修复数据表</a></div>
  </div>
<?php else: ?>
  <div class="cards">
    <?= kpi_card('今日访问', nf($visit['pv_today']), '独立访客 ' . nf($visit['uv_today'])) ?>
    <?= kpi_card('累计访问', nf($visit['pv_all']), '独立访客 ' . nf($visit['uv_all'])) ?>
    <?= kpi_card('覆盖地区', nf($visit['areas']), '大陆 ' . $visit['areas_cn'] . ' · 其他 ' . $visit['areas_out']) ?>
    <?= kpi_card('当前在线', nf($world['online'])) ?>
  </div>
<?php endif; ?>

<!-- ================= 七天注册趋势 ================= -->
<div class="panel">
  <h2>七天注册趋势 <span class="muted" style="font-weight:400">合计 <?= nf($trendSum) ?> 人</span></h2>
  <?php if ($trendSum === 0): ?>
    <div class="empty">近七天没有新玩家注册。</div>
  <?php else: ?>
    <?php
    $svgW = 720;
    $svgH = 190;
    $baseY = 152;
    $topY  = 34;
    $slot  = $svgW / 7;
    $barW  = 46;
    $cells = '';
    $i = 0;
    foreach ($trend as $d => $c) {
        $h = $c > 0 ? max(4, (int)round($c / $trendMax * ($baseY - $topY))) : 2;
        $x = $i * $slot + ($slot - $barW) / 2;
        $y = $baseY - $h;
        $isToday = $i === 6;
        $fill = $isToday ? '#eeb465' : 'rgba(224,164,88,.5)';
        $mid  = $x + $barW / 2;
        $cells .= '<rect x="' . round($x, 1) . '" y="' . round($y, 1) . '" width="' . $barW . '" height="' . $h
            . '" rx="4" fill="' . $fill . '"><title>' . h($d) . ' 注册 ' . $c . ' 人</title></rect>';
        if ($c > 0) {
            $cells .= '<text x="' . round($mid, 1) . '" y="' . round($y - 9, 1)
                . '" text-anchor="middle" font-size="12.5" fill="#e8eaee">' . $c . '</text>';
        }
        $cells .= '<text x="' . round($mid, 1) . '" y="' . ($baseY + 24)
            . '" text-anchor="middle" font-size="11.5" fill="' . ($isToday ? '#e0a458' : '#6b7382') . '">'
            . h(date('m-d', strtotime($d))) . '</text>';
        $i++;
    }
    ?>
    <svg class="trend" viewBox="0 0 <?= $svgW ?> <?= $svgH ?>" preserveAspectRatio="xMidYMid meet" role="img" aria-label="七天注册趋势">
      <line x1="0" y1="<?= $baseY ?>" x2="<?= $svgW ?>" y2="<?= $baseY ?>" stroke="#2a2f3a" stroke-width="1"/>
      <?= $cells ?>
    </svg>
  <?php endif; ?>
</div>

<!-- ================= 玩家积分 / 资产排行 ================= -->
<div class="grid2">
  <div class="panel">
    <h2>玩家积分排行 <span class="muted" style="font-weight:400">累计结算分</span></h2>
    <?php if (!$scoreRank): ?>
      <div class="empty">还没有结算过的人生。</div>
    <?php else: ?>
      <?php
        $rows = [];
        foreach ($scoreRank as $r) {
            $name = (string)($r['nickname'] ?: $r['username']);
            $rows[] = [
                'k'     => $name,
                'v'     => (int)$r['total'],
                'sub'   => nf($r['cnt']) . ' 局',
                'title' => $name . '　累计 ' . nf($r['total']) . ' 分　' . nf($r['cnt']) . ' 局　最高单局 ' . nf($r['best']),
            ];
        }
        vchart($rows);
      ?>
      <p class="muted" style="margin:10px 0 0">柱高＝累计积分，轴下小字＝已结算局数，悬停看最高单局。</p>
    <?php endif; ?>
  </div>

  <div class="panel">
    <h2>玩家资产排行 <span class="muted" style="font-weight:400">单局最高资产</span></h2>
    <?php if (!$moneyRank): ?>
      <div class="empty">还没有人开局。</div>
    <?php else: ?>
      <?php
        $rows = [];
        foreach ($moneyRank as $r) {
            $name = (string)($r['nickname'] ?: $r['username']);
            $rows[] = [
                'k'     => $name,
                'v'     => (int)$r['money'],
                'sub'   => nf($r['day']) . ' 天',
                'title' => $name . '　最高资产 ¥' . nf($r['money']) . '　活到第 ' . nf($r['day']) . ' 天　共 ' . nf($r['cnt']) . ' 局',
            ];
        }
        vchart($rows, true);
      ?>
      <p class="muted" style="margin:10px 0 0">柱高＝单局最高资产，轴下小字＝那一世活到第几天。</p>
    <?php endif; ?>
  </div>
</div>

<!-- ================= 玩家职业排行 ================= -->
<div class="panel">
  <h2>玩家职业排行 <span class="muted" style="font-weight:400">共 <?= nf($jobTotal) ?> 次人生</span></h2>
  <?php if (!$jobDist): ?>
    <div class="empty">暂无数据。</div>
  <?php else: ?>
    <?php
      $rows = [];
      foreach ($jobDist as $j) {
          $jname = (string)$j['job_name'];
          $rows[] = [
              'k'     => $jname,
              'v'     => (int)$j['c'],
              'sub'   => '均' . nf($j['avg_score']),
              'title' => $jname . '　' . nf($j['c']) . ' 人次　平均 ' . nf($j['avg_score']) . ' 分　最高 ' . nf($j['best']) . ' 分',
          ];
      }
      vchart($rows);
    ?>
    <p class="muted" style="margin:10px 0 0">柱高＝该职业的人生次数，轴下小字＝平均分；人次数含未结算的一世。</p>
  <?php endif; ?>
</div>

<!-- ================= 访问排行 ================= -->
<?php if ($hasVisit): ?>
<div class="grid3">
  <div class="panel">
    <h2>访问设备排行</h2>
    <?php if (!$devRows): ?>
      <div class="empty">还没有访问记录。</div>
    <?php else: ?>
      <?php vchart(vchart_rows($devRows, 'k', 'c', $visit['pv_all'])); ?>
    <?php endif; ?>
  </div>

  <div class="panel">
    <h2>访问浏览器排行</h2>
    <?php if (!$brRows): ?>
      <div class="empty">还没有访问记录。</div>
    <?php else: ?>
      <?php vchart(vchart_rows($brRows, 'k', 'c', $visit['pv_all'])); ?>
    <?php endif; ?>
  </div>

  <div class="panel">
    <h2>访问地区排行</h2>
    <?php if (!$areaRows): ?>
      <div class="empty">还没有可识别的地区。</div>
    <?php else: ?>
      <?php vchart(vchart_rows($areaRows, 'k', 'c', $areaTotal)); ?>
      <p class="muted" style="margin:10px 0 0">
        共覆盖 <?= $visit['areas'] ?> 个地区（大陆 <?= $visit['areas_cn'] ?> · 其他 <?= $visit['areas_out'] ?>），
        地区按 IP 离线库判定，省级近似。
      </p>
    <?php endif; ?>
  </div>
</div>

<div class="grid2">
  <div class="panel">
    <h2>访问入口分布</h2>
    <?php if (!$pathRows): ?>
      <div class="empty">还没有访问记录。</div>
    <?php else: ?>
      <?php
        $pathName = ['index' => '人生就是一场游戏', 'difu' => '幽冥地府', 'tiangong' => '天庭漫游', 'other' => '其他页面'];
        $rows = [];
        foreach ($pathRows as $r) {
            $rows[] = ['k' => $pathName[(string)$r['k']] ?? (string)$r['k'], 'c' => $r['c']];
        }
        vchart(vchart_rows($rows, 'k', 'c', $visit['pv_all']));
      ?>
    <?php endif; ?>
  </div>

  <div class="panel">
    <h2>访问系统排行</h2>
    <?php if (!$osRows): ?>
      <div class="empty">还没有访问记录。</div>
    <?php else: ?>
      <?php vchart(vchart_rows($osRows, 'k', 'c', $visit['pv_all'])); ?>
    <?php endif; ?>
  </div>
</div>
<?php endif; ?>

<!-- ================= 世界状态 ================= -->
<div class="panel">
  <h2>世界状态</h2>
  <div class="inline" style="gap:22px">
    <div><span class="muted">游戏内时刻</span><div class="mono" style="font-size:17px"><?= h($world['clock']) ?><?= $world['is_night'] ? ' · 夜' : ' · 昼' ?></div></div>
    <div><span class="muted">全服天气</span><div style="font-size:15px"><?= h($world['weather']) ?></div></div>
    <div><span class="muted">物价系数</span><div style="font-size:15px"><?= h($world['price']) ?></div></div>
    <div><span class="muted">在线</span><div style="font-size:15px"><?= nf($world['online']) ?></div></div>
    <div><span class="muted">节气/节日</span><div style="font-size:15px"><?= $world['festival'] !== '' ? h($world['festival']) : '—' ?></div></div>
    <div style="margin-left:auto"><a class="btn sm" href="world.php">调整世界</a></div>
  </div>
</div>

<!-- ================= 最近的对局 ================= -->
<div class="panel">
  <h2>最近的对局</h2>
  <?php if (!$recent): ?>
    <div class="empty">还没有人开局。</div>
  <?php else: ?>
  <table>
    <thead><tr><th>ID</th><th>玩家</th><th>身份</th><th>第几世</th><th>天数</th><th>资产</th><th>评分</th><th>结局</th><th>状态</th><th>开局时间</th></tr></thead>
    <tbody>
    <?php foreach ($recent as $r): ?>
      <tr>
        <td class="mono">#<?= (int)$r['id'] ?></td>
        <td><?= h($r['nickname'] ?: $r['username']) ?></td>
        <td><?= h($r['job_name']) ?></td>
        <td><?= (int)$r['season_no'] ?></td>
        <td><?= (int)$r['day'] ?></td>
        <td class="mono"><?= nf($r['money']) ?></td>
        <td class="mono"><?= (int)$r['score'] ?></td>
        <td><?= h($r['ending'] ?: '—') ?></td>
        <td><?= (int)$r['closed'] === 1 ? '<span class="tag ok">已结算</span>' : '<span class="tag warn">进行中</span>' ?></td>
        <td class="muted mono"><?= h($r['started_at']) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>
<?php render_foot(); ?>
