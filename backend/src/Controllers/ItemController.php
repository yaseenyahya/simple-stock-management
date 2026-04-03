<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\ItemSearch;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ItemController
{
    public function __construct(private PDO $pdo)
    {
    }

    public function index(Request $request, Response $response): Response
    {
        $stmt = $this->pdo->query(
            'SELECT id, item_name, stock_machan, stock_shop, price_from, price_to, created_at, updated_at FROM items ORDER BY id DESC'
        );
        $items = $stmt->fetchAll();

        return $this->json($response, 200, ['success' => true, 'data' => $items]);
    }

    public function search(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $query = trim((string) ($params['query'] ?? ''));

        $stmt = $this->pdo->query(
            'SELECT id, item_name, stock_machan, stock_shop, price_from, price_to FROM items ORDER BY id DESC'
        );
        $all = $stmt->fetchAll();
        $filtered = ItemSearch::filterItems($all, $query);

        return $this->json($response, 200, ['success' => true, 'data' => $filtered]);
    }

    public function show(Request $request, Response $response, array $args): Response
    {
        $id = (int) ($args['id'] ?? 0);
        if ($id <= 0) {
            return $this->json($response, 422, ['success' => false, 'message' => 'Invalid id']);
        }

        $stmt = $this->pdo->prepare(
            'SELECT id, item_name, stock_machan, stock_shop, price_from, price_to FROM items WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            return $this->json($response, 404, ['success' => false, 'message' => 'Item not found']);
        }

        return $this->json($response, 200, ['success' => true, 'data' => $row]);
    }

    public function store(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        $err = $this->validateItem($data, false);
        if ($err !== null) {
            return $this->json($response, 422, ['success' => false, 'message' => $err]);
        }

        $stmt = $this->pdo->prepare(
            'INSERT INTO items (item_name, stock_machan, stock_shop, price_from, price_to) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            trim((string) $data['item_name']),
            (int) $data['stock_machan'],
            (int) $data['stock_shop'],
            (float) $data['price_from'],
            (float) $data['price_to'],
        ]);
        $id = (int) $this->pdo->lastInsertId();

        return $this->json($response, 201, ['success' => true, 'id' => $id, 'message' => 'Item created']);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $id = (int) ($args['id'] ?? 0);
        if ($id <= 0) {
            return $this->json($response, 422, ['success' => false, 'message' => 'Invalid id']);
        }

        $data = $request->getParsedBody() ?? [];
        $err = $this->validateItem($data, false);
        if ($err !== null) {
            return $this->json($response, 422, ['success' => false, 'message' => $err]);
        }

        $stmt = $this->pdo->prepare(
            'UPDATE items SET item_name = ?, stock_machan = ?, stock_shop = ?, price_from = ?, price_to = ? WHERE id = ?'
        );
        $stmt->execute([
            trim((string) $data['item_name']),
            (int) $data['stock_machan'],
            (int) $data['stock_shop'],
            (float) $data['price_from'],
            (float) $data['price_to'],
            $id,
        ]);

        if ($stmt->rowCount() === 0) {
            $check = $this->pdo->prepare('SELECT id FROM items WHERE id = ?');
            $check->execute([$id]);
            if (!$check->fetch()) {
                return $this->json($response, 404, ['success' => false, 'message' => 'Item not found']);
            }
        }

        return $this->json($response, 200, ['success' => true, 'message' => 'Item updated']);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function validateItem(array $data, bool $partial): ?string
    {
        $itemName = isset($data['item_name']) ? trim((string) $data['item_name']) : '';
        if ($itemName === '') {
            return 'item_name is required';
        }

        $stockMachan = isset($data['stock_machan']) ? (int) $data['stock_machan'] : 0;
        $stockShop = isset($data['stock_shop']) ? (int) $data['stock_shop'] : 0;
        if ($stockMachan < 0 || $stockShop < 0) {
            return 'Stock values cannot be negative';
        }

        if (!isset($data['price_from'], $data['price_to'])) {
            return 'price_from and price_to are required';
        }
        if (!is_numeric($data['price_from']) || !is_numeric($data['price_to'])) {
            return 'Prices must be numeric';
        }
        $from = (float) $data['price_from'];
        $to = (float) $data['price_to'];
        if ($from < 0 || $to < 0) {
            return 'Prices cannot be negative';
        }
        if ($to < $from) {
            return 'price_to must be greater than or equal to price_from';
        }

        return null;
    }

    private function json(Response $response, int $status, array $payload): Response
    {
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
