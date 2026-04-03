<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\JwtService;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class AuthController
{
    public function __construct(
        private PDO $pdo,
        private JwtService $jwt
    ) {
    }

    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        if ($email === '' || $password === '') {
            return $this->json($response, 422, ['success' => false, 'message' => 'Email and password are required']);
        }

        $stmt = $this->pdo->prepare('SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password'])) {
            return $this->json($response, 401, ['success' => false, 'message' => 'Invalid credentials']);
        }

        $token = $this->jwt->encode([
            'sub' => (int) $user['id'],
            'role' => $user['role'],
            'email' => $user['email'],
        ]);

        return $this->json($response, 200, [
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
            ],
        ]);
    }

    public function forgotPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        $email = trim((string) ($data['email'] ?? ''));
        if ($email === '') {
            return $this->json($response, 422, ['success' => false, 'message' => 'Email is required']);
        }

        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        if (!$row) {
            return $this->json($response, 200, [
                'success' => true,
                'message' => 'If the email exists, reset instructions have been sent.',
            ]);
        }

        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600);

        $upd = $this->pdo->prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?');
        $upd->execute([$token, $expires, $row['id']]);

        $baseUrl = rtrim($_ENV['FRONTEND_URL'] ?? 'http://localhost:5173', '/');
        $resetLink = $baseUrl . '/reset-password?token=' . urlencode($token);

        $payload = [
            'success' => true,
            'message' => 'If the email exists, reset instructions have been sent.',
        ];
        if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
            $payload['reset_link'] = $resetLink;
        }

        return $this->json($response, 200, $payload);
    }

    public function resetPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        $token = trim((string) ($data['token'] ?? ''));
        $password = (string) ($data['password'] ?? '');
        $confirm = (string) ($data['password_confirm'] ?? '');

        if ($token === '' || $password === '') {
            return $this->json($response, 422, ['success' => false, 'message' => 'Token and new password are required']);
        }
        if (strlen($password) < 8) {
            return $this->json($response, 422, ['success' => false, 'message' => 'Password must be at least 8 characters']);
        }
        if ($password !== $confirm) {
            return $this->json($response, 422, ['success' => false, 'message' => 'Passwords do not match']);
        }

        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1');
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        if (!$row) {
            return $this->json($response, 400, ['success' => false, 'message' => 'Invalid or expired reset token']);
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $upd = $this->pdo->prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?');
        $upd->execute([$hash, $row['id']]);

        return $this->json($response, 200, ['success' => true, 'message' => 'Password has been reset']);
    }

    public function changePassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        $current = (string) ($data['current_password'] ?? '');
        $new = (string) ($data['new_password'] ?? '');
        $confirm = (string) ($data['new_password_confirm'] ?? '');
        $userId = (int) $request->getAttribute('user_id');

        if ($current === '' || $new === '') {
            return $this->json($response, 422, ['success' => false, 'message' => 'Current and new password are required']);
        }
        if (strlen($new) < 8) {
            return $this->json($response, 422, ['success' => false, 'message' => 'New password must be at least 8 characters']);
        }
        if ($new !== $confirm) {
            return $this->json($response, 422, ['success' => false, 'message' => 'New passwords do not match']);
        }

        $stmt = $this->pdo->prepare('SELECT password FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        if (!$row || !password_verify($current, $row['password'])) {
            return $this->json($response, 401, ['success' => false, 'message' => 'Current password is incorrect']);
        }

        $hash = password_hash($new, PASSWORD_DEFAULT);
        $upd = $this->pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
        $upd->execute([$hash, $userId]);

        return $this->json($response, 200, ['success' => true, 'message' => 'Password updated']);
    }

    public function me(Request $request, Response $response): Response
    {
        $userId = (int) $request->getAttribute('user_id');
        $stmt = $this->pdo->prepare('SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        if (!$user) {
            return $this->json($response, 404, ['success' => false, 'message' => 'User not found']);
        }

        return $this->json($response, 200, [
            'success' => true,
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
            ],
        ]);
    }

    private function json(Response $response, int $status, array $payload): Response
    {
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
