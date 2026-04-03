<?php

declare(strict_types=1);

/**
 * Initial schema — settings, users, items, sales.
 */
return function (PDO $pdo): void {
    $pdo->exec('SET NAMES utf8mb4');
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');

    $pdo->exec(
        <<<'SQL'
CREATE TABLE `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_name` VARCHAR(255) NOT NULL DEFAULT 'My Company',
  `logo_url` VARCHAR(500) NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
    );

    $pdo->exec(
        <<<'SQL'
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'stock_manager') NOT NULL DEFAULT 'stock_manager',
  `reset_token` VARCHAR(64) NULL DEFAULT NULL,
  `reset_token_expires` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
    );

    $pdo->exec(
        <<<'SQL'
CREATE TABLE `items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_name` VARCHAR(1000) NOT NULL,
  `stock_machan` INT NOT NULL DEFAULT 0,
  `stock_shop` INT NOT NULL DEFAULT 0,
  `price_from` DECIMAL(14, 2) NOT NULL,
  `price_to` DECIMAL(14, 2) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `items_item_name_idx` (`item_name`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
    );

    $pdo->exec(
        <<<'SQL'
CREATE TABLE `sales` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_id` INT UNSIGNED NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `qty_from_shop` INT UNSIGNED NOT NULL DEFAULT 0,
  `qty_from_machan` INT UNSIGNED NOT NULL DEFAULT 0,
  `price` DECIMAL(14, 2) NOT NULL,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sales_item_id_idx` (`item_id`),
  KEY `sales_date_idx` (`date`),
  CONSTRAINT `sales_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL
    );

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

    $pdo->exec("INSERT INTO `settings` (`id`, `company_name`, `logo_url`) VALUES (1, 'My Company', NULL)");
};
