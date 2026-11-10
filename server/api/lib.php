<?php
// Dividendii article system: shared helpers. Not reachable from the web (see api/.htaccess).
declare(strict_types=1);

function dvd_is_https(): bool {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}
function dvd_is_local(): bool {
    $h = strtolower(preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')));
    return in_array($h, ['localhost', '127.0.0.1', '[::1]'], true);
}

function dvd_docroot(): string { return dirname(__DIR__); }

function dvd_config_paths(): array {
    return [dirname(dvd_docroot()) . '/dividendii-config.php', __DIR__ . '/config.local.php'];
}

function dvd_config(bool $required = true): ?array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $env = getenv('DVD_CONFIG');
    $paths = $env ? [$env] : dvd_config_paths();
    foreach ($paths as $p) {
        if (is_file($p)) { $c = require $p; if (is_array($c)) return $cfg = $c; }
    }
    if ($required) { dvd_fail('The article system is not set up yet. Open /api/install.php once to set it up.', 503); }
    return null;
}

function dvd_db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = dvd_config();
    $opts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];
    if (($c['driver'] ?? 'mysql') === 'sqlite') {
        $pdo = new PDO('sqlite:' . $c['sqlite_path'], null, null, $opts);
        $pdo->exec('PRAGMA foreign_keys = ON');
    } else {
        $pdo = new PDO('mysql:host=' . $c['db_host'] . ';dbname=' . $c['db_name'] . ';charset=utf8mb4', $c['db_user'], $c['db_pass'], $opts);
    }
    return $pdo;
}

function dvd_is_sqlite(): bool { return (dvd_config()['driver'] ?? 'mysql') === 'sqlite'; }

function dvd_site_url(): string {
    $c = dvd_config(false);
    $u = $c['site_url'] ?? '';
    if ($u === '') { $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'); $u = ($https ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost'); }
    return rtrim($u, '/');
}
function dvd_site_name(): string { return (dvd_config(false)['site_name'] ?? 'Dividendii'); }


// ---------- proxy awareness (the website on Vercel forwards /api/v1 requests here) ----------
function dvd_client_ip(): string {
    $xff = (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
    if ($xff !== '') {
        $first = trim(explode(',', $xff)[0]);
        if (filter_var($first, FILTER_VALIDATE_IP)) return $first;
    }
    return substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 64);
}
function dvd_allowed_hosts(): array {
    $c = dvd_config(false) ?: [];
    $hosts = [];
    $own = parse_url(dvd_site_url(), PHP_URL_HOST);
    if ($own) { $own = strtolower($own); $hosts[] = $own; $hosts[] = str_starts_with($own, 'www.') ? substr($own, 4) : 'www.' . $own; }
    foreach ((array)($c['allowed_hosts'] ?? []) as $h) if (is_string($h) && $h !== '') $hosts[] = strtolower($h);
    $hosts[] = strtolower(preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')));
    if (dvd_is_local()) $hosts[] = 'localhost';
    return array_values(array_unique($hosts));
}
// Browsers always send Origin on form/fetch writes. If it names a site that is not ours, refuse.
function dvd_origin_ok(): bool {
    $o = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($o === '' || $o === 'null') return true;
    $h = parse_url($o, PHP_URL_HOST);
    return $h && in_array(strtolower($h), dvd_allowed_hosts(), true);
}

// ---------- responses ----------
function dvd_json($data, int $code = 200, bool $cache = false): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header($cache ? 'Cache-Control: public, max-age=0, s-maxage=30' : 'Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function dvd_fail(string $msg, int $code = 400, array $fields = []): never {
    dvd_json(['error' => ['message' => $msg, 'fields' => (object)$fields]], $code);
}
function dvd_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) return [];
    $d = json_decode($raw, true);
    if (!is_array($d)) dvd_fail('Invalid request body.', 400);
    return $d;
}

// ---------- schema ----------
function dvd_schema(string $driver): array {
    if ($driver === 'sqlite') {
        $pk = 'INTEGER PRIMARY KEY AUTOINCREMENT'; $text = 'TEXT'; $long = 'TEXT'; $tail = '';
    } else {
        $pk = 'INT UNSIGNED AUTO_INCREMENT PRIMARY KEY'; $text = 'VARCHAR(255)'; $long = 'MEDIUMTEXT'; $tail = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    }
    return [
        "CREATE TABLE IF NOT EXISTS dvd_articles (
            id $pk,
            slug VARCHAR(120) NOT NULL UNIQUE,
            title VARCHAR(200) NOT NULL,
            excerpt VARCHAR(400) NOT NULL DEFAULT '',
            body_html $long NOT NULL,
            body_text $long NOT NULL,
            featured_image $text NOT NULL DEFAULT '',
            featured_image_alt VARCHAR(200) NOT NULL DEFAULT '',
            author VARCHAR(120) NOT NULL DEFAULT '',
            category VARCHAR(60) NOT NULL DEFAULT '',
            seo_title VARCHAR(120) NOT NULL DEFAULT '',
            seo_description VARCHAR(255) NOT NULL DEFAULT '',
            status VARCHAR(12) NOT NULL DEFAULT 'draft',
            published_at DATETIME NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )$tail",
        "CREATE INDEX idx_dvd_articles_status ON dvd_articles (status, published_at)",
        "CREATE TABLE IF NOT EXISTS dvd_admins (
            id $pk,
            email VARCHAR(190) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL
        )$tail",
        "CREATE TABLE IF NOT EXISTS dvd_login_attempts (
            id $pk,
            ip VARCHAR(64) NOT NULL,
            created_at DATETIME NOT NULL
        )$tail",
    ];
}
function dvd_create_tables(PDO $pdo, string $driver): void {
    foreach (dvd_schema($driver) as $sql) {
        try { $pdo->exec($sql); } catch (PDOException $e) {
            // CREATE INDEX has no IF NOT EXISTS on MySQL: ignore "duplicate key name" on re-runs.
            if (!str_contains($sql, 'CREATE INDEX')) throw $e;
        }
    }
}
function dvd_now(): string { return gmdate('Y-m-d H:i:s'); }

// ---------- text helpers ----------
function dvd_slugify(string $s): string {
    $s = str_replace(['&', '₦'], [' and ', ' naira '], $s);
    $t = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
    if ($t !== false && $t !== '') $s = $t;
    $s = strtolower($s);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
    return trim($s, '-');
}
function dvd_plain(string $html): string {
    $t = html_entity_decode(strip_tags(str_replace(['</p>', '</h2>', '</h3>', '</h4>', '</li>', '<br>', '<br/>'], ' ', $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace('/\s+/u', ' ', $t) ?? '');
}
function dvd_reading_minutes(string $html): int {
    $n = preg_match_all('/\S+/u', dvd_plain($html));
    return max(1, (int)ceil($n / 200));
}
function dvd_iso(?string $utc): ?string { return $utc ? gmdate('Y-m-d\TH:i:s\Z', strtotime($utc . ' UTC')) : null; }
function dvd_parse_date(?string $s): ?string {
    if ($s === null || trim($s) === '') return null;
    try { return (new DateTimeImmutable($s))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s'); }
    catch (Exception) { return null; }
}

// ---------- HTML sanitiser (whitelist) ----------
function dvd_sanitize_html(string $html): string {
    $html = trim($html);
    if ($html === '') return '';
    $doc = new DOMDocument('1.0', 'UTF-8');
    libxml_use_internal_errors(true);
    $doc->loadHTML('<?xml encoding="UTF-8"><body><div id="dvd-root">' . $html . '</div></body>', LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    $xp = new DOMXPath($doc);
    $rootList = $xp->query('//div[@id="dvd-root"]');
    if (!$rootList || !$rootList->length) return '';
    $root = $rootList->item(0);
    dvd_clean_children($root, $doc);
    dvd_wrap_inline($root, $doc);
    dvd_drop_empty($root);
    dvd_heading_ids($root);
    $out = '';
    foreach (iterator_to_array($root->childNodes) as $n) $out .= $doc->saveHTML($n);
    return trim($out);
}
function dvd_clean_children(DOMNode $parent, DOMDocument $doc): void {
    static $drop = ['script','style','iframe','object','embed','form','input','button','textarea','select','option','svg','math','link','meta','base','noscript','template','head','title','audio','video','canvas','frame','frameset'];
    static $keep = ['p','h2','h3','h4','ul','ol','li','a','strong','em','u','blockquote','img','br','hr','figure','figcaption','table','thead','tbody','tr','th','td','sup','sub'];
    static $rename = ['h1' => 'h2', 'h5' => 'h4', 'h6' => 'h4', 'b' => 'strong', 'i' => 'em'];
    foreach (iterator_to_array($parent->childNodes) as $child) {
        if ($child instanceof DOMText) continue;
        if (!($child instanceof DOMElement)) { $parent->removeChild($child); continue; }
        $tag = strtolower($child->nodeName);
        if (in_array($tag, $drop, true)) { $parent->removeChild($child); continue; }
        if (isset($rename[$tag])) {
            $new = $doc->createElement($rename[$tag]);
            while ($child->firstChild) $new->appendChild($child->firstChild);
            $parent->replaceChild($new, $child); $child = $new; $tag = $rename[$tag];
        }
        if (!in_array($tag, $keep, true)) { // unknown wrapper (div, span, font, section...): keep its content only
            dvd_clean_children($child, $doc);
            while ($child->firstChild) $parent->insertBefore($child->firstChild, $child);
            $parent->removeChild($child);
            continue;
        }
        dvd_clean_attrs($child);
        if ($tag === 'a' && !$child->hasAttribute('href')) { // unsafe link: keep the text only
            dvd_clean_children($child, $doc);
            while ($child->firstChild) $parent->insertBefore($child->firstChild, $child);
            $parent->removeChild($child);
            continue;
        }
        if ($tag === 'img' && !$child->hasAttribute('src')) { $parent->removeChild($child); continue; }
        dvd_clean_children($child, $doc);
    }
}
function dvd_safe_url(string $u, bool $image): ?string {
    $u = trim($u);
    if ($u === '' || preg_match('/[\x00-\x1F\x7F]/', $u)) return null;
    if ($image) {
        if (preg_match('#^/uploads/[A-Za-z0-9/_\-.]+$#', $u) && !str_contains($u, '..')) return $u;
        return preg_match('#^https://[^\s"\'<>]+$#i', $u) ? $u : null;
    }
    if (preg_match('#^(https?://|mailto:|tel:)[^\s"\'<>]+$#i', $u)) return $u;
    if (preg_match('#^(/[^\s"\'<>/][^\s"\'<>]*|/|\#[A-Za-z0-9_\-]+)$#', $u)) return $u;
    return null;
}
function dvd_clean_attrs(DOMElement $el): void {
    $tag = strtolower($el->nodeName);
    $attrs = [];
    foreach ($el->attributes as $a) $attrs[strtolower($a->nodeName)] = $a->nodeValue;
    foreach (array_keys($attrs) as $name) $el->removeAttribute($name);
    if ($tag === 'a') {
        $href = isset($attrs['href']) ? dvd_safe_url($attrs['href'], false) : null;
        if ($href !== null) {
            $el->setAttribute('href', $href);
            if (!empty($attrs['title'])) $el->setAttribute('title', mb_substr($attrs['title'], 0, 200));
            $host = parse_url($href, PHP_URL_HOST);
            $own = parse_url(dvd_site_url(), PHP_URL_HOST);
            if ($host && $own && strcasecmp(preg_replace('/^www\./i', '', $host), preg_replace('/^www\./i', '', $own)) !== 0) {
                $el->setAttribute('target', '_blank'); $el->setAttribute('rel', 'noopener noreferrer nofollow');
            }
        }
    } elseif ($tag === 'img') {
        $src = isset($attrs['src']) ? dvd_safe_url($attrs['src'], true) : null;
        if ($src !== null) {
            $el->setAttribute('src', $src);
            $el->setAttribute('alt', mb_substr($attrs['alt'] ?? '', 0, 200));
            $el->setAttribute('loading', 'lazy');
            foreach (['width', 'height'] as $d) if (isset($attrs[$d]) && ctype_digit($attrs[$d]) && (int)$attrs[$d] <= 4000) $el->setAttribute($d, $attrs[$d]);
        }
    }
}
function dvd_wrap_inline(DOMElement $root, DOMDocument $doc): void {
    static $block = ['p','h2','h3','h4','ul','ol','blockquote','figure','hr','table'];
    $run = [];
    $flush = function () use (&$run, $root, $doc) {
        if (!$run) return;
        $has = false;
        foreach ($run as $n) { if (($n instanceof DOMText && trim($n->nodeValue) !== '') || ($n instanceof DOMElement && strtolower($n->nodeName) !== 'br')) $has = true; }
        if ($has) {
            $p = $doc->createElement('p');
            $root->insertBefore($p, $run[0]);
            foreach ($run as $n) $p->appendChild($n);
        } else { foreach ($run as $n) $root->removeChild($n); }
        $run = [];
    };
    foreach (iterator_to_array($root->childNodes) as $n) {
        if ($n instanceof DOMElement && in_array(strtolower($n->nodeName), $block, true)) $flush(); else $run[] = $n;
    }
    $flush();
}
function dvd_drop_empty(DOMElement $root): void {
    foreach (iterator_to_array($root->childNodes) as $n) {
        if ($n instanceof DOMElement && in_array(strtolower($n->nodeName), ['p','h2','h3','h4','blockquote'], true)) {
            if (trim($n->textContent) === '' && $n->getElementsByTagName('img')->length === 0) $root->removeChild($n);
        }
    }
}
function dvd_heading_ids(DOMElement $root): void {
    $used = [];
    foreach (iterator_to_array($root->getElementsByTagName('*')) as $el) {
        if (!in_array(strtolower($el->nodeName), ['h2', 'h3'], true)) continue;
        $base = dvd_slugify($el->textContent) ?: 'section';
        $id = $base; $i = 2;
        while (isset($used[$id])) $id = $base . '-' . $i++;
        $used[$id] = true; $el->setAttribute('id', $id);
    }
}
function dvd_toc(string $html): array {
    $toc = [];
    if (preg_match_all('#<h([23]) id="([a-z0-9\-]+)">(.*?)</h\1>#is', $html, $m, PREG_SET_ORDER)) {
        foreach ($m as $x) $toc[] = ['level' => (int)$x[1], 'id' => $x[2], 'text' => trim(html_entity_decode(strip_tags($x[3]), ENT_QUOTES | ENT_HTML5, 'UTF-8'))];
    }
    return $toc;
}

// ---------- article shaping ----------
function dvd_category_slug(string $c): string { return dvd_slugify($c); }
function dvd_shape(array $r, bool $full = false, bool $admin = false): array {
    $o = [
        'id' => (int)$r['id'], 'slug' => $r['slug'], 'title' => $r['title'], 'excerpt' => $r['excerpt'],
        'featured_image' => $r['featured_image'], 'featured_image_alt' => $r['featured_image_alt'],
        'author' => $r['author'], 'category' => $r['category'], 'category_slug' => dvd_category_slug($r['category']),
        'published_at' => dvd_iso($r['published_at']), 'updated_at' => dvd_iso($r['updated_at']),
        'reading_minutes' => dvd_reading_minutes($r['body_html']),
        'seo_title' => $r['seo_title'], 'seo_description' => $r['seo_description'],
    ];
    if ($admin) { $o['status'] = $r['status']; $o['created_at'] = dvd_iso($r['created_at']); }
    if ($full) { $o['body_html'] = $r['body_html']; $o['toc'] = dvd_toc($r['body_html']); }
    return $o;
}
function dvd_public_where(): string { return "status = 'published' AND published_at IS NOT NULL AND published_at <= ?"; }

// ---------- admin session ----------
function dvd_session_start(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $https = dvd_is_https();
    session_name('dvd_admin');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax']);
    ini_set('session.use_strict_mode', '1');
    session_start();
    if (!empty($_SESSION['uid']) && time() - ($_SESSION['seen'] ?? 0) > 12 * 3600) { $_SESSION = []; }
    if (!empty($_SESSION['uid'])) $_SESSION['seen'] = time();
}
function dvd_admin_required(bool $write): array {
    dvd_session_start();
    if (empty($_SESSION['uid'])) dvd_fail('Please sign in.', 401);
    if ($write) {
        if (!dvd_origin_ok()) dvd_fail('Blocked.', 403);
        $tok = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!is_string($tok) || !hash_equals((string)($_SESSION['csrf'] ?? ''), $tok)) dvd_fail('Your session expired. Reload the page and try again.', 403);
        if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin') === 'cross-site') dvd_fail('Blocked.', 403);
    }
    return ['id' => (int)$_SESSION['uid'], 'email' => (string)($_SESSION['email'] ?? '')];
}
