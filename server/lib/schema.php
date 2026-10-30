<?php
/**
 * ============================================================
 *  表结构工具：SQL 分句、表清单、默认广告灌入
 *  ------------------------------------------------------------
 *  被 install.php（安装）与 后台 settings.php（修复）共用。
 *  纯函数，不连数据库、不读配置，可以放心 require。
 * ============================================================
 */
declare(strict_types=1);

/**
 * 把整份 schema.sql 切成单条语句。
 * 不能简单地按「分号+换行」切，也不能按行首是否为 -- 判断整块，
 * 否则「注释横幅 + CREATE TABLE」会被整段误当成注释丢掉。
 * 这里按字符扫描，识别引号、反引号、行注释与块注释，只在引号外的分号处断开。
 *
 * @return string[]
 */
function sql_split(string $sql): array
{
    $sql = str_replace(["\r\n", "\r"], "\n", $sql);
    $n = strlen($sql);
    $i = 0;
    $buf = '';
    $out = [];

    while ($i < $n) {
        $c = $sql[$i];
        $next = $i + 1 < $n ? $sql[$i + 1] : '';

        // 行注释：-- 或 #
        if (($c === '-' && $next === '-') || $c === '#') {
            while ($i < $n && $sql[$i] !== "\n") {
                $i++;
            }
            $buf .= "\n";
            continue;
        }

        // 块注释：/* ... */
        if ($c === '/' && $next === '*') {
            $end = strpos($sql, '*/', $i + 2);
            $i = $end === false ? $n : $end + 2;
            $buf .= ' ';
            continue;
        }

        // 字符串与标识符
        if ($c === "'" || $c === '"' || $c === '`') {
            $quote = $c;
            $buf .= $c;
            $i++;
            while ($i < $n) {
                $ch = $sql[$i];
                $buf .= $ch;
                if ($ch === '\\' && $quote !== '`' && $i + 1 < $n) {
                    $buf .= $sql[$i + 1];
                    $i += 2;
                    continue;
                }
                if ($ch === $quote) {
                    if ($quote !== '`' && $i + 1 < $n && $sql[$i + 1] === $quote) {
                        $buf .= $sql[$i + 1];
                        $i += 2;
                        continue;
                    }
                    $i++;
                    break;
                }
                $i++;
            }
            continue;
        }

        if ($c === ';') {
            $t = trim($buf);
            if ($t !== '') {
                $out[] = $t;
            }
            $buf = '';
            $i++;
            continue;
        }

        $buf .= $c;
        $i++;
    }

    $t = trim($buf);
    if ($t !== '') {
        $out[] = $t;
    }
    return $out;
}

/** 安装/修复时必须全部存在的表（不含前缀） */
function schema_tables(): array
{
    return [
        'users', 'sessions', 'saves', 'lives', 'day_log', 'karma', 'relics', 'bottles',
        'letters', 'homes', 'home_notes', 'cases', 'case_votes', 'world', 'orders',
        'pledges', 'lifeloans', 'wishes', 'ghosts', 'card_stats', 'reports', 'settings',
        'audit', 'ads', 'visits', 'karma_log', 'debts', 'codex',
    ];
}

/**
 * 中央广场的默认广告。
 * 全是「人生剧本」式的反讽文案，不接真实品牌 —— 装完就有内容看，
 * 服主想删想改都在后台操作，不用改代码。
 */
function ad_defaults(): array
{
    return [
        ['tower', 0, '人生剧本', '30 岁还没买房？', '同龄人已经年薪百万了', '#c9433c'],
        ['tower', 1, '人生剧本', '再不考公，就晚了', '35 岁前最后一次机会', '#2f6f8f'],
        ['tower', 2, '人生剧本', '贷款 3 分钟到账', '先上车，再想怎么还', '#d99b28'],
        ['tower', 3, '人生剧本', '你已被同龄人超越', '成功学大师 · 限时 9.9', '#7a5cc4'],
        ['pillar', 0, '相亲角', '有房有车优先', '父母替你排队的第三年', '#c2607e'],
        ['pillar', 1, '狼性文化', '今天不拼命', '明天拼命找工作', '#c9433c'],
        ['pillar', 2, '分期商城', '先享受，后付款', '12 期免息 · 年化 23.9%', '#d99b28'],
        ['pillar', 3, '学区房', '别输在起跑线', '起跑线在哪，我们说了算', '#2f6f8f'],
        ['ground', 0, '一年四季', '春 夏 秋 冬', '各 90 天，各一条命', '#6fbf5a'],
        ['ground', 1, '没有回头路', '每一步都算数', '走错的那一步，也会被记住', '#d9743f'],
        ['ground', 2, '低头也行', '体面不是唯一答案', '活下去，才是', '#2f6f8f'],
        ['ground', 3, '广场公告', '这里可以停下', '看看钟，再决定往哪走', '#f97316'],
    ];
}

/**
 * 广告表为空时灌入默认内容；已有数据一律不动。
 * @return int 实际写入条数
 */
function ad_seed(PDO $pdo, string $prefix): int
{
    try {
        $has = (int)$pdo->query("SELECT COUNT(*) FROM `{$prefix}ads`")->fetchColumn();
    } catch (Throwable $e) {
        return 0;
    }
    if ($has > 0) {
        return 0;
    }
    $now = date('Y-m-d H:i:s');
    $st = $pdo->prepare(
        "INSERT INTO `{$prefix}ads`
            (slot,pos,brand,title,subtitle,note,bg,fg,accent,link,weight,status,created_at,updated_at)
         VALUES (?,?,?,?,?,'','#fdf8ee','#241f1a',?,'',10,1,?,?)"
    );
    $n = 0;
    foreach (ad_defaults() as $a) {
        $st->execute([$a[0], $a[1], $a[2], $a[3], $a[4], $a[5], $now, $now]);
        $n++;
    }
    return $n;
}
