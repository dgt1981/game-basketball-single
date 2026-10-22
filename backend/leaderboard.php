<?php
/**
 * 挑战老黄 3D - 游戏排行榜读写接口 (API)
 * 支持 GET (获取排名) 和 POST (提交战绩)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// 处理浏览器 CORS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

$method = $_SERVER['REQUEST_METHOD'];

// ==========================================
// 1. GET 请求: 查询排行榜列表
// ==========================================
if ($method === 'GET') {
    $difficulty = isset($_GET['difficulty']) ? trim($_GET['difficulty']) : 'all';
    $sort = isset($_GET['sort']) ? trim($_GET['sort']) : 'mvp';
    $limit = isset($_GET['limit']) ? min(max((int)$_GET['limit'], 1), 100) : 50;

    // 允许的排序字段映射
    $sortColumns = [
        'mvp'    => 'mvp_rating',
        'streak' => 'win_streak',
        'fg'     => 'fg_percentage',
        'three'  => 'three_point_percentage',
    ];
    $orderBy = $sortColumns[$sort] ?? 'mvp_rating';

    $whereClause = '';
    $params = [];

    // 难度筛选过滤
    $validDifficulties = ['rookie', 'pro', 'allstar', 'legend'];
    if (in_array($difficulty, $validDifficulties, true)) {
        $whereClause = 'WHERE `difficulty` = :difficulty';
        $params[':difficulty'] = $difficulty;
    }

    $sql = "SELECT 
                `id`,
                `player_name`,
                `avatar`,
                `country`,
                `country_code`,
                `difficulty`,
                `score`,
                `fg_percentage`,
                `three_point_percentage`,
                `win_streak`,
                `mvp_rating`,
                DATE_FORMAT(`created_at`, '%Y-%m-%d') AS `date`
            FROM `game_leaderboard`
            {$whereClause}
            ORDER BY `{$orderBy}` DESC, `created_at` ASC
            LIMIT {$limit}";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // 格式化输出，附加实时名次序号 (rank: 1, 2, 3...)
        $data = [];
        foreach ($rows as $index => $row) {
            $data[] = [
                'id'                   => 'db_' . $row['id'],
                'rank'                 => $index + 1,
                'playerName'           => $row['player_name'],
                'avatar'               => $row['avatar'],
                'country'              => $row['country'],
                'countryCode'          => $row['country_code'],
                'difficulty'           => $row['difficulty'],
                'score'                => (int)$row['score'],
                'fgPercentage'         => (int)$row['fg_percentage'],
                'threePointPercentage' => (int)$row['three_point_percentage'],
                'winStreak'            => (int)$row['win_streak'],
                'mvpRating'            => (int)$row['mvp_rating'],
                'date'                 => $row['date'],
            ];
        }

        echo json_encode([
            'success' => true,
            'total'   => count($data),
            'data'    => $data,
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => '查询排行榜失败: ' . $e->getMessage(),
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// ==========================================
// 2. POST 请求: 提交本场比赛战绩
// ==========================================
if ($method === 'POST') {
    // 读取请求体 JSON 数据
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input) {
        $input = $_POST;
    }

    // 参数过滤与校验
    $playerName = trim($input['playerName'] ?? $input['player_name'] ?? '街球选手');
    if (mb_strlen($playerName, 'UTF-8') > 32) {
        $playerName = mb_substr($playerName, 0, 32, 'UTF-8');
    }
    if (empty($playerName)) {
        $playerName = '街球选手';
    }

    $avatar = trim($input['avatar'] ?? '🏀');
    $country = trim($input['country'] ?? '中国');
    $countryCode = trim($input['countryCode'] ?? $input['country_code'] ?? 'CN');

    $difficulty = trim($input['difficulty'] ?? 'allstar');
    if (!in_array($difficulty, ['rookie', 'pro', 'allstar', 'legend'], true)) {
        $difficulty = 'allstar';
    }

    $score = min(max((int)($input['score'] ?? 0), 0), 100);
    $fgPct = min(max((int)($input['fgPercentage'] ?? $input['fg_percentage'] ?? 0), 0), 100);
    $threePct = min(max((int)($input['threePointPercentage'] ?? $input['three_point_percentage'] ?? 0), 0), 100);
    $winStreak = min(max((int)($input['winStreak'] ?? $input['win_streak'] ?? 0), 0), 9999);
    $mvpRating = min(max((int)($input['mvpRating'] ?? $input['mvp_rating'] ?? 0), 0), 99999);

    // 获取客户端 IP
    $clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (strpos($clientIp, ',') !== false) {
        $clientIp = explode(',', $clientIp)[0];
    }
    $clientIp = trim(substr($clientIp, 0, 45));

    $insertSql = "INSERT INTO `game_leaderboard` (
                    `player_name`,
                    `avatar`,
                    `country`,
                    `country_code`,
                    `difficulty`,
                    `score`,
                    `fg_percentage`,
                    `three_point_percentage`,
                    `win_streak`,
                    `mvp_rating`,
                    `ip_address`
                  ) VALUES (
                    :player_name,
                    :avatar,
                    :country,
                    :country_code,
                    :difficulty,
                    :score,
                    :fg_percentage,
                    :three_point_percentage,
                    :win_streak,
                    :mvp_rating,
                    :ip_address
                  )";

    try {
        $stmt = $pdo->prepare($insertSql);
        $stmt->execute([
            ':player_name'             => $playerName,
            ':avatar'                  => $avatar,
            ':country'                 => $country,
            ':country_code'            => $countryCode,
            ':difficulty'              => $difficulty,
            ':score'                   => $score,
            ':fg_percentage'           => $fgPct,
            ':three_point_percentage'  => $threePct,
            ':win_streak'              => $winStreak,
            ':mvp_rating'              => $mvpRating,
            ':ip_address'              => $clientIp,
        ]);

        $insertId = $pdo->lastInsertId();

        // 计算当前记录在全服天梯中的实时名次
        $rankSql = "SELECT COUNT(*) + 1 AS `current_rank` 
                    FROM `game_leaderboard` 
                    WHERE `mvp_rating` > :mvp_rating";
        $rankStmt = $pdo->prepare($rankSql);
        $rankStmt->execute([':mvp_rating' => $mvpRating]);
        $rankResult = $rankStmt->fetch();
        $assignedRank = (int)($rankResult['current_rank'] ?? 1);

        echo json_encode([
            'success' => true,
            'message' => '战绩已成功收录至全球排行榜！',
            'data'    => [
                'id'                   => 'db_' . $insertId,
                'rank'                 => $assignedRank,
                'playerName'           => $playerName,
                'avatar'               => $avatar,
                'country'              => $country,
                'countryCode'          => $countryCode,
                'difficulty'           => $difficulty,
                'score'                => $score,
                'fgPercentage'         => $fgPct,
                'threePointPercentage' => $threePct,
                'winStreak'            => $winStreak,
                'mvpRating'            => $mvpRating,
                'date'                 => date('Y-m-d'),
                'isUser'               => true,
            ],
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => '战绩写入失败: ' . $e->getMessage(),
        ], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// 不支持的其他 HTTP 方法
http_response_code(405);
echo json_encode([
    'success' => false,
    'message' => 'Method Not Allowed',
], JSON_UNESCAPED_UNICODE);
