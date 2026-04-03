<?php

declare(strict_types=1);

/**
 * Seed default admin user (and optional stock manager) using bcrypt passwords.
 *
 * Usage: php scripts/seed.php
 *
 * Configure via .env:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME
 *   SEED_MANAGER_EMAIL, SEED_MANAGER_PASSWORD, SEED_MANAGER_NAME (optional)
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

$adminEmail = trim($_ENV['SEED_ADMIN_EMAIL'] ?? 'admin@example.com');
$adminPassword = (string) ($_ENV['SEED_ADMIN_PASSWORD'] ?? 'password');
$adminName = trim($_ENV['SEED_ADMIN_NAME'] ?? 'Admin User');

if ($adminEmail === '' || $adminPassword === '') {
    fwrite(STDERR, "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set (or use defaults).\n");
    exit(1);
}

$hash = password_hash($adminPassword, PASSWORD_DEFAULT);

$check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$check->execute([$adminEmail]);
if ($check->fetch()) {
    echo "Admin user already exists ({$adminEmail}). Skipping admin insert.\n";
} else {
    $ins = $pdo->prepare(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    );
    $ins->execute([$adminName, $adminEmail, $hash, 'admin']);
    echo "Admin user created: {$adminEmail}\n";
}

$mgrEmail = trim($_ENV['SEED_MANAGER_EMAIL'] ?? 'manager@example.com');
$mgrPassword = (string) ($_ENV['SEED_MANAGER_PASSWORD'] ?? 'password');
$mgrName = trim($_ENV['SEED_MANAGER_NAME'] ?? 'Stock Manager');

if ($mgrEmail !== '') {
    $check2 = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $check2->execute([$mgrEmail]);
    if ($check2->fetch()) {
        echo "Stock manager already exists ({$mgrEmail}). Skipping.\n";
    } else {
        $hash2 = password_hash($mgrPassword, PASSWORD_DEFAULT);
        $ins2 = $pdo->prepare(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
        );
        $ins2->execute([$mgrName, $mgrEmail, $hash2, 'stock_manager']);
        echo "Stock manager created: {$mgrEmail}\n";
    }
}

echo "Seeding complete.\n";
