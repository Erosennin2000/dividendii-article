<?php
// Dividendii article API. Reached at /api/v1/... (see .htaccess). Browsers reach it through the website's /api/v1 proxy.
declare(strict_types=1);
require __DIR__ . '/lib.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$route = trim((string)($_GET['route'] ?? ''), '/');
$parts = $route === '' ? [] : explode('/', $route);

try {
    if (($parts[0] ?? '') === 'admin') { dvd_admin_routes($method, array_slice($parts, 1)); }
    dvd_public_routes($method, $parts);
} catch (PDOException $e) {
    error_log('Dividendii DB error: ' . $e->getMessage());
    dvd_fail('Database problem. Please try again.', 500);
}

// =================== PUBLIC ===================
function dvd_public_routes(string $method, array $p): never {
    if ($method !== 'GET') dvd_fail('Method not allowed.', 405);
    $db = dvd_db(); $now = dvd_now();
    if (($p[0] ?? '') === 'articles' && count($p) === 1) {
        $page = max(1, (int)($_GET['page'] ?? 1)); $per = 12;
        $where = [dvd_public_where()]; $args = [$now];
        $q = trim((string)($_GET['q'] ?? ''));
        if ($q !== '') {
            $like = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_substr($q, 0, 80)) . '%';
            $where[] = "(title LIKE ? ESCAPE '!' OR excerpt LIKE ? ESCAPE '!' OR body_text LIKE ? ESCAPE '!')";
            array_push($args, $like, $like, $like);
        }
        $cat = trim((string)($_GET['category'] ?? ''));
        $rows = $db->prepare('SELECT * FROM dvd_articles WHERE ' . implode(' AND ', $where) . ' ORDER BY published_at DESC, id DESC');
        $rows->execute($args);
        $all = $rows->fetchAll();
        if ($cat !== '') $all = array_values(array_filter($all, fn($r) => dvd_category_slug($r['category']) === $cat));
        $total = count($all);
        $slice = array_slice($all, ($page - 1) * $per, $per);
        dvd_json(['data' => array_map(fn($r) => dvd_shape($r), $slice), 'meta' => ['total' => $total, 'page' => $page, 'per_page' => $per]], 200, true);
    }
    if (($p[0] ?? '') === 'categories') {
        $st = $db->prepare('SELECT category, COUNT(*) AS n FROM dvd_articles WHERE ' . dvd_public_where() . " AND category <> '' GROUP BY category ORDER BY category");
        $st->execute([$now]);
        dvd_json(['data' => array_map(fn($r) => ['name' => $r['category'], 'slug' => dvd_category_slug($r['category']), 'count' => (int)$r['n']], $st->fetchAll())], 200, true);
    }
    if (($p[0] ?? '') === 'articles' && count($p) === 2) {
        $slug = $p[1];
        if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) dvd_fail('Article not found.', 404);
        $st = $db->prepare('SELECT * FROM dvd_articles WHERE slug = ? AND ' . dvd_public_where());
        $st->execute([$slug, $now]);
        $r = $st->fetch();
        if (!$r) dvd_fail('Article not found.', 404);
        dvd_json(['data' => dvd_shape($r, true), 'related' => array_map(fn($x) => dvd_shape($x), dvd_related($db, $r, 3))], 200, true);
    }
    dvd_fail('Not found.', 404);
}
function dvd_related(PDO $db, array $r, int $n): array {
    $st = $db->prepare('SELECT * FROM dvd_articles WHERE ' . dvd_public_where() . ' AND id <> ? ORDER BY published_at DESC');
    $st->execute([dvd_now(), $r['id']]);
    $rows = $st->fetchAll();
    usort($rows, fn($a, $b) => (($b['category'] === $r['category']) <=> ($a['category'] === $r['category'])));
    return array_slice($rows, 0, $n);
}

// =================== ADMIN ===================
function dvd_admin_routes(string $method, array $p): never {
    $db = dvd_db();
    $a0 = $p[0] ?? '';

    if ($a0 === 'login' && $method === 'POST') {
        if (!dvd_is_https() && !dvd_is_local()) dvd_fail('For your safety, sign in over https. Open https://' . ($_SERVER['HTTP_HOST'] ?? 'your-site') . '/admin/articles instead.', 403);
        if (!dvd_origin_ok()) dvd_fail('Blocked.', 403);
        dvd_session_start();
        $b = dvd_body();
        $email = strtolower(trim((string)($b['email'] ?? ''))); $pw = (string)($b['password'] ?? '');
        $ip = dvd_client_ip();
        $db->prepare('DELETE FROM dvd_login_attempts WHERE created_at < ?')->execute([gmdate('Y-m-d H:i:s', time() - 86400)]);
        $cnt = $db->prepare('SELECT COUNT(*) FROM dvd_login_attempts WHERE ip = ? AND created_at > ?');
        $cnt->execute([$ip, gmdate('Y-m-d H:i:s', time() - 900)]);
        if ((int)$cnt->fetchColumn() >= 8) dvd_fail('Too many attempts. Wait 15 minutes and try again.', 429);
        // Overall cap too, in case someone reaches this server directly and fakes their address.
        $all = $db->prepare('SELECT COUNT(*) FROM dvd_login_attempts WHERE created_at > ?');
        $all->execute([gmdate('Y-m-d H:i:s', time() - 900)]);
        if ((int)$all->fetchColumn() >= 40) dvd_fail('Too many attempts. Wait 15 minutes and try again.', 429);
        $st = $db->prepare('SELECT * FROM dvd_admins WHERE email = ?'); $st->execute([$email]); $u = $st->fetch();
        $hash = $u['password_hash'] ?? password_hash('dummy-password-for-timing', PASSWORD_DEFAULT);
        $ok = password_verify($pw, $hash) && $u;
        if (!$ok) {
            $db->prepare('INSERT INTO dvd_login_attempts (ip, created_at) VALUES (?, ?)')->execute([$ip, dvd_now()]);
            usleep(300000);
            dvd_fail('Email or password is not right.', 401);
        }
        $db->prepare('DELETE FROM dvd_login_attempts WHERE ip = ?')->execute([$ip]);
        session_regenerate_id(true);
        $_SESSION = ['uid' => (int)$u['id'], 'email' => $u['email'], 'csrf' => bin2hex(random_bytes(32)), 'seen' => time()];
        dvd_json(['data' => ['email' => $u['email'], 'csrf' => $_SESSION['csrf']]]);
    }
    if ($a0 === 'me' && $method === 'GET') {
        dvd_session_start();
        if (empty($_SESSION['uid'])) dvd_json(['data' => null]);
        dvd_json(['data' => ['email' => $_SESSION['email'], 'csrf' => $_SESSION['csrf']]]);
    }
    if ($a0 === 'logout' && $method === 'POST') {
        dvd_admin_required(true);
        $_SESSION = []; session_destroy();
        dvd_json(['data' => true]);
    }

    $admin = dvd_admin_required($method !== 'GET');

    if ($a0 === 'password' && $method === 'POST') {
        $b = dvd_body(); $cur = (string)($b['current'] ?? ''); $new = (string)($b['new'] ?? '');
        if (mb_strlen($new) < 10) dvd_fail('Use at least 10 characters.', 422, ['new' => 'At least 10 characters.']);
        $st = $db->prepare('SELECT * FROM dvd_admins WHERE id = ?'); $st->execute([$admin['id']]); $u = $st->fetch();
        if (!$u || !password_verify($cur, $u['password_hash'])) dvd_fail('Current password is not right.', 422, ['current' => 'Not right.']);
        $db->prepare('UPDATE dvd_admins SET password_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $admin['id']]);
        dvd_json(['data' => true]);
    }

    if ($a0 === 'upload' && $method === 'POST') dvd_handle_upload();

    if ($a0 === 'articles') {
        $id = isset($p[1]) ? (int)$p[1] : 0;
        $action = $p[2] ?? '';
        if (!isset($p[1]) && $method === 'GET') {
            $rows = $db->query('SELECT * FROM dvd_articles ORDER BY updated_at DESC')->fetchAll();
            dvd_json(['data' => array_map(fn($r) => dvd_shape($r, false, true), $rows), 'categories' => dvd_all_categories($db)]);
        }
        if (!isset($p[1]) && $method === 'POST') { dvd_json(['data' => dvd_save($db, 0, dvd_body())], 201); }
        if ($id > 0 && $action === '' && $method === 'GET') {
            $st = $db->prepare('SELECT * FROM dvd_articles WHERE id = ?'); $st->execute([$id]); $r = $st->fetch();
            if (!$r) dvd_fail('Article not found.', 404);
            dvd_json(['data' => dvd_shape($r, true, true)]);
        }
        if ($id > 0 && $action === '' && $method === 'PUT') { dvd_json(['data' => dvd_save($db, $id, dvd_body())]); }
        if ($id > 0 && in_array($action, ['publish', 'unpublish'], true) && $method === 'POST') { dvd_json(['data' => dvd_set_status($db, $id, $action === 'publish')]); }
    }
    dvd_fail('Not found.', 404);
}
function dvd_all_categories(PDO $db): array {
    $r = $db->query("SELECT DISTINCT category FROM dvd_articles WHERE category <> '' ORDER BY category")->fetchAll(PDO::FETCH_COLUMN);
    return array_values(array_unique(array_merge(['Share basics', 'The market', 'Dividends', 'Investing basics'], $r)));
}
function dvd_clean_str($v, int $max): string {
    $v = is_string($v) ? trim(preg_replace('/\s+/u', ' ', strip_tags($v)) ?? '') : '';
    return mb_substr($v, 0, $max);
}
function dvd_validate(PDO $db, int $id, array $b): array {
    $err = [];
    $title = dvd_clean_str($b['title'] ?? '', 200);
    if ($title === '') $err['title'] = 'Add a title.';
    $slug = dvd_slugify((string)($b['slug'] ?? ''));
    if ($slug === '') $slug = dvd_slugify($title);
    $slug = substr($slug, 0, 120);
    if ($slug === '') $err['slug'] = 'Add a URL slug.';
    elseif (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) $err['slug'] = 'Use only lowercase letters, numbers and hyphens.';
    else {
        $st = $db->prepare('SELECT id FROM dvd_articles WHERE slug = ? AND id <> ?'); $st->execute([$slug, $id]);
        if ($st->fetch()) $err['slug'] = 'Another article already uses this slug.';
    }
    $img = trim((string)($b['featured_image'] ?? ''));
    if ($img !== '' && dvd_safe_url($img, true) === null) $err['featured_image'] = 'Use an uploaded image or an https image address.';
    $body = dvd_sanitize_html((string)($b['body_html'] ?? ''));
    $row = [
        'slug' => $slug, 'title' => $title,
        'excerpt' => dvd_clean_str($b['excerpt'] ?? '', 400),
        'body_html' => $body, 'body_text' => dvd_plain($body),
        'featured_image' => $img, 'featured_image_alt' => dvd_clean_str($b['featured_image_alt'] ?? '', 200),
        'author' => dvd_clean_str($b['author'] ?? '', 120) ?: dvd_site_name() . ' Team',
        'category' => dvd_clean_str($b['category'] ?? '', 60),
        'seo_title' => dvd_clean_str($b['seo_title'] ?? '', 120),
        'seo_description' => dvd_clean_str($b['seo_description'] ?? '', 255),
        'published_at' => dvd_parse_date($b['published_at'] ?? null),
    ];
    if ($err) dvd_fail('Please fix the highlighted fields.', 422, $err);
    return $row;
}
function dvd_save(PDO $db, int $id, array $b): array {
    $row = dvd_validate($db, $id, $b); $now = dvd_now();
    if ($id === 0) {
        $row += ['status' => 'draft', 'created_at' => $now, 'updated_at' => $now];
        $cols = array_keys($row);
        $db->prepare('INSERT INTO dvd_articles (' . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')')->execute(array_values($row));
        $id = (int)$db->lastInsertId();
    } else {
        $st = $db->prepare('SELECT id FROM dvd_articles WHERE id = ?'); $st->execute([$id]);
        if (!$st->fetch()) dvd_fail('Article not found.', 404);
        $row['updated_at'] = $now;
        $set = implode(',', array_map(fn($c) => "$c = ?", array_keys($row)));
        $db->prepare("UPDATE dvd_articles SET $set WHERE id = ?")->execute([...array_values($row), $id]);
    }
    $st = $db->prepare('SELECT * FROM dvd_articles WHERE id = ?'); $st->execute([$id]);
    return dvd_shape($st->fetch(), true, true);
}
function dvd_set_status(PDO $db, int $id, bool $publish): array {
    $st = $db->prepare('SELECT * FROM dvd_articles WHERE id = ?'); $st->execute([$id]); $r = $st->fetch();
    if (!$r) dvd_fail('Article not found.', 404);
    $now = dvd_now();
    if ($publish) {
        $err = [];
        if (trim($r['title']) === '') $err['title'] = 'Add a title.';
        if (trim($r['excerpt']) === '') $err['excerpt'] = 'Add a short excerpt before publishing.';
        if (mb_strlen($r['body_text']) < 200) $err['body_html'] = 'The article body is too short to publish.';
        if ($err) dvd_fail('This article is not ready to publish.', 422, $err);
        $db->prepare("UPDATE dvd_articles SET status = 'published', published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?")->execute([$now, $now, $id]);
    } else {
        $db->prepare("UPDATE dvd_articles SET status = 'draft', updated_at = ? WHERE id = ?")->execute([$now, $id]);
    }
    $st->execute([$id]);
    return dvd_shape($st->fetch(), true, true);
}

function dvd_handle_upload(): never {
    $f = $_FILES['image'] ?? null;
    if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
        $msg = ($f['error'] ?? 0) === UPLOAD_ERR_INI_SIZE ? 'That file is larger than the server allows.' : 'Upload failed. Please try again.';
        dvd_fail($msg, 400);
    }
    if ($f['size'] > 6 * 1024 * 1024) dvd_fail('Images must be under 6 MB.', 413);
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $map = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($map[$mime])) dvd_fail('Use a JPG, PNG, WebP or GIF image.', 415);
    $info = @getimagesize($f['tmp_name']);
    if (!$info || $info[0] < 1 || $info[1] < 1 || $info[0] > 8000 || $info[1] > 8000) dvd_fail('That image could not be read or is too large.', 415);
    $dir = dvd_docroot() . '/uploads/articles/' . gmdate('Y') . '/' . gmdate('m');
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) dvd_fail('The uploads folder is not writable. Check folder permissions.', 500);
    $ext = $map[$mime]; $name = bin2hex(random_bytes(10)) . '.' . $ext; $dest = $dir . '/' . $name;
    $done = false;
    if ($mime !== 'image/gif' && function_exists('imagecreatefromstring')) { // re-encode: strips metadata and any hidden payload, caps width
        $im = @imagecreatefromstring((string)file_get_contents($f['tmp_name']));
        if ($im) {
            $w = imagesx($im); $h = imagesy($im);
            if ($w > 2000) { $im2 = imagescale($im, 2000); if ($im2) { $im = $im2; } }
            if ($mime === 'image/png' || $mime === 'image/webp') { imagealphablending($im, false); imagesavealpha($im, true); }
            $done = match ($mime) { 'image/jpeg' => imagejpeg($im, $dest, 85), 'image/png' => imagepng($im, $dest, 6), 'image/webp' => function_exists('imagewebp') ? imagewebp($im, $dest, 85) : false, default => false };
        }
    }
    if (!$done && !move_uploaded_file($f['tmp_name'], $dest)) dvd_fail('Could not save the image.', 500);
    @chmod($dest, 0644);
    dvd_json(['data' => ['url' => '/uploads/articles/' . gmdate('Y') . '/' . gmdate('m') . '/' . $name]], 201);
}
