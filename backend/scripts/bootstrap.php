<?php

declare(strict_types=1);

/**
 * Shared bootstrap for CLI scripts (migrate, seed).
 * Ensures Composer autoload exists before requiring it.
 */

$root = dirname(__DIR__);
$autoload = $root . '/vendor/autoload.php';

if (!is_file($autoload)) {
    fwrite(STDERR, "Composer dependencies are missing.\n\n");
    fwrite(STDERR, "Open a terminal in the backend folder and run:\n");
    fwrite(STDERR, "  composer install\n\n");
    fwrite(STDERR, "Expected file:\n  {$autoload}\n");
    exit(1);
}

require $autoload;

$dotenv = Dotenv\Dotenv::createImmutable($root);
$dotenv->safeLoad();
