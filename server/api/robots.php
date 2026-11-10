<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('Content-Type: text/plain; charset=utf-8');
echo "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /app/\nDisallow: /signin\nDisallow: /signup\n\nSitemap: " . dvd_site_url() . "/sitemap.xml\n";
