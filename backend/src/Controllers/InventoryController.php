<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\ItemSearch;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class InventoryController
{
    public function __construct(private PDO $pdo)
    {
    }

    public function index(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $query = trim((string) ($params['query'] ?? ''));

        $stmt = $this->pdo->query(
            'SELECT i.id, i.item_name, i.stock_machan, i.stock_shop, i.price_from, i.price_to,
                    COALESCE(SUM(s.quantity), 0) AS sold_quantity
             FROM items i
             LEFT JOIN sales s ON s.item_id = i.id
             GROUP BY i.id, i.item_name, i.stock_machan, i.stock_shop, i.price_from, i.price_to
             ORDER BY i.id DESC'
        );
        $rows = $stmt->fetchAll();

        $lastSales = $this->lastSalesByItemId();

        $out = [];
        foreach ($rows as $row) {
            $id = (int) $row['id'];
            $machan = (int) $row['stock_machan'];
            $shop = (int) $row['stock_shop'];
            $totalStock = $machan + $shop;
            $soldQty = (int) $row['sold_quantity'];
            $from = (float) $row['price_from'];
            $to = (float) $row['price_to'];
            $avg = ($from + $to) / 2.0;
            // On-hand is already net of sales (items are updated when sales are saved).
            $remaining = $totalStock;
            $value = $remaining * $avg;

            $item = [
                'id' => $id,
                'item_name' => $row['item_name'],
                'stock_machan' => $machan,
                'stock_shop' => $shop,
                'total_stock' => $totalStock,
                'sold_quantity' => $soldQty,
                'remaining_stock' => $remaining,
                'price_from' => round($from, 2),
                'price_to' => round($to, 2),
                'average_price' => round($avg, 2),
                'value' => round($value, 2),
                'last_sold' => $lastSales[$id] ?? null,
            ];
            $out[] = $item;
        }

        if ($query !== '') {
            $out = ItemSearch::filterItems($out, $query);
        }

        $totalInventoryValue = 0.0;
        foreach ($out as $r) {
            $totalInventoryValue += (float) $r['value'];
        }

        return $this->json($response, 200, [
            'success' => true,
            'total_inventory_value' => round($totalInventoryValue, 2),
            'data' => array_values($out),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function lastSalesByItemId(): array
    {
        $stmt = $this->pdo->query(
            'SELECT s1.item_id, s1.customer_name, s1.quantity, s1.price, s1.date, s1.qty_from_shop, s1.qty_from_machan
             FROM sales s1
             INNER JOIN (
               SELECT item_id, MAX(id) AS mid
               FROM sales
               GROUP BY item_id
             ) t ON t.item_id = s1.item_id AND t.mid = s1.id'
        );
        $map = [];
        while ($row = $stmt->fetch()) {
            $qty = (int) $row['quantity'];
            $fromShop = (int) $row['qty_from_shop'];
            $fromMachan = (int) $row['qty_from_machan'];
            if ($fromShop === 0 && $fromMachan === 0 && $qty > 0) {
                $fromShop = $qty;
            }
            $map[(int) $row['item_id']] = [
                'customer_name' => $row['customer_name'],
                'quantity' => $qty,
                'qty_from_shop' => $fromShop,
                'qty_from_machan' => $fromMachan,
                'price' => (float) $row['price'],
                'date' => $row['date'],
            ];
        }

        return $map;
    }

    private function json(Response $response, int $status, array $payload): Response
    {
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
