<?php
/**
 * ============================================================
 *  访问统计：UA 解析 + 落库 + 清理
 *  ------------------------------------------------------------
 *  只记「页面被打开」这一件事，不记任何玩家行为内容。
 *  IP 只用于地区判定与排障，后台排行展示的是地区名，不展示 IP。
 * ============================================================
 */
declare(strict_types=1);

require_once __DIR__ . '/geoip.php';

/**
 * 解析 User-Agent。
 * 不引第三方库：常见桌面/移动浏览器够用，认不出的一律归「其他」。
 *
 * @return array{device:string,browser:string,os:string}
 */
function ua_parse(string $ua): array
{
    $ua = trim($ua);
    if ($ua === '') {
        return ['device' => '未知', 'browser' => '未知', 'os' => '未知'];
    }

    // ---- 设备 ----
    if (preg_match('/bot|spider|crawl|slurp|bingpreview|facebookexternalhit|curl\/|wget|python-requests|go-http|headless|phantomjs/i', $ua)) {
        $device = '机器人';
    } elseif (preg_match('/iPad|Tablet|PlayBook|Silk|Nexus 7|Nexus 9|Kindle/i', $ua)) {
        $device = '平板';
    } elseif (preg_match('/Mobile|Android|iPhone|iPod|BlackBerry|Windows Phone|HarmonyOS|OpenHarmony/i', $ua)) {
        $device = '手机';
    } else {
        $device = '电脑';
    }

    // ---- 系统 ----
    if ($device === '机器人') {
        $os = '爬虫';
    } elseif (preg_match('/Windows NT 10/i', $ua)) {
        $os = 'Windows 10/11';
    } elseif (preg_match('/Windows/i', $ua)) {
        $os = 'Windows';
    } elseif (preg_match('/HarmonyOS|OpenHarmony/i', $ua)) {
        $os = '鸿蒙';
    } elseif (preg_match('/Android/i', $ua)) {
        $os = 'Android';
    } elseif (preg_match('/iPhone|iPad|iPod/i', $ua)) {
        $os = 'iOS';
    } elseif (preg_match('/Mac OS X|Macintosh/i', $ua)) {
        $os = 'macOS';
    } elseif (preg_match('/CrOS/i', $ua)) {
        $os = 'ChromeOS';
    } elseif (preg_match('/Linux/i', $ua)) {
        $os = 'Linux';
    } else {
        $os = '其他';
    }

    // ---- 浏览器（顺序要紧：套壳浏览器 UA 里也带 Chrome/Safari）----
    if ($device === '机器人') {
        $browser = '爬虫';
    } elseif (preg_match('/MicroMessenger/i', $ua)) {
        $browser = '微信内置';
    } elseif (preg_match('/AlipayClient/i', $ua)) {
        $browser = '支付宝内置';
    } elseif (preg_match('/MQQBrowser|QQBrowser/i', $ua)) {
        $browser = 'QQ 浏览器';
    } elseif (preg_match('/UCBrowser|UBrowser/i', $ua)) {
        $browser = 'UC 浏览器';
    } elseif (preg_match('/HuaweiBrowser/i', $ua)) {
        $browser = '华为浏览器';
    } elseif (preg_match('/MiuiBrowser|XiaoMi/i', $ua)) {
        $browser = '小米浏览器';
    } elseif (preg_match('/Edg[A-Z]?\//i', $ua)) {
        $browser = 'Edge';
    } elseif (preg_match('/OPR\/|Opera/i', $ua)) {
        $browser = 'Opera';
    } elseif (preg_match('/Firefox\/|FxiOS/i', $ua)) {
        $browser = 'Firefox';
    } elseif (preg_match('/Chrome\/|CriOS/i', $ua)) {
        $browser = 'Chrome';
    } elseif (preg_match('/Safari\//i', $ua)) {
        $browser = 'Safari';
    } else {
        $browser = '其他';
    }

    return ['device' => $device, 'browser' => $browser, 'os' => $os];
}

/** 访问来源归一：只留域名，去掉协议与路径 */
function visit_ref(string $ref): string
{
    $ref = trim($ref);
    if ($ref === '') {
        return '';
    }
    $h = parse_url($ref, PHP_URL_HOST);
    if (!is_string($h) || $h === '') {
        // 前端可能只上报 host，这里兼容裸域名
        $h = preg_replace('#^https?://#i', '', $ref);
        $h = preg_replace('#/.*$#', '', (string)$h);
    }
    return substr(strtolower(trim((string)$h)), 0, 64);
}

/**
 * 记一次访问。表不存在时静默失败，绝不让埋点影响页面。
 *
 * @param array $in vid/path/tz/lang/screen/ref
 */
function visit_record(array $in): bool
{
    $ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
    $u  = ua_parse($ua);

    $vid = strtolower((string)preg_replace('/[^a-f0-9]/i', '', (string)($in['vid'] ?? '')));
    $vid = substr($vid, 0, 32);
    if ($vid === '') {
        // 没有前端指纹就用「IP + UA」兜住，UV 仍然能算
        $vid = substr(md5(client_ip() . '|' . $ua), 0, 32);
    }

    $path = (string)($in['path'] ?? 'index');
    if (!in_array($path, ['index', 'difu', 'tiangong'], true)) {
        $path = 'other';
    }

    $tz     = substr((string)($in['tz'] ?? ''), 0, 48);
    $lang   = substr((string)($in['lang'] ?? ''), 0, 24);
    $screen = substr((string)($in['screen'] ?? ''), 0, 12);
    $ref    = visit_ref((string)($in['ref'] ?? ''));
    $ip     = substr(client_ip(), 0, 45);
    $area   = substr(geo_area($ip, $tz), 0, 32);

    $uid = 0;
    if (function_exists('auth_user')) {
        $me = auth_user();
        if ($me) {
            $uid = (int)$me['id'];
        }
    }

    try {
        run(
            'INSERT INTO ' . t('visits') . ' (uid,vid,ip,area,device,browser,os,screen,tz,lang,path,ref,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [$uid, $vid, $ip, $area, $u['device'], $u['browser'], $u['os'], $screen, $tz, $lang, $path, $ref, date('Y-m-d H:i:s')]
        );
    } catch (Throwable $e) {
        // 老库还没建 visits 表：返回 false，前端不重试、后台显示修复提示
        return false;
    }

    // 千分之三的概率顺手清一次过期日志，避免表无限长
    if (random_int(1, 1000) <= 3) {
        visit_purge(365);
    }
    return true;
}

/** 清理 N 天前的访问日志（分批删，避免长锁表） */
function visit_purge(int $days = 180): int
{
    $days = max(1, $days);
    $before = date('Y-m-d H:i:s', time() - $days * 86400);
    $total = 0;
    try {
        for ($i = 0; $i < 20; $i++) {
            $n = run('DELETE FROM ' . t('visits') . ' WHERE created_at < ? LIMIT 2000', [$before]);
            $total += $n;
            if ($n < 2000) {
                break;
            }
        }
    } catch (Throwable $e) {
        return $total;
    }
    return $total;
}
