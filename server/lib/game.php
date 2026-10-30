<?php
/**
 * 玩法逻辑层：世界时钟、业力、案卷、排行、交易、报告。
 * 所有函数都不输出内容，只返回数据或抛异常。
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/** 预置文案库（惰性加载） */
function presets(): array
{
    static $p = null;
    if ($p === null) {
        $p = require __DIR__ . '/presets.php';
    }
    return $p;
}

/** 按 key 从预置库里查一条 */
function preset_find(string $group, string $key): ?array
{
    foreach (presets()[$group] ?? [] as $row) {
        if ($row['key'] === $key) {
            return $row;
        }
    }
    return null;
}

/** 随机取预置库一条 */
function preset_rand(string $group): ?array
{
    $list = presets()[$group] ?? [];
    return $list ? $list[random_int(0, count($list) - 1)] : null;
}

// ============================================================
// 世界状态
// ============================================================

/** 读取世界状态，必要时推进（天气重抽 / 时钟 / 物价 / 在线数） */
function world_state(bool $tick = true): array
{
    $w = one('SELECT * FROM ' . t('world') . ' WHERE id=1');
    if (!$w) {
        run('INSERT INTO ' . t('world') . ' (id,game_clock,weather,is_night,price_index,online_cnt,festival,tick_at,note) VALUES (1,?,?,?,?,?,?,?,?)',
            ['07:00', 'sunny', 0, 1.0, 0, '', date('Y-m-d H:i:s'), '初始化']);
        $w = one('SELECT * FROM ' . t('world') . ' WHERE id=1');
    }
    if ($tick) {
        $w = world_tick($w);
    }
    return [
        'clock'      => $w['game_clock'],
        'weather'    => $w['weather'],
        'is_night'   => (int)$w['is_night'],
        'price'      => round((float)$w['price_index'], 3),
        'online'     => (int)$w['online_cnt'],
        'festival'   => $w['festival'],
        'ts'         => strtotime($w['tick_at']),
    ];
}

/** 推进世界：按真实时间走时钟，按间隔重抽天气，按全服财富算物价 */
function world_tick(array $w): array
{
    $now   = time();
    $last  = strtotime($w['tick_at']) ?: $now;
    $gap   = max(0, $now - $last);
    if ($gap < 30) {
        return $w; // 半分钟内不重复计算，避免每次请求都写库
    }

    $tickSec = (int)cfg('world.weather_tick', 1800);

    // 1) 游戏内时钟：现实 1 分钟 = 游戏内 24 分钟（一天一轮）
    $minutes = ((int)substr($w['game_clock'], 0, 2)) * 60 + (int)substr($w['game_clock'], 3, 2);
    $minutes = ($minutes + (int)round($gap * 24 / 60)) % 1440;
    $clock   = sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    $isNight = ($minutes >= 1140 || $minutes < 360) ? 1 : 0; // 19:00-06:00 为夜

    // 2) 天气：到点重抽（偏向晴朗，雨雪是少数）
    $weather = $w['weather'];
    if ($gap >= $tickSec) {
        $pool = ['sunny', 'sunny', 'sunny', 'sunny', 'cloudy', 'cloudy', 'rain', 'storm', 'hot', 'cold', 'snow', 'fog'];
        $weather = $pool[random_int(0, count($pool) - 1)];
        // 夏季多雨，冬季多雪
        $m = (int)date('n');
        if (in_array($m, [6, 7, 8], true) && random_int(1, 100) <= 35) {
            $weather = random_int(0, 1) ? 'rain' : 'storm';
        } elseif (in_array($m, [12, 1, 2], true) && random_int(1, 100) <= 35) {
            $weather = 'snow';
        }
    }

    // 3) 物价：近 200 局的平均资产决定
    $avg = (float)scalar('SELECT AVG(money) FROM (SELECT money FROM ' . t('lives') . ' ORDER BY id DESC LIMIT 200) x', [], 30000);
    if ($avg <= 0) {
        $avg = 30000;
    }
    $price = 0.85 + $avg / 100000;
    $price = max((float)cfg('world.price_min', 0.70), min((float)cfg('world.price_max', 1.60), $price));

    // 4) 在线人数：有效会话的独立用户数
    $online = (int)scalar('SELECT COUNT(DISTINCT uid) FROM ' . t('sessions') . ' WHERE expires_at>?', [date('Y-m-d H:i:s')]);

    // 5) 节气 / 节日
    $festival = world_festival();

    run('UPDATE ' . t('world') . ' SET game_clock=?,weather=?,is_night=?,price_index=?,online_cnt=?,festival=?,tick_at=? WHERE id=1', [
        $clock, $weather, $isNight, $price, $online, $festival, date('Y-m-d H:i:s'),
    ]);

    $w['game_clock'] = $clock;
    $w['weather']    = $weather;
    $w['is_night']   = $isNight;
    $w['price_index'] = $price;
    $w['online_cnt'] = $online;
    $w['festival']   = $festival;
    $w['tick_at']    = date('Y-m-d H:i:s');
    return $w;
}

/** 按公历日期给一个节气/节日标记 */
function world_festival(): string
{
    $md = date('m-d');
    $map = [
        '01-01' => '元旦', '02-14' => '情人节', '04-04' => '清明', '04-05' => '清明',
        '05-01' => '劳动节', '06-01' => '儿童节', '08-15' => '中元', '09-10' => '教师节',
        '10-01' => '国庆', '11-11' => '双十一', '12-21' => '冬至', '12-31' => '跨年',
    ];
    if (isset($map[$md])) {
        return $map[$md];
    }
    // 春节附近（简化为 1 月底到 2 月中）
    if (date('m') === '02' && (int)date('d') <= 15) {
        return '春节';
    }
    return '';
}

// ============================================================
// 业力遗产
// ============================================================

/**
 * 从一世的表现生成业力记录。
 * 只有「非功利性选择」才会生成——由前端上报的 altruistic 计数决定。
 */
function karma_generate(int $uid, int $lifeId, string $jobName, int $altruistic): int
{
    if ($altruistic <= 0 || !cfg('feature.karma', true)) {
        return 0;
    }
    $kinds = ['aid', 'gift', 'stay', 'honest'];
    $made  = 0;
    $n     = min(3, (int)ceil($altruistic / 2));
    for ($i = 0; $i < $n; $i++) {
        $kind  = $kinds[random_int(0, 3)];
        $tpls  = presets()['karma'][$kind] ?? [];
        if (!$tpls) {
            continue;
        }
        $tpl   = $tpls[random_int(0, count($tpls) - 1)];
        $text  = str_replace('{jober}', $jobName ?: '陌生人', $tpl);
        $title = ['aid' => '你替别人挡了一下', 'gift' => '有人借过你一笔钱', 'stay' => '有人陪你坐到天亮', 'honest' => '有人还回了多找的钱'][$kind];
        run(
            'INSERT INTO ' . t('karma') . ' (from_uid,from_life,from_job,kind,title,text,opt_a,opt_b,effect_a,effect_b,claimed_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,0,?)',
            [
                $uid, $lifeId, $jobName, $kind, $title, $text,
                '还这份人情', '装作不知道',
                json_enc(['money' => -120, 'spirit' => 14, 'face' => 4, 'rating' => 2]),
                json_enc(['money' => 0, 'spirit' => -10, 'face' => -2, 'rating' => -1]),
                date('Y-m-d H:i:s'),
            ]
        );
        $made++;
    }
    return $made;
}

/** 抽一条别人留下的业力（不重复给自己） */
function karma_draw(int $uid): ?array
{
    $row = pick_random(t('karma'), 'claimed_by=0 AND from_uid<>?', [$uid]);
    if (!$row) {
        return null;
    }
    run('UPDATE ' . t('karma') . ' SET claimed_by=?, claimed_at=? WHERE id=? AND claimed_by=0', [$uid, date('Y-m-d H:i:s'), (int)$row['id']]);
    return [
        'id'     => (int)$row['id'],
        'title'  => $row['title'],
        'text'   => $row['text'],
        'from'   => $row['from_job'],
        'optA'   => $row['opt_a'],
        'optB'   => $row['opt_b'],
        'effA'   => json_decode($row['effect_a'], true) ?: [],
        'effB'   => json_decode($row['effect_b'], true) ?: [],
    ];
}

// ============================================================
// 遗物 / 漂流瓶 / 隔世信 / 牵挂
// ============================================================

function relic_generate(int $uid, int $lifeId, string $relicKey): int
{
    $r = preset_find('relics', $relicKey);
    if (!$r || !cfg('feature.relic', true)) {
        return 0;
    }
    run('INSERT INTO ' . t('relics') . ' (from_uid,from_life,relic_key,name,text,effect,claimed_by) VALUES (?,?,?,?,?,?,0)',
        [$uid, $lifeId, $r['key'], $r['name'], $r['text'], $r['effect']]);
    return 1;
}

function relic_draw(int $uid): ?array
{
    $row = pick_random(t('relics'), 'claimed_by=0 AND from_uid<>?', [$uid]);
    if (!$row) {
        return null;
    }
    run('UPDATE ' . t('relics') . ' SET claimed_by=? WHERE id=? AND claimed_by=0', [$uid, (int)$row['id']]);
    return [
        'name'   => $row['name'],
        'text'   => $row['text'],
        'effect' => json_decode($row['effect'], true) ?: [],
    ];
}

function bottle_put(int $uid, int $lifeId, string $key): bool
{
    $r = preset_find('bottles', $key);
    if (!$r || !cfg('feature.bottle', true)) {
        return false;
    }
    run('INSERT INTO ' . t('bottles') . ' (from_uid,from_life,line_key,text,claimed_by,created_at) VALUES (?,?,?,?,0,?)',
        [$uid, $lifeId, $r['key'], $r['text'], date('Y-m-d H:i:s')]);
    return true;
}

function bottle_draw(int $uid): ?array
{
    $row = pick_random(t('bottles'), 'claimed_by=0 AND from_uid<>?', [$uid]);
    if (!$row) {
        // 池子空了就回一条公共的
        $r = preset_rand('bottles');
        return $r ? ['text' => $r['text'], 'fresh' => false] : null;
    }
    run('UPDATE ' . t('bottles') . ' SET claimed_by=? WHERE id=? AND claimed_by=0', [$uid, (int)$row['id']]);
    return ['text' => $row['text'], 'fresh' => true];
}

function letter_put(int $uid, int $lifeId, string $condType, string $condValue, string $key): bool
{
    $r = preset_find('letters', $key);
    if (!$r || !cfg('feature.letter', true)) {
        return false;
    }
    $allow = ['any', 'job', 'day', 'weather', 'season'];
    if (!in_array($condType, $allow, true)) {
        $condType = 'any';
    }
    run('INSERT INTO ' . t('letters') . ' (from_uid,from_life,cond_type,cond_value,line_key,text,to_uid,created_at) VALUES (?,?,?,?,?,?,0,?)',
        [$uid, $lifeId, $condType, $condValue, $r['key'], $r['text'], date('Y-m-d H:i:s')]);
    return true;
}

/** 按当前处境领一封隔世信 */
function letter_draw(int $uid, string $job, int $day, string $weather, int $season): ?array
{
    $row = one(
        'SELECT * FROM ' . t('letters') . ' WHERE to_uid=0 AND from_uid<>? AND delivered_at IS NULL AND (
            cond_type="any"
            OR (cond_type="job" AND cond_value=?)
            OR (cond_type="day" AND cond_value=?)
            OR (cond_type="weather" AND cond_value=?)
            OR (cond_type="season" AND cond_value=?)
         ) ORDER BY RAND() LIMIT 1',
        [$uid, $job, (string)$day, $weather, (string)$season]
    );
    if (!$row) {
        $r = preset_rand('letters');
        return $r ? ['text' => $r['text'], 'fresh' => false] : null;
    }
    run('UPDATE ' . t('letters') . ' SET to_uid=?, delivered_at=? WHERE id=?', [$uid, date('Y-m-d H:i:s'), (int)$row['id']]);
    return ['text' => $row['text'], 'fresh' => true, 'cond' => $row['cond_type']];
}

/** 望乡台：登记牵挂（对象从预置列表选） */
function home_put(int $uid, int $lifeId, string $kind, string $name): bool
{
    if (!cfg('feature.home', true)) {
        return false;
    }
    $allowKind = ['person', 'thing', 'place'];
    $allowName = ['妈妈', '父亲', '女儿', '儿子', '妻子', '丈夫', '弟弟', '妹妹',
        '那条街', '那家店', '老房子', '我的猫', '那棵树', '那辆旧车', '工位', '楼下的路灯'];
    if (!in_array($kind, $allowKind, true) || !in_array($name, $allowName, true)) {
        return false;
    }
    run('INSERT INTO ' . t('homes') . ' (uid,life_id,kind,name,visit_cnt,created_at) VALUES (?,?,?,?,0,?)',
        [$uid, $lifeId, $kind, $name, date('Y-m-d H:i:s')]);
    return true;
}

/** 探望一个陌生的牵挂 */
function home_visit(int $uid): ?array
{
    $row = pick_random(t('homes'), 'uid<>?', [$uid]);
    if (!$row) {
        return null;
    }
    $note = preset_rand('notes');
    run('UPDATE ' . t('homes') . ' SET visit_cnt=visit_cnt+1 WHERE id=?', [(int)$row['id']]);
    if ($note) {
        run('INSERT INTO ' . t('home_notes') . ' (home_id,uid,preset_id,created_at) VALUES (?,?,?,?)',
            [(int)$row['id'], $uid, $note['key'], date('Y-m-d H:i:s')]);
    }
    return [
        'name'  => $row['name'],
        'kind'  => $row['kind'],
        'visits'=> (int)$row['visit_cnt'] + 1,
        'note'  => $note['text'] ?? '',
    ];
}

/** 自己的牵挂与被探望记录 */
function home_mine(int $uid): array
{
    $homes = all('SELECT id,name,kind,visit_cnt FROM ' . t('homes') . ' WHERE uid=? ORDER BY id DESC LIMIT 5', [$uid]);
    $out = [];
    foreach ($homes as $h) {
        $notes = all('SELECT preset_id FROM ' . t('home_notes') . ' WHERE home_id=? ORDER BY id DESC LIMIT 5', [(int)$h['id']]);
        $texts = [];
        foreach ($notes as $n) {
            $p = preset_find('notes', $n['preset_id']);
            if ($p) {
                $texts[] = $p['text'];
            }
        }
        $out[] = ['name' => $h['name'], 'kind' => $h['kind'], 'visits' => (int)$h['visit_cnt'], 'notes' => $texts];
    }
    return $out;
}

// ============================================================
// 判官陪审
// ============================================================

/** 一世结束后生成案卷 */
function case_generate(int $uid, int $lifeId, string $jobName, array $fragments, int $karmaCnt, int $dignityLow): int
{
    if (!cfg('feature.jury', true) || !$fragments) {
        return 0;
    }
    // 机器初判：善举多且没怎么低头 → 善；低头多或毫无善举 → 恶；否则平
    if ($karmaCnt >= 3 && $dignityLow <= 1) {
        $truth = 2;
    } elseif ($dignityLow >= 5 || ($karmaCnt === 0 && $dignityLow >= 2)) {
        $truth = 0;
    } else {
        $truth = 1;
    }
    $frag = array_slice(array_values(array_filter($fragments, fn($s) => is_string($s) && $s !== '')), 0, 6);
    run('INSERT INTO ' . t('cases') . ' (uid,life_id,job_name,fragments,truth,final,votes,sum_score,status,created_at) VALUES (?,?,?,?,?,-1,0,0,0,?)',
        [$uid, $lifeId, $jobName, json_enc($frag), $truth, date('Y-m-d H:i:s')]);
    return (int)db()->lastInsertId();
}

/** 取一份待审案卷（排除自己投过的） */
function case_next(int $uid): ?array
{
    $row = one(
        'SELECT c.* FROM ' . t('cases') . ' c
         WHERE c.status=0 AND c.uid<>?
           AND NOT EXISTS (SELECT 1 FROM ' . t('case_votes') . ' v WHERE v.case_id=c.id AND v.uid=?)
         ORDER BY RAND() LIMIT 1',
        [$uid, $uid]
    );
    if (!$row) {
        return null;
    }
    return [
        'id'        => (int)$row['id'],
        'job'       => $row['job_name'],
        'fragments' => json_decode($row['fragments'], true) ?: [],
        'votes'     => (int)$row['votes'],
    ];
}

/** 投票并结算（满 3 票出结果） */
function case_vote(int $uid, int $caseId, int $verdict, string $speechKey): array
{
    if (!in_array($verdict, [0, 1, 2], true)) {
        fail('bad_verdict', '判定只能是善 / 平 / 恶');
    }
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $c = one('SELECT * FROM ' . t('cases') . ' WHERE id=? FOR UPDATE', [$caseId]);
        if (!$c) {
            $pdo->rollBack();
            fail('no_case', '这份案卷不存在');
        }
        if ((int)$c['status'] === 1) {
            $pdo->rollBack();
            return ['closed' => true, 'final' => (int)$c['final'], 'truth' => (int)$c['truth']];
        }
        if ((int)$c['uid'] === $uid) {
            $pdo->rollBack();
            fail('self_case', '不能审自己的案卷');
        }
        $dup = scalar('SELECT COUNT(*) FROM ' . t('case_votes') . ' WHERE case_id=? AND uid=?', [$caseId, $uid]);
        if ((int)$dup > 0) {
            $pdo->rollBack();
            fail('voted', '你已经审过这一份了');
        }
        $speech = preset_find('speeches', $speechKey);
        run('INSERT INTO ' . t('case_votes') . ' (case_id,uid,verdict,speech_key,created_at) VALUES (?,?,?,?,?)',
            [$caseId, $uid, $verdict, $speech ? $speech['key'] : '', date('Y-m-d H:i:s')]);
        $votes = (int)$c['votes'] + 1;
        $sum   = (int)$c['sum_score'] + $verdict;

        if ($votes >= 3) {
            // 三票多数决
            $final = (int)round($sum / $votes);
            if ($final > 2) {
                $final = 2;
            }
            if ($final < 0) {
                $final = 0;
            }
            run('UPDATE ' . t('cases') . ' SET votes=?,sum_score=?,final=?,status=1,closed_at=? WHERE id=?',
                [$votes, $sum, $final, date('Y-m-d H:i:s'), $caseId]);

            // 判对的玩家加明察声望
            $right = all('SELECT uid FROM ' . t('case_votes') . ' WHERE case_id=? AND verdict=?', [$caseId, $final]);
            foreach ($right as $r) {
                run('UPDATE ' . t('users') . ' SET judge_score=judge_score+2, judge_right=judge_right+1, judge_total=judge_total+1 WHERE id=?', [(int)$r['uid']]);
            }
            $wrong = all('SELECT uid FROM ' . t('case_votes') . ' WHERE case_id=? AND verdict<>?', [$caseId, $final]);
            foreach ($wrong as $r) {
                run('UPDATE ' . t('users') . ' SET judge_total=judge_total+1 WHERE id=?', [(int)$r['uid']]);
            }
            $pdo->commit();
            return ['closed' => true, 'final' => $final, 'truth' => (int)$c['truth'], 'correct' => $verdict === $final];
        }

        run('UPDATE ' . t('cases') . ' SET votes=?,sum_score=? WHERE id=?', [$votes, $sum, $caseId]);
        run('UPDATE ' . t('users') . ' SET judge_total=judge_total+1 WHERE id=?', [$uid]);
        $pdo->commit();
        return ['closed' => false, 'votes' => $votes, 'need' => 3 - $votes];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

// ============================================================
// 排行榜
// ============================================================

function rank_board(string $type, int $limit = 30): array
{
    $limit = max(1, min(100, $limit));
    switch ($type) {
        case 'low': // 最低分殿堂
            return all(
                'SELECT l.score,l.job_name,u.nickname,u.username,l.ending,l.dignity_low
                 FROM ' . t('lives') . ' l JOIN ' . t('users') . ' u ON u.id=l.uid
                 WHERE l.closed=1 ORDER BY l.score ASC, l.dignity_low DESC LIMIT ' . $limit
            );
        case 'merit':
            return all('SELECT nickname,username,merit,judge_score,badge FROM ' . t('users') . ' WHERE status=1 ORDER BY merit DESC LIMIT ' . $limit);
        case 'judge':
            return all('SELECT nickname,username,judge_score,judge_right,judge_total FROM ' . t('users') . ' WHERE status=1 AND judge_total>0 ORDER BY judge_score DESC LIMIT ' . $limit);
        case 'job': // 各身份通关率
            return all(
                'SELECT job_name,
                        COUNT(*) AS plays,
                        ROUND(AVG(score),1) AS avg_score,
                        ROUND(AVG(day),1) AS avg_day,
                        SUM(CASE WHEN score>=60 THEN 1 ELSE 0 END) AS pass_cnt
                 FROM ' . t('lives') . ' WHERE closed=1 AND job_name<>""
                 GROUP BY job_name ORDER BY plays DESC LIMIT ' . $limit
            );
        case 'pos': // 地标/格子热点
            return all(
                'SELECT pos, COUNT(*) AS cnt FROM ' . t('day_log') . '
                 GROUP BY pos ORDER BY cnt DESC LIMIT ' . $limit
            );
        case 'province':
            return all(
                'SELECT province, COUNT(*) AS plays, ROUND(AVG(money)) AS avg_money, ROUND(AVG(day),1) AS avg_day
                 FROM ' . t('lives') . ' WHERE closed=1 AND province<>""
                 GROUP BY province ORDER BY avg_money DESC LIMIT ' . $limit
            );
        case 'score':
        default:
            return all(
                'SELECT l.score,l.job_name,u.nickname,u.username,l.day,l.ending
                 FROM ' . t('lives') . ' l JOIN ' . t('users') . ' u ON u.id=l.uid
                 WHERE l.closed=1 ORDER BY l.score DESC, l.day DESC LIMIT ' . $limit
            );
    }
}

// ============================================================
// 全服报告
// ============================================================

function report_summary(): array
{
    $totalLives = (int)scalar('SELECT COUNT(*) FROM ' . t('lives') . ' WHERE closed=1');
    $totalUsers = (int)scalar('SELECT COUNT(*) FROM ' . t('users') . ' WHERE status=1');
    if ($totalLives === 0) {
        return [
            'users' => $totalUsers, 'lives' => 0, 'note' => '还没有人走完一辈子，你可以是第一个。',
            'broke' => 0, 'exhausted' => 0, 'avg_money' => 0, 'avg_day' => 0, 'top_ending' => '-', 'avg_score' => 0,
        ];
    }
    $broke = (int)scalar('SELECT COUNT(*) FROM ' . t('lives') . ' WHERE closed=1 AND money<=0');
    $low   = (int)scalar('SELECT COUNT(*) FROM ' . t('lives') . ' WHERE closed=1 AND dignity_low>=5');
    $avgM  = (int)round((float)scalar('SELECT AVG(money) FROM ' . t('lives') . ' WHERE closed=1'));
    $avgD  = (float)scalar('SELECT AVG(day) FROM ' . t('lives') . ' WHERE closed=1');
    $avgS  = (int)round((float)scalar('SELECT AVG(score) FROM ' . t('lives') . ' WHERE closed=1'));
    $end   = one('SELECT ending, COUNT(*) c FROM ' . t('lives') . ' WHERE closed=1 AND ending<>"" GROUP BY ending ORDER BY c DESC LIMIT 1');
    return [
        'users'      => $totalUsers,
        'lives'      => $totalLives,
        'broke'      => $broke,
        'broke_rate' => round($broke / max(1, $totalLives) * 100, 1),
        'low'        => $low,
        'avg_money'  => $avgM,
        'avg_day'    => round($avgD, 1),
        'avg_score'  => $avgS,
        'top_ending' => $end['ending'] ?? '-',
        'note'       => '',
    ];
}

// ============================================================
// 阴德 · 阳寿交易所（事务保证不超发）
// ============================================================

function market_place(int $uid, string $side, int $qty, int $price): int
{
    if (!cfg('feature.market', true)) {
        fail('disabled', '交易所未开启');
    }
    if ($qty < 1 || $qty > 30) {
        fail('bad_qty', '一次挂 1-30 天');
    }
    if ($price < 1 || $price > 500) {
        fail('bad_price', '单价 1-500 阴德');
    }
    $u = one('SELECT * FROM ' . t('users') . ' WHERE id=?', [$uid]);
    // 卖阳寿要真的有阳寿
    if ($side === 'sell' && (int)$u['lifespan'] < $qty) {
        fail('no_lifespan', '你没有这么多阳寿可以出让');
    }
    if ($side === 'buy' && (int)$u['merit'] < $qty * $price) {
        fail('no_merit', '阴德不够');
    }
    run('INSERT INTO ' . t('orders') . ' (uid,side,item,qty,price,status,created_at) VALUES (?,?,?,?,?,0,?)',
        [$uid, $side === 'buy' ? 'buy' : 'sell', 'lifespan', $qty, $price, date('Y-m-d H:i:s')]);
    return (int)db()->lastInsertId();
}

/** 撮合：买入单吃掉最便宜的卖出单 */
function market_fill(int $uid, int $orderId): array
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $me = one('SELECT * FROM ' . t('orders') . ' WHERE id=? FOR UPDATE', [$orderId]);
        if (!$me || (int)$me['status'] !== 0) {
            $pdo->rollBack();
            fail('no_order', '这单已经不能成交了');
        }
        if ((int)$me['uid'] === $uid) {
            $pdo->rollBack();
            fail('self_trade', '不能跟自己成交');
        }
        // 只允许「买别人的卖单」或「卖给别人挂的买单」
        $wantSide = $me['side'] === 'sell' ? 'buy' : 'sell';
        $counter  = one(
            'SELECT * FROM ' . t('orders') . ' WHERE status=0 AND side=? AND uid<>? AND item=? AND price' . ($wantSide === 'buy' ? '>=' : '<=') . '? ORDER BY price ' . ($wantSide === 'buy' ? 'DESC' : 'ASC') . ', id ASC LIMIT 1 FOR UPDATE',
            [$wantSide, $uid, $me['item'], (int)$me['price']]
        );
        if (!$counter) {
            // 没有对手盘：自己下的单直接转成挂单
            if ((int)$me['uid'] !== $uid) {
                $pdo->rollBack();
                fail('no_counter', '暂时没有对手盘');
            }
        }
        $seller = $me['side'] === 'sell' ? $me : $counter;
        $buyer  = $me['side'] === 'buy' ? $me : $counter;
        if (!$seller || !$buyer) {
            $pdo->rollBack();
            fail('no_counter', '暂时没有对手盘');
        }
        $qty   = min((int)$seller['qty'], (int)$buyer['qty']);
        $price = (int)$seller['price'];
        $cost  = $qty * $price;

        $su = one('SELECT * FROM ' . t('users') . ' WHERE id=? FOR UPDATE', [(int)$seller['uid']]);
        $bu = one('SELECT * FROM ' . t('users') . ' WHERE id=? FOR UPDATE', [(int)$buyer['uid']]);
        if ((int)$su['lifespan'] < $qty) {
            $pdo->rollBack();
            fail('seller_short', '卖方阳寿不足，成交取消');
        }
        if ((int)$bu['merit'] < $cost) {
            $pdo->rollBack();
            fail('buyer_short', '阴德不足，成交取消');
        }

        run('UPDATE ' . t('users') . ' SET lifespan=lifespan-?, merit=merit+? WHERE id=?', [$qty, $cost, (int)$seller['uid']]);
        run('UPDATE ' . t('users') . ' SET lifespan=lifespan+?, merit=merit-? WHERE id=?', [$qty, $cost, (int)$buyer['uid']]);

        run('UPDATE ' . t('orders') . ' SET status=1, filled_by=?, filled_at=? WHERE id IN (?,?)',
            [(int)$buyer['uid'], date('Y-m-d H:i:s'), (int)$seller['id'], (int)$buyer['id']]);

        $pdo->commit();
        return ['qty' => $qty, 'cost' => $cost, 'price' => $price];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

// ============================================================
// 典当行：抵押阳寿换阴德
// ============================================================

function pledge_create(int $uid, int $days): array
{
    if (!cfg('feature.pledge', true)) {
        fail('disabled', '典当行未开启');
    }
    if ($days < 1 || $days > 20) {
        fail('bad_days', '一次抵押 1-20 天');
    }
    $u = one('SELECT * FROM ' . t('users') . ' WHERE id=?', [$uid]);
    $cash = $days * 8;
    run('UPDATE ' . t('users') . ' SET lifespan=lifespan-?, merit=merit+? WHERE id=?', [$days, $cash, $uid]);
    $due = (int)scalar('SELECT COALESCE(MAX(day),0) FROM ' . t('lives') . ' WHERE uid=?', [$uid]) + $days;
    run('INSERT INTO ' . t('pledges') . ' (uid,days,cash,due_day,status,created_at) VALUES (?,?,?,?,0,?)',
        [$uid, $days, $cash, $due, date('Y-m-d H:i:s')]);
    return ['cash' => $cash, 'due_day' => $due, 'days' => $days];
}

function pledge_repay(int $uid, int $pledgeId): array
{
    $p = one('SELECT * FROM ' . t('pledges') . ' WHERE id=? AND uid=? FOR UPDATE', [$pledgeId, $uid]);
    if (!$p) {
        fail('no_pledge', '找不到这张当票');
    }
    if ((int)$p['status'] !== 0) {
        fail('closed', '这张当票已经结清了');
    }
    $cost = (int)ceil((int)$p['cash'] * 1.2);
    $merit = (int)scalar('SELECT merit FROM ' . t('users') . ' WHERE id=?', [$uid]);
    if ($merit < $cost) {
        fail('no_merit', "赎回需要 {$cost} 阴德，你还差 " . ($cost - $merit));
    }
    db()->beginTransaction();
    try {
        run('UPDATE ' . t('users') . ' SET merit=merit-?, lifespan=lifespan+? WHERE id=?', [$cost, (int)$p['days'], $uid]);
        run('UPDATE ' . t('pledges') . ' SET status=1 WHERE id=?', [$pledgeId]);
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }
    return ['paid' => $cost, 'days' => (int)$p['days']];
}

// ============================================================
// 香火 / 鬼火 / 事件卡统计
// ============================================================

function wish_send(int $uid): ?array
{
    if (!cfg('feature.wish', true)) {
        return null;
    }
    // 随机找一个 10 分钟内活跃的别人
    $to = one(
        'SELECT u.id,u.nickname FROM ' . t('sessions') . ' s JOIN ' . t('users') . ' u ON u.id=s.uid
         WHERE s.uid<>? AND s.expires_at>? ORDER BY RAND() LIMIT 1',
        [$uid, date('Y-m-d H:i:s')]
    );
    if (!$to) {
        return null;
    }
    $bless = ['spirit', 'stamina', 'face'][random_int(0, 2)];
    run('INSERT INTO ' . t('wishes') . ' (from_uid,to_uid,incense,bless,created_at) VALUES (?,?,?,?,?)',
        [$uid, (int)$to['id'], 1, $bless, date('Y-m-d H:i:s')]);
    return ['to' => $to['nickname'], 'bless' => $bless];
}

function wish_inbox(int $uid, int $lastId = 0): array
{
    return all('SELECT id,from_uid,incense,bless,created_at FROM ' . t('wishes') . ' WHERE to_uid=? AND id>? ORDER BY id DESC LIMIT 10', [$uid, $lastId]);
}

function ghost_put(int $uid, string $area, float $gx, float $gz): void
{
    if (!cfg('feature.ghost', true)) {
        return;
    }
    // 每个用户每个区域只保留最近一条
    run('DELETE FROM ' . t('ghosts') . ' WHERE uid=? AND area=?', [$uid, $area]);
    run('INSERT INTO ' . t('ghosts') . ' (uid,area,gx,gz,created_at) VALUES (?,?,?,?,?)',
        [$uid, $area, $gx, $gz, date('Y-m-d H:i:s')]);
}

function ghost_hot(string $area, int $limit = 60): array
{
    return all(
        'SELECT ROUND(gx,1) AS x, ROUND(gz,1) AS z, COUNT(*) AS cnt
         FROM ' . t('ghosts') . ' WHERE area=? AND created_at>?
         GROUP BY ROUND(gx,1), ROUND(gz,1) ORDER BY cnt DESC LIMIT ' . $limit,
        [$area, date('Y-m-d H:i:s', time() - 604800)]
    );
}

function card_stat_add(string $cardId, int $optIdx, int $season): void
{
    if ($cardId === '') {
        return;
    }
    run(
        'INSERT INTO ' . t('card_stats') . ' (card_id,opt_idx,season,cnt) VALUES (?,?,?,1)
         ON DUPLICATE KEY UPDATE cnt=cnt+1',
        [$cardId, $optIdx, $season]
    );
}
