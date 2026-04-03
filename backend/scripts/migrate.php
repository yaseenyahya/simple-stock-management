<?php

declare(strict_types=1);

/**
 * Run pending database migrations (PHP callables in database/migrations/*.php).
 *
 * Usage: php scripts/migrate.php
 * (Run from backend directory, or: php backend/scripts/migrate.php from project root)
 */

require __DIR__ . '/bootstrap.php';

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '3306';
$name = $_ENV['DB_NAME'] ?? 'stock_management';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';

$dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    fwrite(STDERR, 'Database connection failed: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}

$pdo->exec(
    <<<'SQL'
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` VARCHAR(190) NOT NULL,
  `executed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migrations_migration_unique` (`migration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
);

$dir = dirname(__DIR__) . '/database/migrations';
$files = glob($dir . '/*.php') ?: [];
sort($files, SORT_STRING);

$ran = $pdo->query('SELECT migration FROM migrations')->fetchAll(PDO::FETCH_COLUMN);
$ranSet = array_flip(array_map('strval', $ran));

foreach ($files as $file) {
    $basename = basename($file);
    if (isset($ranSet[$basename])) {
        continue;
    }

    $migration = require $file;
    if (!is_callable($migration)) {
        fwrite(STDERR, "Invalid migration (not callable): {$basename}\n");
        exit(1);
    }

    echo "Running {$basename}...\n";
    try {
        $migration($pdo);
        $stmt = $pdo->prepare('INSERT INTO migrations (migration) VALUES (?)');
        $stmt->execute([$basename]);
    } catch (Throwable $e) {
        fwrite(STDERR, "Migration failed: {$basename}\n" . $e->getMessage() . PHP_EOL);
        exit(1);
    }
}

echo "Migrations complete.\n";
