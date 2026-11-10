<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('Content-Type: application/xml; charset=utf-8');
$site = dvd_site_url();
$x = fn($s) => htmlspecialchars($s, ENT_XML1 | ENT_QUOTES, 'UTF-8');
$urls = [];
foreach (['/', '/check', '/invest', '/pricing', '/safety', '/learn'] as $p) $urls[] = [$site . ($p === '/' ? '/' : $p), null];
try {
    if (dvd_config(false)) {
        $st = dvd_db()->prepare('SELECT slug, updated_at FROM dvd_articles WHERE ' . dvd_public_where() . ' ORDER BY published_at DESC');
        $st->execute([dvd_now()]);
        foreach ($st->fetchAll() as $r) $urls[] = [$site . '/learn/' . $r['slug'], gmdate('Y-m-d', strtotime($r['updated_at'] . ' UTC'))];
    }
} catch (Throwable $e) { error_log('sitemap: ' . $e->getMessage()); }
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as [$u, $m]) echo '  <url><loc>' . $x($u) . '</loc>' . ($m ? '<lastmod>' . $m . '</lastmod>' : '') . '</url>' . "\n";
echo '</urlset>' . "\n";
