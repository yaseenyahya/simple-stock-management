<?php

declare(strict_types=1);

use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

$app = AppFactory::create();

$displayErrors = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
$app->addRoutingMiddleware();
$app->addBodyParsingMiddleware();
$app->addErrorMiddleware($displayErrors, true, true);

$cors = function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', $_ENV['CORS_ORIGIN'] ?? '*')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
};

$app->options('/{routes:.+}', function ($request, $response) {
    return $response->withStatus(204);
});

$app->add($cors);

$pdo = App\Database::pdo();

(require __DIR__ . '/../src/routes.php')($app, $pdo);

$app->run();
