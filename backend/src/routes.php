<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\InventoryController;
use App\Controllers\ItemController;
use App\Controllers\SaleController;
use App\Controllers\SettingsController;
use App\Middleware\AuthMiddleware;
use App\Services\JwtService;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

/** @param \PDO $pdo */
return function (App $app, \PDO $pdo) {
    $jwt = new JwtService();
    $authAny = new AuthMiddleware($jwt, null);
    $authAdmin = new AuthMiddleware($jwt, ['admin']);
    $authRoles = new AuthMiddleware($jwt, ['admin', 'stock_manager']);

    $authController = new AuthController($pdo, $jwt);
    $itemController = new ItemController($pdo);
    $saleController = new SaleController($pdo);
    $settingsController = new SettingsController($pdo);
    $inventoryController = new InventoryController($pdo);

    $app->group('/api', function (RouteCollectorProxy $group) use (
        $authController,
        $itemController,
        $saleController,
        $settingsController,
        $inventoryController,
        $authAny,
        $authAdmin,
        $authRoles
    ) {
        $group->post('/auth/login', [$authController, 'login']);
        $group->post('/auth/forgot-password', [$authController, 'forgotPassword']);
        $group->post('/auth/reset-password', [$authController, 'resetPassword']);

        $group->get('/auth/me', [$authController, 'me'])->add($authAny);
        $group->post('/auth/change-password', [$authController, 'changePassword'])->add($authAdmin);

        $group->get('/settings', [$settingsController, 'show'])->add($authRoles);
        $group->put('/settings', [$settingsController, 'update'])->add($authAdmin);

        $group->get('/items', [$itemController, 'index'])->add($authAdmin);
        $group->get('/items/search', [$itemController, 'search'])->add($authAdmin);
        $group->get('/items/{id}', [$itemController, 'show'])->add($authAdmin);
        $group->post('/items', [$itemController, 'store'])->add($authAdmin);
        $group->put('/items/{id}', [$itemController, 'update'])->add($authAdmin);

        $group->get('/inventory', [$inventoryController, 'index'])->add($authRoles);

        $group->get('/sales', [$saleController, 'index'])->add($authAdmin);
        $group->post('/sales', [$saleController, 'store'])->add($authAdmin);
        $group->delete('/sales/{id}', [$saleController, 'destroy'])->add($authAdmin);
    });
};
