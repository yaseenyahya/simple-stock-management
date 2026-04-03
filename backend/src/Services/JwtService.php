<?php

declare(strict_types=1);

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class JwtService
{
    public function encode(array $payload): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? '';
        if ($secret === '') {
            throw new \RuntimeException('JWT_SECRET is not set');
        }
        if (strlen($secret) < 32) {
            $secret = hash('sha256', $secret, true);
        }

        $expiry = (int) ($_ENV['JWT_EXPIRY'] ?? 86400);
        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + $expiry;

        return JWT::encode($payload, $secret, 'HS256');
    }

    /**
     * @return array<string, mixed>
     */
    public function decode(string $token): array
    {
        $secret = $_ENV['JWT_SECRET'] ?? '';
        if ($secret === '') {
            throw new \RuntimeException('JWT_SECRET is not set');
        }
        if (strlen($secret) < 32) {
            $secret = hash('sha256', $secret, true);
        }
        $decoded = JWT::decode($token, new Key($secret, 'HS256'));
        return (array) $decoded;
    }
}
