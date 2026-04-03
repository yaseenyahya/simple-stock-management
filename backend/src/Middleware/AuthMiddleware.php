<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Services\JwtService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

final class AuthMiddleware implements MiddlewareInterface
{
    /**
     * @param list<string>|null $allowedRoles If null, any authenticated role is accepted.
     */
    public function __construct(
        private JwtService $jwt,
        private ?array $allowedRoles = null
    ) {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $header = $request->getHeaderLine('Authorization');
        if ($header === '' || !preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
            return $this->json(401, ['success' => false, 'message' => 'Missing or invalid Authorization header']);
        }

        try {
            $payload = $this->jwt->decode(trim($m[1]));
        } catch (\Throwable $e) {
            return $this->json(401, ['success' => false, 'message' => 'Invalid or expired token']);
        }

        $userId = isset($payload['sub']) ? (int) $payload['sub'] : 0;
        $role = (string) ($payload['role'] ?? '');
        if ($userId <= 0 || $role === '') {
            return $this->json(401, ['success' => false, 'message' => 'Invalid token payload']);
        }

        if ($this->allowedRoles !== null && !in_array($role, $this->allowedRoles, true)) {
            return $this->json(403, ['success' => false, 'message' => 'Forbidden']);
        }

        $request = $request->withAttribute('user_id', $userId);
        $request = $request->withAttribute('role', $role);

        return $handler->handle($request);
    }

    private function json(int $status, array $body): ResponseInterface
    {
        $r = new Response($status);
        $r->getBody()->write(json_encode($body));
        return $r->withHeader('Content-Type', 'application/json');
    }
}
