<?php

declare(strict_types=1);

namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class SaleController
{
    public function __construct(private PDO $pdo)
    {
    }

    public function index(Request $request, Response $response): Response
    {
        $stmt = $this->pdo->query(
            'SELECT s.id, s.item_id, s.customer_name, s.quantity, s.qty_from_shop, s.qty_from_machan, s.price, s.date, i.item_name
             FROM sales s
             INNER JOIN items i ON i.id = s.item_id
             ORDER BY s.date DESC, s.id DESC'
        );

        return $this->json($response, 200, ['success' => true, 'data' => $stmt->fetchAll()]);
    }

    public function store(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody() ?? [];
        $customer = trim((string) ($data['customer_name'] ?? ''));
        $itemId = isset($data['item_id']) ? (int) $data['item_id'] : 0;
        $qtyMachan = isset($data['quantity_machan']) ? (int) $data['quantity_machan'] : 0;
        $qtyShop = isset($data['quantity_shop']) ? (int) $data['quantity_shop'] : 0;
        $quantity = $qtyMachan + $qtyShop;
        $price = $data['price'] ?? null;
        $date = trim((string) ($data['date'] ?? ''));

        if ($customer === '') {
            return $this->json($response, 422, ['success' => false, 'message' => 'customer_name is required']);
        }
        if ($itemId <= 0) {
            return $this->json($response, 422, ['success' => false, 'message' => 'item_id is required']);
        }
        if ($qtyMachan < 0 || $qtyShop < 0) {
            return $this->json($response, 422, ['success' => false, 'message' => 'Quantities cannot be negative']);
        }
        if ($quantity < 50) {
            return $this->json($response, 422, [
                'success' => false,
                'message' => 'Total quantity must be at least 50',
            ]);
        }
        if ($price === null || !is_numeric($price)) {
            return $this->json($response, 422, ['success' => false, 'message' => 'price must be numeric']);
        }
        if ((float) $price < 0) {
            return $this->json($response, 422, ['success' => false, 'message' => 'price cannot be negative']);
        }
        if ($date === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $this->json($response, 422, ['success' => false, 'message' => 'date is required (YYYY-MM-DD)']);
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'SELECT id, stock_machan, stock_shop FROM items WHERE id = ? FOR UPDATE'
            );
            $stmt->execute([$itemId]);
            $item = $stmt->fetch();
            if (!$item) {
                $this->pdo->rollBack();
                return $this->json($response, 404, ['success' => false, 'message' => 'Item not found']);
            }

            $machan = (int) $item['stock_machan'];
            $shop = (int) $item['stock_shop'];

            if ($qtyMachan > $machan) {
                $this->pdo->rollBack();
                return $this->json($response, 422, [
                    'success' => false,
                    'message' => 'Insufficient machan stock. Available: ' . $machan,
                ]);
            }
            if ($qtyShop > $shop) {
                $this->pdo->rollBack();
                return $this->json($response, 422, [
                    'success' => false,
                    'message' => 'Insufficient shop stock. Available: ' . $shop,
                ]);
            }

            $deductMachan = $qtyMachan;
            $deductShop = $qtyShop;
            $newShop = $shop - $deductShop;
            $newMachan = $machan - $deductMachan;

            $upd = $this->pdo->prepare('UPDATE items SET stock_shop = ?, stock_machan = ? WHERE id = ?');
            $upd->execute([$newShop, $newMachan, $itemId]);

            $ins = $this->pdo->prepare(
                'INSERT INTO sales (item_id, customer_name, quantity, qty_from_shop, qty_from_machan, price, date)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $ins->execute([
                $itemId,
                $customer,
                $quantity,
                $deductShop,
                $deductMachan,
                (float) $price,
                $date,
            ]);

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            return $this->json($response, 500, ['success' => false, 'message' => 'Could not save sale']);
        }

        return $this->json($response, 201, ['success' => true, 'message' => 'Sale recorded']);
    }

    public function destroy(Request $request, Response $response, array $args): Response
    {
        $id = isset($args['id']) ? (int) $args['id'] : 0;
        if ($id <= 0) {
            return $this->json($response, 422, ['success' => false, 'message' => 'Invalid sale id']);
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'SELECT id, item_id, quantity, qty_from_shop, qty_from_machan FROM sales WHERE id = ? FOR UPDATE'
            );
            $stmt->execute([$id]);
            $sale = $stmt->fetch();
            if (!$sale) {
                $this->pdo->rollBack();
                return $this->json($response, 404, ['success' => false, 'message' => 'Sale not found']);
            }

            $itemId = (int) $sale['item_id'];
            $qty = (int) $sale['quantity'];
            $fromShop = (int) $sale['qty_from_shop'];
            $fromMachan = (int) $sale['qty_from_machan'];

            if ($fromShop === 0 && $fromMachan === 0 && $qty > 0) {
                $fromShop = $qty;
            }

            $itemStmt = $this->pdo->prepare(
                'SELECT stock_machan, stock_shop FROM items WHERE id = ? FOR UPDATE'
            );
            $itemStmt->execute([$itemId]);
            $item = $itemStmt->fetch();
            if (!$item) {
                $this->pdo->rollBack();
                return $this->json($response, 404, ['success' => false, 'message' => 'Item not found']);
            }

            $newShop = (int) $item['stock_shop'] + $fromShop;
            $newMachan = (int) $item['stock_machan'] + $fromMachan;

            $upd = $this->pdo->prepare('UPDATE items SET stock_shop = ?, stock_machan = ? WHERE id = ?');
            $upd->execute([$newShop, $newMachan, $itemId]);

            $del = $this->pdo->prepare('DELETE FROM sales WHERE id = ?');
            $del->execute([$id]);

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            return $this->json($response, 500, ['success' => false, 'message' => 'Could not delete sale']);
        }

        return $this->json($response, 200, ['success' => true, 'message' => 'Sale removed']);
    }

    private function json(Response $response, int $status, array $payload): Response
    {
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
