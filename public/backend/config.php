<?php
/**
 * 挑战老黄 3D - 数据库连接配置
 */

// 数据库配置项（请根据你的服务器实际 MySQL 信息修改）
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'tiaozhan_laohuang');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '123456'); // 替换为你的 MySQL 密码
define('DB_CHARSET', 'utf8mb4');

/**
 * 获取 PDO 数据库连接单例
 */
function getDbConnection(): ?PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 3,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            header('Access-Control-Allow-Origin: *');
            echo json_encode([
                'success' => false,
                'error_type' => 'db_connection_failed',
                'message' => '数据库连接失败: ' . $e->getMessage() . ' (请检查 backend/config.php 中的数据库密码与库名)',
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    return $pdo;
}
