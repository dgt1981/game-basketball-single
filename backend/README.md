# 挑战老黄 3D - MySQL 数据库与 PHP 排行榜接口部署说明

本项目提供了完整的 **MySQL 数据库建表文件** 与 **PHP 读写 API**，方便您无缝接入任何 PHP+MySQL 环境（宝塔面板、LNMP、LAMP 或 Docker）。

---

## 目录结构
```
backend/
├── schema.sql        # MySQL 数据库建表与初始排名种子数据
├── config.php        # 数据库连接配置 (PDO)
├── leaderboard.php   # 排行榜 REST API (GET 读取 / POST 提交)
└── README.md         # 部署说明文档
```

---

## 快速安装与配置（3 分钟搞定）

### 第一步：导入数据库表结构
在你的 MySQL 数据库中（可通过 phpMyAdmin、Navicat 或终端命令行）：

```bash
# 登录 MySQL
mysql -u root -p

# 执行 SQL 脚本（自动创建 tiaozhan_laohuang 数据库和 game_leaderboard 表）
source /path/to/backend/schema.sql;
```

或者直接在 phpMyAdmin 中复制 `backend/schema.sql` 文件的全部内容执行。

---

### 第二步：配置数据库连接 `config.php`
打开 `backend/config.php`，修改你的 MySQL 数据库账号和密码：

```php
define('DB_HOST', '127.0.0.1');       // 数据库地址
define('DB_PORT', '3306');            // 数据库端口
define('DB_NAME', 'tiaozhan_laohuang');// 数据库名称
define('DB_USER', 'root');            // 数据库用户名
define('DB_PASS', '你的数据库密码');    // 数据库密码
```

---

### 第三步：放置在 Web 站点目录
将 `backend/` 文件夹放到你的 Apache 或 Nginx 站点根目录下（例如发布为 `http://你的域名/api/leaderboard.php`）。

---

## 接口使用说明

### 1. 获取排行榜列表 (GET)
- **URL**: `http://你的域名/backend/leaderboard.php`
- **支持参数**:
  - `difficulty`: `all` (全部) | `rookie` | `pro` | `allstar` | `legend`
  - `sort`: `mvp` (默认战力) | `streak` (连胜) | `fg` (命中率)
  - `limit`: 返回数量（默认 50，最大 100）
- **返回示例**:
```json
{
  "success": true,
  "total": 8,
  "data": [
    {
      "id": "db_1",
      "rank": 1,
      "playerName": "CyberCurry_30",
      "avatar": "🏀",
      "country": "美国",
      "countryCode": "US",
      "difficulty": "legend",
      "score": 11,
      "fgPercentage": 88,
      "threePointPercentage": 83,
      "winStreak": 24,
      "mvpRating": 2840,
      "date": "2026-10-21"
    }
  ]
}
```

### 2. 提交比赛战绩 (POST)
- **URL**: `http://你的域名/backend/leaderboard.php`
- **请求头**: `Content-Type: application/json`
- **请求参数**:
```json
{
  "playerName": "大连街球王",
  "avatar": "🔥",
  "country": "中国",
  "countryCode": "CN",
  "difficulty": "legend",
  "score": 11,
  "fgPercentage": 82,
  "threePointPercentage": 75,
  "winStreak": 5,
  "mvpRating": 2450
}
```
- **返回结果**:
```json
{
  "success": true,
  "message": "战绩已成功收录至全球排行榜！",
  "data": {
    "id": "db_9",
    "rank": 3,
    "playerName": "大连街球王",
    "mvpRating": 2450,
    "date": "2026-10-21",
    "isUser": true
  }
}
```
接口会自动计算该战绩在全服的实时名次并返回。
