-- -------------------------------------------------------------
-- 挑战老黄 3D - 游戏排行榜数据库表结构 (MySQL 5.7+ / 8.0+)
-- 字符集: utf8mb4 / utf8mb4_unicode_ci
-- -------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS `tiaozhan_laohuang` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tiaozhan_laohuang`;

-- 1. 创建排行榜主表
DROP TABLE IF EXISTS `game_leaderboard`;
CREATE TABLE `game_leaderboard` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '主键自增ID',
    `player_name` VARCHAR(64) NOT NULL DEFAULT '街球选手' COMMENT '球手昵称',
    `avatar` VARCHAR(16) NOT NULL DEFAULT '🏀' COMMENT '球手头像/Emoji',
    `country` VARCHAR(32) NOT NULL DEFAULT '中国' COMMENT '国家/地区名称',
    `country_code` VARCHAR(8) NOT NULL DEFAULT 'CN' COMMENT '国家代码(ISO)',
    `difficulty` ENUM('rookie', 'pro', 'allstar', 'legend') NOT NULL DEFAULT 'allstar' COMMENT '对抗老黄难度段位',
    `score` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '本场得分',
    `fg_percentage` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '投篮命中率(0-100)',
    `three_point_percentage` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '三分命中率(0-100)',
    `win_streak` SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当前连胜场次',
    `mvp_rating` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '综合MVP战力值',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '提交者IP',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '战绩记录时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引优化: 大幅加速排行榜高并发查询与段位筛选
    INDEX `idx_mvp_rating` (`mvp_rating` DESC),
    INDEX `idx_difficulty_mvp` (`difficulty`, `mvp_rating` DESC),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='街头篮球天梯排行榜表';

-- 2. 预置全球天梯高手初始榜单数据（导入后立刻展示实时数据库排名）
INSERT INTO `game_leaderboard` 
(`player_name`, `avatar`, `country`, `country_code`, `difficulty`, `score`, `fg_percentage`, `three_point_percentage`, `win_streak`, `mvp_rating`) 
VALUES
('CyberCurry_30', '🏀', '美国', 'US', 'legend', 11, 88, 83, 24, 2840),
('北京街球王_大鹏', '⚡', '中国', 'CN', 'legend', 11, 83, 75, 19, 2620),
('Kyrie_Handles', '🔥', '澳大利亚', 'AU', 'legend', 11, 81, 71, 16, 2490),
('Tokyo_Samurai99', '🎯', '日本', 'JP', 'allstar', 11, 77, 66, 14, 2310),
('Paris_Hooper', '✨', '法国', 'FR', 'allstar', 11, 75, 62, 12, 2180),
('上海闪电_Leo', '👑', '中国', 'CN', 'allstar', 11, 73, 60, 11, 2050),
('Berlin_Wall_D', '🛡️', '德国', 'DE', 'pro', 11, 70, 54, 9, 1890),
('Samba_Dunk_BR', '🌴', '巴西', 'BR', 'pro', 11, 68, 50, 8, 1740);
