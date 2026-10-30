-- ============================================================
--  人生就是一场游戏 · 三界联网 数据库结构
--  目标：MySQL 5.7 / InnoDB / utf8mb4
--  说明：表名前缀由安装器把 {{P}} 替换成实际前缀（默认 life_）
--  MySQL 5.7 注意：utf8mb4 下索引最长 767 字节，唯一键一律 varchar(191)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 账号
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(191) NOT NULL COMMENT '登录名，唯一',
  `password`      VARCHAR(255) NOT NULL COMMENT 'password_hash 结果',
  `nickname`      VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '显示名',
  `role`          VARCHAR(16)  NOT NULL DEFAULT 'player' COMMENT 'player|admin',
  `status`        TINYINT      NOT NULL DEFAULT 1 COMMENT '1 正常 0 封禁',
  `merit`         INT          NOT NULL DEFAULT 0  COMMENT '阴德',
  `lifespan`      INT          NOT NULL DEFAULT 0  COMMENT '可借出的阳寿天数',
  `judge_score`   INT          NOT NULL DEFAULT 0  COMMENT '明察声望',
  `judge_right`   INT          NOT NULL DEFAULT 0  COMMENT '判对次数',
  `judge_total`   INT          NOT NULL DEFAULT 0  COMMENT '参与判定次数',
  `season_score`  INT          NOT NULL DEFAULT 0  COMMENT '本赛季累计分',
  `badge`         VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '轮回印记',
  `created_at`    DATETIME     NOT NULL,
  `last_login_at` DATETIME     NULL DEFAULT NULL,
  `last_ip`       VARCHAR(45)  NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_season` (`season_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='玩家与管理员';

-- ------------------------------------------------------------
-- 会话令牌
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}sessions` (
  `token`      CHAR(64)     NOT NULL,
  `uid`        INT UNSIGNED NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  `created_at` DATETIME     NOT NULL,
  `ip`         VARCHAR(45)  NOT NULL DEFAULT '',
  PRIMARY KEY (`token`),
  KEY `idx_uid` (`uid`),
  KEY `idx_exp` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录令牌';

-- ------------------------------------------------------------
-- 存档（断点续命 / 服务端权威）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}saves` (
  `uid`         INT UNSIGNED NOT NULL,
  `state`       LONGTEXT     NOT NULL COMMENT '状态对象 C 的 JSON 序列化',
  `server_day`  INT          NOT NULL DEFAULT 0,
  `updated_at`  DATETIME     NOT NULL,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='云存档';

-- ------------------------------------------------------------
-- 一世（每一局）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}lives` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid`         INT UNSIGNED NOT NULL,
  `job`         VARCHAR(32)  NOT NULL DEFAULT '',
  `job_name`    VARCHAR(64)  NOT NULL DEFAULT '',
  `season_no`   TINYINT      NOT NULL DEFAULT 1 COMMENT '第几世',
  `day`         INT          NOT NULL DEFAULT 0 COMMENT '活到第几天',
  `money`       INT          NOT NULL DEFAULT 0,
  `rating`      INT          NOT NULL DEFAULT 0,
  `score`       INT          NOT NULL DEFAULT 0,
  `ending`      VARCHAR(64)  NOT NULL DEFAULT '',
  `province`    VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '最终停留地标所在省份',
  `dignity_low` INT          NOT NULL DEFAULT 0 COMMENT '体面低过头次数',
  `karma_cnt`   INT          NOT NULL DEFAULT 0 COMMENT '本世善举数',
  `closed`      TINYINT      NOT NULL DEFAULT 0,
  `started_at`  DATETIME     NOT NULL,
  `ended_at`    DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_uid` (`uid`),
  KEY `idx_job` (`job`),
  KEY `idx_score` (`score`),
  KEY `idx_closed` (`closed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每一世的战绩';

-- ------------------------------------------------------------
-- 每日流水（人生年表 / 事件卡体检 / 平行人生）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}day_log` (
  `id`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid`       INT UNSIGNED NOT NULL,
  `life_id`   INT UNSIGNED NOT NULL DEFAULT 0,
  `day`       INT          NOT NULL DEFAULT 0,
  `season`    TINYINT      NOT NULL DEFAULT 0,
  `weather`   VARCHAR(16)  NOT NULL DEFAULT '',
  `pos`       SMALLINT     NOT NULL DEFAULT 0,
  `money`     INT          NOT NULL DEFAULT 0,
  `stamina`   SMALLINT     NOT NULL DEFAULT 0,
  `spirit`    SMALLINT     NOT NULL DEFAULT 0,
  `face`      SMALLINT     NOT NULL DEFAULT 0,
  `card_id`   VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '事件卡标识',
  `opt_idx`   SMALLINT     NOT NULL DEFAULT -1,
  `created_at` DATETIME    NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_uid_life` (`uid`,`life_id`),
  KEY `idx_card` (`card_id`),
  KEY `idx_day` (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日流水';

-- ------------------------------------------------------------
-- 业力遗产（前玩家的善举变成新玩家的开局卡）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}karma` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `from_uid`   INT UNSIGNED NOT NULL,
  `from_life`  INT UNSIGNED NOT NULL DEFAULT 0,
  `from_job`   VARCHAR(64)  NOT NULL DEFAULT '',
  `kind`       VARCHAR(24)  NOT NULL DEFAULT 'aid' COMMENT 'aid|gift|stay|honest',
  `title`      VARCHAR(120) NOT NULL,
  `text`       VARCHAR(255) NOT NULL,
  `opt_a`      VARCHAR(120) NOT NULL DEFAULT '还这份人情',
  `opt_b`      VARCHAR(120) NOT NULL DEFAULT '装作不知道',
  `effect_a`   VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'JSON: {money,st,sp,fc,rt}',
  `effect_b`   VARCHAR(255) NOT NULL DEFAULT '',
  `claimed_by` INT UNSIGNED NOT NULL DEFAULT 0,
  `claimed_at` DATETIME     NULL DEFAULT NULL,
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_claim` (`claimed_by`),
  KEY `idx_from` (`from_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='业力遗产';

-- ------------------------------------------------------------
-- 遗物
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}relics` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `from_uid`   INT UNSIGNED NOT NULL,
  `from_life`  INT UNSIGNED NOT NULL DEFAULT 0,
  `relic_key`  VARCHAR(48)  NOT NULL COMMENT '预置遗物 id，非自由文本',
  `name`       VARCHAR(64)  NOT NULL,
  `text`       VARCHAR(255) NOT NULL,
  `effect`     VARCHAR(255) NOT NULL DEFAULT '',
  `claimed_by` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_claim` (`claimed_by`),
  KEY `idx_key` (`relic_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='遗物';

-- ------------------------------------------------------------
-- 孟婆汤漂流瓶（预置遗言库，玩家选一条）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}bottles` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `from_uid`   INT UNSIGNED NOT NULL,
  `from_life`  INT UNSIGNED NOT NULL DEFAULT 0,
  `line_key`   VARCHAR(48)  NOT NULL,
  `text`       VARCHAR(255) NOT NULL,
  `claimed_by` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_claim` (`claimed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 三生石 · 隔世信（按条件投递）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}letters` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `from_uid`    INT UNSIGNED NOT NULL,
  `from_life`   INT UNSIGNED NOT NULL DEFAULT 0,
  `cond_type`   VARCHAR(24)  NOT NULL DEFAULT 'any' COMMENT 'any|job|day|weather|season',
  `cond_value`  VARCHAR(64)  NOT NULL DEFAULT '',
  `line_key`    VARCHAR(48)  NOT NULL,
  `text`        VARCHAR(255) NOT NULL,
  `to_uid`      INT UNSIGNED NOT NULL DEFAULT 0,
  `delivered_at` DATETIME    NULL DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cond` (`cond_type`,`cond_value`),
  KEY `idx_to` (`to_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 望乡台 · 阳间牵挂
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}homes` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid`       INT UNSIGNED NOT NULL,
  `life_id`   INT UNSIGNED NOT NULL DEFAULT 0,
  `kind`      VARCHAR(24)  NOT NULL DEFAULT 'person' COMMENT 'person|thing|place',
  `name`      VARCHAR(64)  NOT NULL,
  `visit_cnt` INT          NOT NULL DEFAULT 0,
  `created_at` DATETIME    NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `{{P}}home_notes` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `home_id`   INT UNSIGNED NOT NULL,
  `uid`       INT UNSIGNED NOT NULL,
  `preset_id` VARCHAR(48)  NOT NULL,
  `created_at` DATETIME    NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_home` (`home_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 判官陪审（案卷 / 判定）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}cases` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid`        INT UNSIGNED NOT NULL,
  `life_id`    INT UNSIGNED NOT NULL DEFAULT 0,
  `job_name`   VARCHAR(64)  NOT NULL DEFAULT '',
  `fragments`  TEXT         NOT NULL COMMENT 'JSON: 6 个关键片段，不含数值',
  `truth`      TINYINT      NOT NULL DEFAULT 1 COMMENT '机器初判：2 善 1 平 0 恶',
  `final`      TINYINT      NOT NULL DEFAULT -1 COMMENT '-1 未定 2 善 1 平 0 恶',
  `votes`      TINYINT      NOT NULL DEFAULT 0,
  `sum_score`  SMALLINT     NOT NULL DEFAULT 0,
  `status`     TINYINT      NOT NULL DEFAULT 0 COMMENT '0 待审 1 已结',
  `created_at` DATETIME     NOT NULL,
  `closed_at`  DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='判官案卷';

CREATE TABLE IF NOT EXISTS `{{P}}case_votes` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `case_id`    INT UNSIGNED NOT NULL,
  `uid`        INT UNSIGNED NOT NULL,
  `verdict`    TINYINT      NOT NULL DEFAULT 1 COMMENT '2 善 1 平 0 恶',
  `speech_key` VARCHAR(48)  NOT NULL DEFAULT '' COMMENT '预置辩护词',
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_case_uid` (`case_id`,`uid`),
  KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 世界状态（全服共时，单行 id=1）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}world` (
  `id`          TINYINT      NOT NULL DEFAULT 1,
  `game_clock`  VARCHAR(16)  NOT NULL DEFAULT '07:00' COMMENT '游戏内时刻',
  `weather`     VARCHAR(16)  NOT NULL DEFAULT 'sunny',
  `is_night`    TINYINT      NOT NULL DEFAULT 0,
  `price_index` DECIMAL(6,3) NOT NULL DEFAULT 1.000 COMMENT '全服物价系数',
  `online_cnt`  INT          NOT NULL DEFAULT 0,
  `festival`    VARCHAR(24)  NOT NULL DEFAULT '' COMMENT '当前节日/节气',
  `tick_at`     DATETIME     NOT NULL,
  `note`        VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 交易所订单（阴德）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}orders` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid`        INT UNSIGNED NOT NULL,
  `side`       VARCHAR(8)   NOT NULL DEFAULT 'sell' COMMENT 'buy|sell',
  `item`       VARCHAR(24)  NOT NULL DEFAULT 'merit',
  `qty`        INT          NOT NULL DEFAULT 0,
  `price`      INT          NOT NULL DEFAULT 0 COMMENT '单价（元）',
  `status`     TINYINT      NOT NULL DEFAULT 0 COMMENT '0 挂单 1 成交 2 撤销',
  `filled_by`  INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL,
  `filled_at`  DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`,`side`),
  KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 典当（抵押未来的某一天）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}pledges` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid`        INT UNSIGNED NOT NULL,
  `days`       INT          NOT NULL DEFAULT 0 COMMENT '抵押天数',
  `cash`       INT          NOT NULL DEFAULT 0,
  `due_day`    INT          NOT NULL DEFAULT 0 COMMENT '游戏内到期天',
  `status`     TINYINT      NOT NULL DEFAULT 0 COMMENT '0 未赎回 1 已赎回 2 已清算',
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_uid` (`uid`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 借寿（替身债）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}lifeloans` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `from_uid`   INT UNSIGNED NOT NULL COMMENT '借出方',
  `to_uid`     INT UNSIGNED NOT NULL COMMENT '借入方',
  `days`       INT          NOT NULL DEFAULT 0,
  `merit`      INT          NOT NULL DEFAULT 0,
  `status`     TINYINT      NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_from` (`from_uid`),
  KEY `idx_to` (`to_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 香火祈愿
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}wishes` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `from_uid`   INT UNSIGNED NOT NULL,
  `to_uid`     INT UNSIGNED NOT NULL,
  `incense`    TINYINT      NOT NULL DEFAULT 1,
  `bless`      VARCHAR(24)  NOT NULL DEFAULT 'spirit',
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_to` (`to_uid`),
  KEY `idx_from` (`from_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 鬼火（地府位置热点）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}ghosts` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid`        INT UNSIGNED NOT NULL,
  `area`       VARCHAR(32)  NOT NULL DEFAULT '',
  `gx`         DECIMAL(8,2) NOT NULL DEFAULT 0,
  `gz`         DECIMAL(8,2) NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_area` (`area`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 事件卡体检（每张卡的选项分布）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}card_stats` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `card_id`   VARCHAR(80)  NOT NULL DEFAULT '',
  `opt_idx`   SMALLINT     NOT NULL DEFAULT 0,
  `season`    TINYINT      NOT NULL DEFAULT 0,
  `cnt`       INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_card_opt` (`card_id`,`opt_idx`,`season`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 全服报告快照
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}reports` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `period`     VARCHAR(24)  NOT NULL DEFAULT '',
  `payload`    MEDIUMTEXT   NOT NULL,
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_period` (`period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 棋盘中央广告位（社会时钟塔 / 四柱灯箱 / 地面地贴）
--   slot: tower 塔身四面 | pillar 灯箱八面 | ground 地贴四块
--   pos : 同槽位内的摆位序号，0 开始
--   内容全部由后台填写，前端只读不写；link 只允许 http(s)，前端不做跳转渲染
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}ads` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slot`        VARCHAR(16)  NOT NULL DEFAULT 'pillar',
  `pos`         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `brand`       VARCHAR(24)  NOT NULL DEFAULT '' COMMENT '左上角角标',
  `title`       VARCHAR(48)  NOT NULL DEFAULT '',
  `subtitle`    VARCHAR(48)  NOT NULL DEFAULT '',
  `note`        VARCHAR(48)  NOT NULL DEFAULT '' COMMENT '底部小字，留空用默认免责声明',
  `bg`          VARCHAR(16)  NOT NULL DEFAULT '#fdf8ee',
  `fg`          VARCHAR(16)  NOT NULL DEFAULT '#241f1a',
  `accent`      VARCHAR(16)  NOT NULL DEFAULT '#f97316',
  `link`        VARCHAR(191) NOT NULL DEFAULT '',
  `weight`      SMALLINT UNSIGNED NOT NULL DEFAULT 10 COMMENT '同 pos 时越大越靠前',
  `status`      TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1 上架 0 下架',
  `start_at`    DATETIME     NULL,
  `end_at`      DATETIME     NULL,
  `impressions` INT UNSIGNED NOT NULL DEFAULT 0,
  `clicks`      INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL,
  `updated_at`  DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_slot` (`slot`,`status`,`pos`),
  KEY `idx_time` (`start_at`,`end_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 访问日志（后台「数据概览」的来源）
--   一次页面加载记一行；不记任何玩家行为内容。
--   vid：前端生成的访客指纹（30 天轮换），用于算 UV
--   area：IP 归属地区，离线库判定（省级近似），不对外展示 IP
--   device / browser / os：由 User-Agent 解析，中文枚举
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}visits` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0 表示未登录访客',
  `vid`        CHAR(32)     NOT NULL DEFAULT '' COMMENT '访客指纹',
  `ip`         VARCHAR(45)  NOT NULL DEFAULT '',
  `area`       VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '归属地区，如 广东 / 中国香港 / 日本',
  `device`     VARCHAR(12)  NOT NULL DEFAULT '电脑' COMMENT '电脑|手机|平板|机器人',
  `browser`    VARCHAR(16)  NOT NULL DEFAULT '其他',
  `os`         VARCHAR(16)  NOT NULL DEFAULT '其他',
  `screen`     VARCHAR(12)  NOT NULL DEFAULT '' COMMENT '如 1920x1080',
  `tz`         VARCHAR(48)  NOT NULL DEFAULT '' COMMENT '浏览器时区',
  `lang`       VARCHAR(24)  NOT NULL DEFAULT '' COMMENT '浏览器语言',
  `path`       VARCHAR(12)  NOT NULL DEFAULT 'index' COMMENT 'index|difu|tiangong|other',
  `ref`        VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '来源域名',
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_time` (`created_at`),
  KEY `idx_area` (`area`),
  KEY `idx_device` (`device`),
  KEY `idx_browser` (`browser`),
  KEY `idx_vid` (`vid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访问日志';

-- ------------------------------------------------------------
-- 系统设置
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}settings` (
  `k` VARCHAR(64) NOT NULL,
  `v` TEXT        NOT NULL,
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 操作审计（后台）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}audit` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid`        INT UNSIGNED NOT NULL DEFAULT 0,
  `action`     VARCHAR(48)  NOT NULL DEFAULT '',
  `target`     VARCHAR(64)  NOT NULL DEFAULT '',
  `detail`     VARCHAR(255) NOT NULL DEFAULT '',
  `ip`         VARCHAR(45)  NOT NULL DEFAULT '',
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_uid` (`uid`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 善恶流水（全服天平的原料）
-- 每做一次善事/恶事记一行，world.balance 按最近七天聚合。
-- 之所以不直接加到 lives 上：lives 是"一世一行"，而善恶是过程数据，
-- 而且老库加列要 ALTER，一键安装就不好使了。
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}karma_log` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid`        INT UNSIGNED NOT NULL DEFAULT 0,
  `good`       TINYINT      NOT NULL DEFAULT 0,
  `evil`       TINYINT      NOT NULL DEFAULT 0,
  `title`      VARCHAR(64)  NOT NULL DEFAULT '',
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='善恶流水';

-- ------------------------------------------------------------
-- 因果债：A 做了恶事，随机落到 B 头上，B 下次开局会撞见讨债
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}debts` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `from_uid`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '欠债的人',
  `to_uid`     INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '债主',
  `evil_title` VARCHAR(64)  NOT NULL DEFAULT '',
  `taken`      TINYINT      NOT NULL DEFAULT 0 COMMENT '债主是否已经撞见过',
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_to` (`to_uid`,`taken`),
  KEY `idx_from` (`from_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='玩家之间的因果债';

-- ------------------------------------------------------------
-- 事件图鉴：这个玩家见过哪些事件
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `{{P}}codex` (
  `uid`        INT UNSIGNED NOT NULL,
  `title`      VARCHAR(64)  NOT NULL DEFAULT '',
  `created_at` DATETIME     NOT NULL,
  PRIMARY KEY (`uid`,`title`),
  KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='事件图鉴收集';

-- 世界状态初始行
INSERT INTO `{{P}}world` (`id`,`game_clock`,`weather`,`is_night`,`price_index`,`online_cnt`,`festival`,`tick_at`,`note`)
VALUES (1,'07:00','sunny',0,1.000,0,'',NOW(),'初始世界')
ON DUPLICATE KEY UPDATE `id`=`id`;

SET FOREIGN_KEY_CHECKS = 1;
