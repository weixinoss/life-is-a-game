<?php
/**
 * ============================================================
 *  IP → 归属地区（离线，不联网、不依赖扩展）
 *  ------------------------------------------------------------
 *  数据在 geoip_data.php：IPv4 /24 区间表，约 4.1 万条，1.2MB。
 *  只在「记一次访问」时才会被 require，其余接口不受影响。
 *
 *  为什么中国段保留原始边界：
 *    省级 IP 段大多是 /24 起步，按 /16 归并会把不同省的段糊在一起
 *    （实测准确率从 99.9% 掉到 92.6%）。境外段访问量小，按 /16 归并即可，
 *    这样表体积从 32MB 压到 1.2MB。
 *
 *  判定顺序：
 *    1. IPv4 → 查区间表
 *    2. 表里没命中 / IPv6 / 内网 → 用前端上报的时区兜底
 *    3. 还是不知道 → 「未知」
 * ============================================================
 */
declare(strict_types=1);

/** 加载区间表（静态缓存，一次请求只读一次文件） */
function geo_runs(): array
{
    static $runs = null;
    if ($runs === null) {
        $runs = require __DIR__ . '/geoip_data.php';
    }
    return $runs;
}

/** 点分 IPv4 → 无符号整数；非法返回 -1 */
function ip_to_long(string $ip): int
{
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === false) {
        return -1;
    }
    $n = ip2long($ip);
    return $n === false ? -1 : (int)$n;
}

/** 时区 → 地区（IP 库没命中时的兜底，精度只到国家/地区） */
function tz_area(string $tz): string
{
    $tz = trim($tz);
    if ($tz === '') {
        return '';
    }
    // 精确匹配优先
    $exact = [
        'Asia/Shanghai'   => '中国大陆',
        'Asia/Chongqing'  => '中国大陆',
        'Asia/Harbin'     => '中国大陆',
        'PRC'             => '中国大陆',
        'Asia/Urumqi'     => '新疆',
        'Asia/Kashgar'    => '新疆',
        'Asia/Hong_Kong'  => '中国香港',
        'Hongkong'        => '中国香港',
        'Asia/Macau'      => '中国澳门',
        'Asia/Macao'      => '中国澳门',
        'Asia/Taipei'     => '中国台湾',
        'Asia/Tokyo'      => '日本',
        'Asia/Seoul'      => '韩国',
        'Asia/Singapore'  => '新加坡',
        'Asia/Bangkok'    => '泰国',
        'Asia/Kuala_Lumpur' => '马来西亚',
        'Asia/Jakarta'    => '印度尼西亚',
        'Asia/Manila'     => '菲律宾',
        'Asia/Ho_Chi_Minh' => '越南',
        'Asia/Kolkata'    => '印度',
        'Asia/Calcutta'   => '印度',
        'Asia/Dubai'      => '阿联酋',
        'Asia/Tashkent'   => '乌兹别克斯坦',
    ];
    if (isset($exact[$tz])) {
        return $exact[$tz];
    }
    // 前缀兜底
    if (strpos($tz, 'America/') === 0) {
        return '北美';
    }
    if (strpos($tz, 'Europe/') === 0) {
        return '欧洲';
    }
    if (strpos($tz, 'Australia/') === 0) {
        return '澳大利亚';
    }
    if (strpos($tz, 'Africa/') === 0) {
        return '非洲';
    }
    if (strpos($tz, 'Asia/') === 0) {
        return '亚洲其他';
    }
    return '';
}

/**
 * 判定一个 IP 的地区。
 *
 * @param string $ip 客户端 IP
 * @param string $tz 前端上报的时区（可空）
 */
function geo_area(string $ip, string $tz = ''): string
{
    $v4 = ip_to_long($ip);
    if ($v4 >= 0) {
        $b = $v4 >> 8;
        $runs = geo_runs();
        $lo = 0;
        $hi = count($runs) - 1;
        while ($lo <= $hi) {
            $mid = ($lo + $hi) >> 1;
            if ($b < $runs[$mid][0]) {
                $hi = $mid - 1;
            } elseif ($b > $runs[$mid][1]) {
                $lo = $mid + 1;
            } else {
                $area = (string)$runs[$mid][2];
                // 内网/本机再确认一次，避免数据源把保留段误标
                if ($area === '内网' && !geo_is_private($ip)) {
                    break;
                }
                return $area;
            }
        }
    }
    $byTz = tz_area($tz);
    if ($byTz !== '') {
        return $byTz;
    }
    return $ip === '' ? '未知' : '其他境外';
}

/** 是否内网/保留地址 */
function geo_is_private(string $ip): bool
{
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        return true;
    }
    return false;
}
