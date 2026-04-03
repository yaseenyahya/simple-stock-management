<?php

declare(strict_types=1);

namespace App\Helpers;

final class ItemSearch
{
    /**
     * Match if any comma-separated part of item_name contains the keyword (case-insensitive).
     */
    public static function matchesKeyword(string $itemName, string $keyword): bool
    {
        $keyword = trim($keyword);
        if ($keyword === '') {
            return true;
        }

        $parts = preg_split('/\s*,\s*/', $itemName, -1, PREG_SPLIT_NO_EMPTY);
        if ($parts === false || $parts === []) {
            return stripos($itemName, $keyword) !== false;
        }

        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }
            if (mb_stripos($part, $keyword, 0, 'UTF-8') !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array<string, mixed>>
     */
    public static function filterItems(array $items, string $keyword): array
    {
        $keyword = trim($keyword);
        if ($keyword === '') {
            return $items;
        }

        return array_values(array_filter($items, function ($row) use ($keyword) {
            $name = (string) ($row['item_name'] ?? '');
            return self::matchesKeyword($name, $keyword);
        }));
    }
}
