<?php
/**
 * ============================================================
 *  统一 API 入口
 *  所有请求形如：api/index.php?action=xxx
 *  返回：{"ok":true,"data":...} 或 {"ok":false,"error":{"code","msg"}}
 * ============================================================
 */
declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/game.php';
require_once __DIR__ . '/../lib/visit.php';

boot_api();

$action = (string)p('action', '');

try {
    switch ($action) {

        // ------------------------------------------------ 健康检查
        case 'ping':
            ok(['time' => date('c'), 'version' => '1.0.0', 'php' => PHP_VERSION]);

        // ------------------------------------------------ 账号
        case 'auth.register': {
            $r = auth_register(pstr('username', '', 20), (string)p('password', ''), pstr('nickname', '', 20));
            $u = one('SELECT * FROM ' . t('users') . ' WHERE id=?', [$r['uid']]);
            ok(['token' => $r['token'], 'expires_in' => $r['expires_in'], 'user' => public_user($u)]);
        }

        case 'auth.login': {
            $r = auth_login(pstr('username', '', 20), (string)p('password', ''));
            ok(['token' => $r['token'], 'expires_in' => $r['expires_in'], 'user' => $r['user']]);
        }

        case 'auth.logout':
            auth_logout();
            ok(['bye' => true]);

        case 'auth.me': {
            $u = require_login();
            $stats = [
                'lives'      => (int)scalar('SELECT COUNT(*) FROM ' . t('lives') . ' WHERE uid=?', [(int)$u['id']]),
                'best'       => (int)scalar('SELECT COALESCE(MAX(score),0) FROM ' . t('lives') . ' WHERE uid=? AND closed=1', [(int)$u['id']]),
                'last'       => one('SELECT job_name,score,day,ending FROM ' . t('lives') . ' WHERE uid=? AND closed=1 ORDER BY id DESC LIMIT 1', [(int)$u['id']]),
                'save_day'   => (int)scalar('SELECT COALESCE(server_day,0) FROM ' . t('saves') . ' WHERE uid=?', [(int)$u['id']]),
                'has_save'   => (int)scalar('SELECT COUNT(*) FROM ' . t('saves') . ' WHERE uid=?', [(int)$u['id']]) > 0,
            ];
            ok(['user' => public_user($u), 'stats' => $stats]);
        }

        // ------------------------------------------------ 存档
        case 'save.get': {
            $u = require_login();
            $row = one('SELECT * FROM ' . t('saves') . ' WHERE uid=?', [(int)$u['id']]);
            $state = $row ? json_decode((string)$row['state'], true) : null;
            ok(['state' => $state, 'server_day' => $row ? (int)$row['server_day'] : 0]);
        }

        case 'save.put': {
            $u = require_login();
            $state = p('state');
            $raw = is_array($state) ? json_enc($state) : (string)p('state', '');
            if ($raw === '' || strlen($raw) > 65535) {
                fail('bad_state', '存档数据为空或过大');
            }
            if (json_decode($raw, true) === null) {
                fail('bad_state', '存档不是合法的 JSON');
            }
            run(
                'INSERT INTO ' . t('saves') . ' (uid,state,server_day,updated_at) VALUES (?,?,?,?)
                 ON DUPLICATE KEY UPDATE state=VALUES(state), server_day=VALUES(server_day), updated_at=VALUES(updated_at)',
                [(int)$u['id'], $raw, pint('day', 1), date('Y-m-d H:i:s')]
            );
            ok(['saved' => true, 'at' => date('c')]);
        }

        // ------------------------------------------------ 一世
        case 'life.start': {
            $u = require_login();
            $job     = pstr('job', '', 32);
            $jobName = pstr('job_name', '', 64);
            if ($job === '') {
                fail('bad_job', '缺少身份');
            }
            $seasonNo = (int)scalar('SELECT COUNT(*)+1 FROM ' . t('lives') . ' WHERE uid=?', [(int)$u['id']]);
            run('INSERT INTO ' . t('lives') . ' (uid,job,job_name,season_no,day,money,rating,score,ending,province,dignity_low,karma_cnt,closed,started_at) VALUES (?,?,?,?,0,0,0,0,"","",0,0,0,?)',
                [(int)$u['id'], $job, $jobName, $seasonNo, date('Y-m-d H:i:s')]);
            $lifeId = (int)db()->lastInsertId();

            // 三世账本：按前世最好成绩给一点因果分
            $best = (int)scalar('SELECT COALESCE(MAX(score),0) FROM ' . t('lives') . ' WHERE uid=? AND closed=1', [(int)$u['id']]);
            $inheritMoney = (int)round($best * (0.03 + min(5, $seasonNo) * 0.01));
            $inheritMoney = min(4000, $inheritMoney);

            ok([
                'life_id'       => $lifeId,
                'season_no'     => $seasonNo,
                'inherit_money' => $inheritMoney,
                'inherit_note'  => $best > 0 ? "前世的因果还在。这一世开局多 {$inheritMoney} 元。" : '',
                'is_first'      => $seasonNo === 1,
            ]);
        }

        case 'life.end': {
            $u = require_login();
            $lifeId = pint('life_id', 0);
            $life = one('SELECT * FROM ' . t('lives') . ' WHERE id=? AND uid=?', [$lifeId, (int)$u['id']]);
            if (!$life) {
                fail('no_life', '找不到这一世');
            }
            if ((int)$life['closed'] === 1) {
                fail('closed', '这一世已经结算过了');
            }
            $day   = max(0, pint('day', 0));
            $money = pint('money', 0);
            $score = max(0, min(1000, pint('score', 0)));
            $ending = pstr('ending', '', 64);
            $dignityLow = max(0, pint('dignity_low', 0));
            $karmaCnt   = max(0, pint('karma_cnt', 0));
            $province   = pstr('province', '', 32);

            run('UPDATE ' . t('lives') . ' SET day=?,money=?,rating=?,score=?,ending=?,province=?,dignity_low=?,karma_cnt=?,closed=1,ended_at=? WHERE id=?',
                [$day, $money, max(0, pint('rating', 0)), $score, $ending, $province, $dignityLow, $karmaCnt, date('Y-m-d H:i:s'), $lifeId]);

            // 每日流水
            $logs = p('logs');
            if (is_array($logs)) {
                $batch = [];
                $args  = [];
                foreach (array_slice($logs, 0, 400) as $lg) {
                    if (!is_array($lg)) {
                        continue;
                    }
                    $batch[] = '(?,?,?,?,?,?,?,?,?,?,?,?,?)';
                    array_push($args,
                        (int)$u['id'], $lifeId,
                        (int)($lg['day'] ?? 0), (int)($lg['season'] ?? 0), substr((string)($lg['weather'] ?? ''), 0, 16),
                        (int)($lg['pos'] ?? 0), (int)($lg['money'] ?? 0), (int)($lg['stamina'] ?? 0),
                        (int)($lg['spirit'] ?? 0), (int)($lg['face'] ?? 0),
                        substr((string)($lg['card_id'] ?? ''), 0, 64), (int)($lg['opt_idx'] ?? -1),
                        date('Y-m-d H:i:s')
                    );
                }
                foreach (array_chunk($batch, 60) as $i => $chunk) {
                    // 参数按块切分
                    $chunkArgs = array_slice($args, $i * 60 * 13, count($chunk) * 13);
                    run('INSERT INTO ' . t('day_log') . ' (uid,life_id,day,season,weather,pos,money,stamina,spirit,face,card_id,opt_idx,created_at) VALUES ' . implode(',', $chunk), $chunkArgs);
                }
            }

            // 业力遗产
            $karmaMade = karma_generate((int)$u['id'], $lifeId, (string)$life['job_name'], $karmaCnt);
            // 遗物
            $relicMade = relic_generate((int)$u['id'], $lifeId, pstr('relic_key', '', 48));
            // 案卷
            $frags = p('fragments');
            $caseId = 0;
            if (is_array($frags)) {
                $caseId = case_generate((int)$u['id'], $lifeId, (string)$life['job_name'], $frags, $karmaCnt, $dignityLow);
            }
            // 赛季分
            run('UPDATE ' . t('users') . ' SET season_score=season_score+? WHERE id=?', [$score, (int)$u['id']]);

            // 名次
            $rank = (int)scalar('SELECT COUNT(*)+1 FROM ' . t('lives') . ' WHERE closed=1 AND score>?', [$score]);

            ok([
                'score'      => $score,
                'rank'       => $rank,
                'karma_made' => $karmaMade,
                'relic_made' => $relicMade,
                'case_id'    => $caseId,
                'jury'       => $caseId > 0,
            ]);
        }

        case 'life.list': {
            $u = require_login();
            ok(all('SELECT id,job_name,season_no,day,money,score,ending,closed,started_at,ended_at FROM ' . t('lives') . ' WHERE uid=? ORDER BY id DESC LIMIT 30', [(int)$u['id']]));
        }

        case 'life.timeline': {
            $u = require_login();
            $lifeId = pint('life_id', 0);
            $rows = all('SELECT day,season,weather,money,stamina,spirit,face,pos FROM ' . t('day_log') . ' WHERE uid=? AND life_id=? ORDER BY day ASC LIMIT 400', [(int)$u['id'], $lifeId]);
            ok(['logs' => $rows]);
        }

        // ------------------------------------------------ 世界
        case 'world.state':
            ok(world_state(true));

        // ------------------------------------------------ 业力 / 遗物
        case 'karma.draw': {
            $u = require_login();
            $k = karma_draw((int)$u['id']);
            ok(['karma' => $k]);
        }

        case 'relic.draw': {
            $u = require_login();
            ok(['relic' => relic_draw((int)$u['id'])]);
        }

        // ------------------------------------------------ 漂流瓶 / 隔世信
        case 'bottle.draw': {
            $u = require_login();
            ok(['bottle' => bottle_draw((int)$u['id'])]);
        }

        case 'bottle.put': {
            $u = require_login();
            if (!bottle_put((int)$u['id'], pint('life_id', 0), pstr('line_key', '', 48))) {
                fail('bad_line', '没有这句话');
            }
            ok(['placed' => true]);
        }

        case 'letter.put': {
            $u = require_login();
            if (!letter_put((int)$u['id'], pint('life_id', 0), pstr('cond_type', 'any', 24), pstr('cond_value', '', 64), pstr('line_key', '', 48))) {
                fail('bad_letter', '没有这封信');
            }
            ok(['sent' => true]);
        }

        case 'letter.draw': {
            $u = require_login();
            $l = letter_draw((int)$u['id'], pstr('job', '', 32), pint('day', 1), pstr('weather', '', 16), pint('season', 0));
            ok(['letter' => $l]);
        }

        // ------------------------------------------------ 望乡台
        case 'home.put': {
            $u = require_login();
            if (!home_put((int)$u['id'], pint('life_id', 0), pstr('kind', 'person', 24), pstr('name', '', 64))) {
                fail('bad_home', '这个牵挂的名字不在名册里');
            }
            ok(['ok' => true]);
        }

        case 'home.visit': {
            $u = require_login();
            ok(['visit' => home_visit((int)$u['id'])]);
        }

        case 'home.mine': {
            $u = require_login();
            ok(['homes' => home_mine((int)$u['id'])]);
        }

        // ------------------------------------------------ 判官陪审
        case 'case.next': {
            $u = require_login();
            if (!cfg('feature.jury', true)) {
                fail('disabled', '陪审团未开启');
            }
            ok(['case' => case_next((int)$u['id']), 'speeches' => array_map(fn($s) => $s['text'], presets()['speeches'])]);
        }

        case 'case.vote': {
            $u = require_login();
            $r = case_vote((int)$u['id'], pint('case_id', 0), pint('verdict', 1), pstr('speech_key', '', 48));
            ok($r);
        }

        case 'case.mine': {
            $u = require_login();
            $rows = all('SELECT id,job_name,final,truth,votes,status,created_at FROM ' . t('cases') . ' WHERE uid=? ORDER BY id DESC LIMIT 10', [(int)$u['id']]);
            ok(['cases' => $rows]);
        }

        // ------------------------------------------------ 排行榜
        case 'rank.list': {
            $type = pstr('type', 'score', 16);
            ok(['type' => $type, 'rows' => rank_board($type, pint('limit', 30))]);
        }

        // ------------------------------------------------ 全服报告
        case 'report.summary':
            ok(report_summary());

        // ------------------------------------------------ 交易所
        case 'market.list': {
            $rows = all(
                'SELECT o.id,o.side,o.qty,o.price,o.created_at,u.nickname
                 FROM ' . t('orders') . ' o JOIN ' . t('users') . ' u ON u.id=o.uid
                 WHERE o.status=0 ORDER BY o.price ASC, o.id ASC LIMIT 40'
            );
            $me = auth_user();
            $mine = $me ? all('SELECT id,side,qty,price,status,created_at FROM ' . t('orders') . ' WHERE uid=? ORDER BY id DESC LIMIT 20', [(int)$me['id']]) : [];
            ok(['orders' => $rows, 'mine' => $mine]);
        }

        case 'market.place': {
            $u = require_login();
            $id = market_place((int)$u['id'], pstr('side', 'sell', 8), pint('qty', 1), pint('price', 10));
            ok(['order_id' => $id]);
        }

        case 'market.fill': {
            $u = require_login();
            ok(['trade' => market_fill((int)$u['id'], pint('order_id', 0))]);
        }

        case 'market.cancel': {
            $u = require_login();
            $n = run('UPDATE ' . t('orders') . ' SET status=2 WHERE id=? AND uid=? AND status=0', [pint('order_id', 0), (int)$u['id']]);
            if ($n === 0) {
                fail('no_order', '撤不掉，可能已成交');
            }
            ok(['cancelled' => true]);
        }

        // ------------------------------------------------ 典当行
        case 'pledge.create': {
            $u = require_login();
            ok(pledge_create((int)$u['id'], pint('days', 1)));
        }

        case 'pledge.repay': {
            $u = require_login();
            ok(pledge_repay((int)$u['id'], pint('pledge_id', 0)));
        }

        case 'pledge.list': {
            $u = require_login();
            ok(all('SELECT id,days,cash,due_day,status,created_at FROM ' . t('pledges') . ' WHERE uid=? ORDER BY id DESC LIMIT 20', [(int)$u['id']]));
        }

        // ------------------------------------------------ 香火
        case 'wish.send': {
            $u = require_login();
            $r = wish_send((int)$u['id']);
            if (!$r) {
                fail('nobody', '此刻没有别人在这里');
            }
            ok($r);
        }

        case 'wish.inbox': {
            $u = require_login();
            ok(['wishes' => wish_inbox((int)$u['id'], pint('last_id', 0))]);
        }

        // ------------------------------------------------ 鬼火
        case 'ghost.put': {
            $u = require_login();
            ghost_put((int)$u['id'], pstr('area', '', 32), (float)p('gx', 0), (float)p('gz', 0));
            ok(['ok' => true]);
        }

        case 'ghost.hot':
            ok(['points' => ghost_hot(pstr('area', 'gate', 32))]);

        // ------------------------------------------------ 事件卡体检
        case 'card.stat': {
            card_stat_add(pstr('card_id', '', 80), pint('opt_idx', 0), pint('season', 0));
            ok(['ok' => true]);
        }

        case 'card.top': {
            $rows = all('SELECT card_id, opt_idx, SUM(cnt) AS cnt FROM ' . t('card_stats') . ' GROUP BY card_id,opt_idx ORDER BY cnt DESC LIMIT 50');
            ok(['rows' => $rows]);
        }

        // ------------------------------------------------ 中央广场广告位
        // 公开接口：玩家进游戏前就要把广告拉下来，不能要求登录
        case 'ads.list': {
            $now  = date('Y-m-d H:i:s');
            $rows = [];
            try {
                $rows = all(
                    'SELECT id,slot,pos,brand,title,subtitle,note,bg,fg,accent,link
                       FROM ' . t('ads') . '
                      WHERE status=1
                        AND (start_at IS NULL OR start_at<=?)
                        AND (end_at   IS NULL OR end_at>=?)
                      ORDER BY slot ASC, pos ASC, weight DESC, id ASC
                      LIMIT 60',
                    [$now, $now]
                );
            } catch (Throwable $e) {
                // 老库还没升级出 ads 表时不要报 500，前端会退回内置文案
                $rows = [];
            }
            ok(['ads' => $rows, 'at' => $now]);
        }

        case 'ads.hit': {
            $ids = array_map('intval', explode(',', (string)p('ids', '')));
            $ids = array_slice(array_values(array_unique(array_filter($ids))), 0, 24);
            if ($ids) {
                try {
                    $ph = implode(',', array_fill(0, count($ids), '?'));
                    run('UPDATE ' . t('ads') . " SET impressions=impressions+1 WHERE id IN ({$ph})", $ids);
                } catch (Throwable $e) {
                }
            }
            ok(['hit' => count($ids)]);
        }

        case 'ads.click': {
            $id = pint('id');
            if ($id > 0) {
                try {
                    run('UPDATE ' . t('ads') . ' SET clicks=clicks+1 WHERE id=?', [$id]);
                } catch (Throwable $e) {
                }
            }
            ok(['clicked' => $id > 0]);
        }

        // ------------------------------------------------ 访问统计埋点
        // 公开接口：未登录访客也要计入，否则「覆盖地区」「设备排行」失真。
        // 只记页面加载，不记玩法内容；同一 IP 10 分钟最多 90 次。
        case 'visit.hit': {
            if (!cfg('feature.track', true)) {
                ok(['logged' => false, 'why' => 'disabled']);
            }
            if (!rate_allow('visit', 90, 600)) {
                ok(['logged' => false, 'why' => 'rate']);
            }
            $logged = visit_record([
                'vid'    => pstr('vid', '', 32),
                'path'   => pstr('path', 'index', 12),
                'tz'     => pstr('tz', '', 48),
                'lang'   => pstr('lang', '', 24),
                'screen' => pstr('screen', '', 12),
                'ref'    => pstr('ref', '', 191),
            ]);
            ok(['logged' => $logged, 'why' => $logged ? 'ok' : 'no_table']);
        }

        // ------------------------------------------------ 三界判定（公开，前端结局页要读）
        case 'realm.config': {
            $get = static function (string $k, string $d): string {
                try {
                    $v = scalar('SELECT v FROM ' . t('settings') . ' WHERE k=?', [$k], null);
                    return $v === null ? $d : (string)$v;
                } catch (Throwable $e) {
                    // 老库/坏库都退回默认值，不要让结局页因为读设置而白屏
                    return $d;
                }
            };
            ok([
                'enabled'   => $get('realm_enabled', '1') !== '0',
                'p_hell'    => max(0, min(100, (int)$get('realm_p_hell', '100'))),
                'p_heaven'  => max(0, min(100, (int)$get('realm_p_heaven', '100'))),
                'evil_need' => max(1, (int)$get('realm_evil_need', '1')),
                'mercy'     => max(0, (int)$get('realm_mercy', '0')),
            ]);
        }

        // ------------------------------------------------ 全服善恶天平
        // 公开接口，不需要登录：这是"世界状态"，不是"我的数据"。
        case 'world.balance': {
            $days = 7;
            $g = 0; $k = 0;
            try {
                $g = (int)scalar('SELECT COALESCE(SUM(good),0) FROM ' . t('karma_log')
                    . ' WHERE created_at > DATE_SUB(NOW(), INTERVAL ' . $days . ' DAY)');
                $k = (int)scalar('SELECT COALESCE(SUM(evil),0) FROM ' . t('karma_log')
                    . ' WHERE created_at > DATE_SUB(NOW(), INTERVAL ' . $days . ' DAY)');
            } catch (Throwable $e) {
                // 老库还没跑过修复：当作风平浪静，不要让首页挂掉
            }
            $total = $g + $k;
            $state = 'flat';
            // 样本太少的时候不下判断，否则头三个人就能把天道带偏
            if ($total >= 30) {
                if ($k > $g * 1.35) { $state = 'yin'; }
                elseif ($g > $k * 1.35) { $state = 'yang'; }
            }
            ok([
                'good'  => $g,
                'evil'  => $k,
                'total' => $total,
                'state' => $state,
                'days'  => $days,
            ]);
        }

        case 'karma.log': {
            $u = require_login();
            $g = max(0, min(9, pint('g', 0)));
            $k = max(0, min(9, pint('k', 0)));
            if (!$g && !$k) {
                ok(['kept' => 0]);
            }
            run('INSERT INTO ' . t('karma_log') . ' (uid,good,evil,title,created_at) VALUES (?,?,?,?,?)',
                [(int)$u['id'], $g, $k, pstr('t', '', 64), date('Y-m-d H:i:s')]);
            ok(['kept' => 1]);
        }

        // ------------------------------------------------ 因果债
        case 'debt.owe': {
            $u = require_login();
            $title = pstr('t', '', 64);
            // 债主从"真正玩过的人"里挑，别把账记到僵尸号头上
            $row = null;
            try {
                $row = one('SELECT uid FROM ' . t('lives') . ' WHERE uid<>? GROUP BY uid ORDER BY RAND() LIMIT 1',
                    [(int)$u['id']]);
            } catch (Throwable $e) {
                $row = null;
            }
            if (!$row) {
                ok(['to' => null]);
            }
            $toId = (int)$row['uid'];
            run('INSERT INTO ' . t('debts') . ' (from_uid,to_uid,evil_title,taken,created_at) VALUES (?,?,?,0,?)',
                [(int)$u['id'], $toId, $title, date('Y-m-d H:i:s')]);
            $nick = (string)scalar('SELECT nickname FROM ' . t('users') . ' WHERE id=?', [$toId], '');
            ok(['to' => $nick !== '' ? $nick : '有人']);
        }

        case 'debt.pull': {
            $u = require_login();
            $row = null;
            try {
                $row = one('SELECT d.id, u.nickname FROM ' . t('debts') . ' d'
                    . ' LEFT JOIN ' . t('users') . ' u ON u.id=d.from_uid'
                    . ' WHERE d.to_uid=? AND d.taken=0 ORDER BY d.id ASC LIMIT 1', [(int)$u['id']]);
            } catch (Throwable $e) {
                $row = null;
            }
            if (!$row) {
                ok(['from' => null]);
            }
            run('UPDATE ' . t('debts') . ' SET taken=1 WHERE id=?', [(int)$row['id']]);
            ok(['from' => (string)($row['nickname'] ?? '') !== '' ? (string)$row['nickname'] : '有人']);
        }

        // ------------------------------------------------ 事件图鉴
        case 'codex.put': {
            $u = require_login();
            $title = pstr('t', '', 64);
            if ($title === '') {
                ok(['count' => 0]);
            }
            run('INSERT IGNORE INTO ' . t('codex') . ' (uid,title,created_at) VALUES (?,?,?)',
                [(int)$u['id'], $title, date('Y-m-d H:i:s')]);
            $n = (int)scalar('SELECT COUNT(*) FROM ' . t('codex') . ' WHERE uid=?', [(int)$u['id']]);
            ok(['count' => $n]);
        }

        case 'codex.get': {
            $u = require_login();
            $list = [];
            try {
                $rows = all('SELECT title FROM ' . t('codex') . ' WHERE uid=? ORDER BY created_at DESC LIMIT 2000',
                    [(int)$u['id']]);
                foreach ($rows as $r) {
                    $list[] = (string)$r['title'];
                }
            } catch (Throwable $e) {
            }
            ok(['list' => $list, 'count' => count($list)]);
        }

        // ------------------------------------------------ 全站概览（首页用）
        case 'stat.overview': {
            $w = world_state(false);
            $notice   = (string)scalar('SELECT v FROM ' . t('settings') . ' WHERE k="notice"', [], '');
            $maintain = (string)scalar('SELECT v FROM ' . t('settings') . ' WHERE k="maintain"', [], '0');
            // 访问数：老库还没有 visits 表时不要让首页接口挂掉
            $pvAll = 0;
            $pvToday = 0;
            try {
                $pvAll   = (int)scalar('SELECT COUNT(*) FROM ' . t('visits'));
                $pvToday = (int)scalar('SELECT COUNT(*) FROM ' . t('visits') . ' WHERE created_at>=?', [date('Y-m-d 00:00:00')]);
            } catch (Throwable $e) {
            }
            ok([
                'users'    => (int)scalar('SELECT COUNT(*) FROM ' . t('users') . ' WHERE status=1'),
                'lives'    => (int)scalar('SELECT COUNT(*) FROM ' . t('lives') . ' WHERE closed=1'),
                'karma'    => (int)scalar('SELECT COUNT(*) FROM ' . t('karma') . ' WHERE claimed_by=0'),
                'visits'      => $pvAll,
                'visits_today' => $pvToday,
                'world'    => $w,
                'notice'   => $notice,
                'maintain' => $maintain === '1',
            ]);
        }

        // ------------------------------------------------ 未匹配
        default:
            fail('unknown_action', "未知的接口：{$action}", 404);
    }
} catch (PDOException $e) {
    error_log('[life] SQL ' . $e->getMessage());
    fail('db_error', cfg('site.debug') ? $e->getMessage() : '数据库出错了', 500);
}
