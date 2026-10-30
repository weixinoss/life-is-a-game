<?php
/**
 * 配置样例 —— 安装器会自动生成 lib/config.php，正常情况下不需要手动改这里。
 * 若需手动部署：复制本文件为 config.php 并填写真实值。
 */
return [
    // ---------- 数据库 ----------
    'db' => [
        'host'    => '127.0.0.1',
        'port'    => 3306,
        'name'    => 'life_game',
        'user'    => 'root',
        'pass'    => '',
        'charset' => 'utf8mb4',
        'prefix'  => 'life_',
    ],

    // ---------- 站点 ----------
    'site' => [
        'name'     => '人生就是一场游戏',
        'timezone' => 'Asia/Shanghai',
        'debug'    => false,
        // 允许跨域访问的来源，'*' 表示不限制（同域部署留 * 即可）
        'cors'     => '*',
        // 令牌有效期（秒）
        'token_ttl' => 2592000,
        // 每个 IP 每分钟允许的接口调用次数
        'rate_limit' => 240,
    ],

    // ---------- 玩法开关 ----------
    'feature' => [
        'karma'    => true,  // 业力遗产
        'relic'    => true,  // 遗物寄存
        'bottle'   => true,  // 孟婆汤漂流瓶
        'letter'   => true,  // 三生石隔世信
        'home'     => true,  // 望乡台牵挂
        'jury'     => true,  // 判官陪审
        'rank'     => true,  // 排行榜
        'report'   => true,  // 全服报告
        'market'   => true,  // 阴德交易所
        'pledge'   => true,  // 典当行
        'lifeloan' => false, // 借寿（平衡风险高，默认关闭）
        'wish'     => true,  // 香火祈愿
        'ghost'    => true,  // 鬼火指路
        'track'    => true,  // 访问统计（后台「数据概览」的数据来源）
    ],

    // ---------- 世界 ----------
    'world' => [
        // 全服天气每隔多少秒重抽一次
        'weather_tick' => 1800,
        // 物价指数的上下限
        'price_min' => 0.70,
        'price_max' => 1.60,
        // 每 1 万点全服总财富，物价上浮多少
        'inflation_per_10k' => 0.004,
    ],
];
