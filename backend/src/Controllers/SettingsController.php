<?php

declare(strict_types=1);

namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class SettingsController
{
    public function __construct(private PDO $pdo)
    {
    }

    public function show(Request $request, Response $response): Response
    {
        $stmt = $this->pdo->query('SELECT company_name, logo_url FROM settings WHERE id = 1 LIMIT 1');
        $row = $stmt->fetch();
        if (!$row) {
            return $this->json($response, 200, [
                'success' => true,
                'data' => ['company_name' => 'My Company', 'logo_url' => null],
            ]);
        }

        return $this->json($response, 200, ['success' => true, 'data' => $row]);
    }

    public function update(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        $name = trim((string) ($data['company_name'] ?? ''));
        $logo = isset($data['logo_url']) ? trim((string) $data['logo_url']) : null;
        if ($logo === '') {
            $logo = null;
        }

        if ($name === '') {
            return $this->json($response, 422, ['success' => false, 'message' => 'company_name is required']);
        }

        $stmt = $this->pdo->prepare('UPDATE settings SET company_name = ?, logo_url = ? WHERE id = 1');
        $stmt->execute([$name, $logo]);

        return $this->json($response, 200, ['success' => true, 'message' => 'Settings saved']);
    }

    private function json(Response $response, int $status, array $payload): Response
    {
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
