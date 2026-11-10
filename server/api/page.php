<?php
// Serves /learn and /learn/<slug> with real titles, descriptions, canonical links, Open Graph tags,
// Article structured data and the article text already in the HTML, so Google and social apps can read it.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$indexFile = dvd_docroot() . '/index.html';
$shell = is_file($indexFile) ? (string)file_get_contents($indexFile) : '';
if ($shell === '') { http_response_code(500); echo 'Site files are missing.'; exit; }
header('Content-Type: text/html; charset=utf-8');

$e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$send = function (string $title, string $desc, string $canonical, string $robots, string $extraHead, string $bodyHtml, int $code = 200) use ($shell, $e) {
    http_response_code($code);
    if ($robots !== 'index,follow') header('X-Robots-Tag: noindex, nofollow');
    $head = '<title>' . $e($title) . '</title>' . "\n"
        . '<meta name="description" content="' . $e($desc) . '" />' . "\n"
        . '<meta name="robots" content="' . $e($robots) . '" />' . "\n"
        . ($canonical !== '' ? '<link rel="canonical" href="' . $e($canonical) . '" />' . "\n" : '') . $extraHead;
    $out = preg_replace('#<title>.*?</title>#is', '', $shell, 1) ?? $shell;
    $pos = stripos($out, '</head>');
    if ($pos !== false) $out = substr($out, 0, $pos) . $head . substr($out, $pos);
    $out = str_replace('<div id="root"></div>', '<div id="root">' . $bodyHtml . '</div>', $out);
    echo $out; exit;
};

try {
    $cfg = dvd_config(false);
    if (!$cfg) { http_response_code(200); echo $shell; exit; } // not set up yet: behave like a plain page
    $db = dvd_db(); $site = dvd_site_url(); $name = dvd_site_name();
    $type = $_GET['type'] ?? 'learn';

    if ($type === 'article') {
        $slug = (string)($_GET['slug'] ?? '');
        $st = $db->prepare('SELECT * FROM dvd_articles WHERE slug = ? AND ' . dvd_public_where());
        $st->execute([$slug, dvd_now()]); $r = $st->fetch();
        if (!$r) $send('Article not found | ' . $name, 'This article is not available.', '', 'noindex,nofollow', '', '', 404);
        $a = dvd_shape($r, true);
        $url = $site . '/learn/' . $a['slug'];
        $title = ($a['seo_title'] !== '' ? $a['seo_title'] : $a['title']) . ' | ' . $name;
        $desc = $a['seo_description'] !== '' ? $a['seo_description'] : $a['excerpt'];
        $img = $a['featured_image'] !== '' ? (str_starts_with($a['featured_image'], '/') ? $site . $a['featured_image'] : $a['featured_image']) : '';
        $isOrg = (bool)preg_match('/team|editorial|' . preg_quote($name, '/') . '/i', $a['author']);
        $ld = ['@context' => 'https://schema.org', '@type' => 'Article', 'headline' => mb_substr($a['title'], 0, 110), 'description' => $desc,
            'author' => ['@type' => $isOrg ? 'Organization' : 'Person', 'name' => $a['author']],
            'publisher' => ['@type' => 'Organization', 'name' => $name, 'url' => $site],
            'datePublished' => $a['published_at'], 'dateModified' => $a['updated_at'] ?: $a['published_at'],
            'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $url], 'url' => $url, 'inLanguage' => 'en-NG',
            'articleSection' => $a['category']];
        if ($img) $ld['image'] = [$img];
        $crumbs = ['@context' => 'https://schema.org', '@type' => 'BreadcrumbList', 'itemListElement' => [
            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => $site . '/'],
            ['@type' => 'ListItem', 'position' => 2, 'name' => 'Learn', 'item' => $site . '/learn'],
            ['@type' => 'ListItem', 'position' => 3, 'name' => $a['title'], 'item' => $url]]];
        $j = fn($x) => json_encode($x, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP);
        $extra = '<meta property="og:type" content="article" />' . "\n"
            . '<meta property="og:site_name" content="' . $e($name) . '" />' . "\n"
            . '<meta property="og:title" content="' . $e($a['seo_title'] !== '' ? $a['seo_title'] : $a['title']) . '" />' . "\n"
            . '<meta property="og:description" content="' . $e($desc) . '" />' . "\n"
            . '<meta property="og:url" content="' . $e($url) . '" />' . "\n"
            . ($img ? '<meta property="og:image" content="' . $e($img) . '" />' . "\n" : '')
            . '<meta property="article:published_time" content="' . $e($a['published_at']) . '" />' . "\n"
            . '<meta property="article:modified_time" content="' . $e($a['updated_at'] ?: $a['published_at']) . '" />' . "\n"
            . '<meta property="article:section" content="' . $e($a['category']) . '" />' . "\n"
            . '<meta name="twitter:card" content="' . ($img ? 'summary_large_image' : 'summary') . '" />' . "\n"
            . '<meta name="twitter:title" content="' . $e($a['seo_title'] !== '' ? $a['seo_title'] : $a['title']) . '" />' . "\n"
            . '<meta name="twitter:description" content="' . $e($desc) . '" />' . "\n"
            . ($img ? '<meta name="twitter:image" content="' . $e($img) . '" />' . "\n" : '')
            . '<script type="application/ld+json">' . $j($ld) . '</script>' . "\n"
            . '<script type="application/ld+json">' . $j($crumbs) . '</script>' . "\n";
        $body = '<article><p>' . $e($a['category']) . '</p><h1>' . $e($a['title']) . '</h1><p>By ' . $e($a['author']) . ' · ' . $e(gmdate('j F Y', strtotime($a['published_at']))) . ' · ' . (int)$a['reading_minutes'] . ' min read</p>'
            . ($img ? '<img src="' . $e($a['featured_image']) . '" alt="' . $e($a['featured_image_alt']) . '" />' : '') . $a['body_html'] . '</article>';
        $send($title, $desc, $url, 'index,follow', $extra, $body);
    }

    // /learn
    $rows = $db->prepare('SELECT * FROM dvd_articles WHERE ' . dvd_public_where() . ' ORDER BY published_at DESC LIMIT 24');
    $rows->execute([dvd_now()]);
    $list = '<h1>Learn about shares, dividends and the Nigerian market</h1><ul>';
    foreach ($rows->fetchAll() as $r) $list .= '<li><a href="/learn/' . $e($r['slug']) . '">' . $e($r['title']) . '</a> - ' . $e($r['excerpt']) . '</li>';
    $list .= '</ul>';
    $title = 'Learn about shares, dividends and the Nigerian market | ' . $name;
    $desc = 'Plain-English guides to owning shares, dividends, the Nigerian Exchange and how the market works, plus free dividend and bond tools.';
    $url = $site . '/learn';
    $extra = '<meta property="og:type" content="website" />' . "\n" . '<meta property="og:site_name" content="' . $e($name) . '" />' . "\n"
        . '<meta property="og:title" content="' . $e($title) . '" />' . "\n" . '<meta property="og:description" content="' . $e($desc) . '" />' . "\n"
        . '<meta property="og:url" content="' . $e($url) . '" />' . "\n" . '<meta name="twitter:card" content="summary" />' . "\n";
    $send($title, $desc, $url, 'index,follow', $extra, $list);
} catch (Throwable $ex) {
    error_log('Dividendii page error: ' . $ex->getMessage());
    http_response_code(200); echo $shell; // never take the site down because of the article system
}
