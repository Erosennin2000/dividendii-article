<?php
// One-time setup wizard. Open https://api.yourdomain.com/api/install.php in your browser once.
// It creates the database tables, your admin login and the 10 draft articles, then locks itself.
declare(strict_types=1);
require __DIR__ . '/lib.php';

function dvd_seed(PDO $pdo): int {
    $n = (int)$pdo->query('SELECT COUNT(*) FROM dvd_articles')->fetchColumn();
    if ($n > 0) return 0;
    $now = dvd_now(); $count = 0;
    $st = $pdo->prepare('INSERT INTO dvd_articles (slug,title,excerpt,body_html,body_text,featured_image,featured_image_alt,author,category,seo_title,seo_description,status,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    foreach (require __DIR__ . '/seed.php' as $a) {
        $body = dvd_sanitize_html($a['body']);
        $st->execute([$a['slug'], $a['title'], $a['excerpt'], $body, dvd_plain($body), '', '', dvd_site_name() . ' Team', $a['category'], '', $a['seo_description'], 'draft', null, $now, $now]);
        $count++;
    }
    return $count;
}
function dvd_set_admin(PDO $pdo, string $email, string $password): void {
    $email = strtolower(trim($email));
    $st = $pdo->prepare('SELECT id FROM dvd_admins WHERE email = ?'); $st->execute([$email]);
    if ($id = $st->fetchColumn()) $pdo->prepare('UPDATE dvd_admins SET password_hash = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
    else $pdo->prepare('INSERT INTO dvd_admins (email, password_hash, created_at) VALUES (?,?,?)')->execute([$email, password_hash($password, PASSWORD_DEFAULT), dvd_now()]);
}
function dvd_write_config(array $cfg): string {
    $paths = dvd_config_paths();
    foreach ($paths as $p) {
        $dir = dirname($p);
        if ((is_dir($dir) && is_writable($dir)) && !(is_file($p) && !is_writable($p))) {
            $php = "<?php\n// Dividendii article system settings. Keep this file private.\nreturn " . var_export($cfg, true) . ";\n";
            if (file_put_contents($p, $php, LOCK_EX) !== false) { @chmod($p, 0600); return $p; }
        }
    }
    throw new RuntimeException('Could not save the settings file. Ask your host to make the folder above public_html writable.');
}
function dvd_install(array $cfg, string $adminEmail, string $adminPassword, bool $writeConfig = true): array {
    if (($cfg['driver'] ?? 'mysql') === 'sqlite') $pdo = new PDO('sqlite:' . $cfg['sqlite_path'], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    else $pdo = new PDO('mysql:host=' . $cfg['db_host'] . ';dbname=' . $cfg['db_name'] . ';charset=utf8mb4', $cfg['db_user'], $cfg['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    dvd_create_tables($pdo, $cfg['driver'] ?? 'mysql');
    dvd_set_admin($pdo, $adminEmail, $adminPassword);
    $where = $writeConfig ? dvd_write_config($cfg) : '(not written)';
    return ['config' => $where, 'seeded' => 0, 'pdo' => $pdo];
}

if (defined('DVD_INSTALL_LIB')) return; // used by tests

// ---------------- web wizard ----------------
$existing = dvd_config(false);
$resetFile = __DIR__ . '/ALLOW_ADMIN_RESET.txt';
$mode = $existing ? (is_file($resetFile) ? 'reset' : 'locked') : 'install';
session_name('dvd_install'); session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']); session_start();
if (empty($_SESSION['t'])) $_SESSION['t'] = bin2hex(random_bytes(16));
header('X-Robots-Tag: noindex, nofollow'); header('Cache-Control: no-store');
$errors = []; $done = null;
$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
$host = preg_replace('/^api\./i', '', (string)($_SERVER['HTTP_HOST'] ?? ''));
$v = ['db_host' => 'localhost', 'db_name' => '', 'db_user' => '', 'site_url' => ($https ? 'https://' : 'http://') . $host, 'site_name' => 'Dividendii', 'email' => '', 'allowed_hosts' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $mode !== 'locked') {
    if (!hash_equals($_SESSION['t'], (string)($_POST['t'] ?? ''))) { $errors[] = 'This page expired. Reload it and try again.'; }
    else {
        foreach (['db_host', 'db_name', 'db_user', 'site_url', 'site_name', 'email', 'allowed_hosts'] as $k) $v[$k] = trim((string)($_POST[$k] ?? $v[$k]));
        $pw = (string)($_POST['password'] ?? ''); $pw2 = (string)($_POST['password2'] ?? '');
        if (!filter_var($v['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'Enter a valid email address for your admin login.';
        if (mb_strlen($pw) < 10) $errors[] = 'Choose an admin password of at least 10 characters.';
        if ($pw !== $pw2) $errors[] = 'The two passwords do not match.';
        if ($mode === 'install') {
            if (!preg_match('#^https?://[^\s/]+$#i', rtrim($v['site_url'], '/'))) $errors[] = 'The website address should look like https://www.dividendii.com';
            foreach (['db_name' => 'database name', 'db_user' => 'database user'] as $k => $l) if ($v[$k] === '') $errors[] = "Enter the $l.";
        }
        if (!$errors) {
            try {
                if ($mode === 'install') {
                    $cfg = ['driver' => 'mysql', 'db_host' => $v['db_host'], 'db_name' => $v['db_name'], 'db_user' => $v['db_user'], 'db_pass' => (string)($_POST['db_pass'] ?? ''), 'site_url' => rtrim($v['site_url'], '/'), 'site_name' => $v['site_name'] ?: 'Dividendii',
                        'allowed_hosts' => array_values(array_filter(array_map(fn($x) => strtolower(preg_replace('#^https?://|/.*$#i', '', trim($x))), explode(',', $v['allowed_hosts']))))];
                    $r = dvd_install($cfg, $v['email'], $pw);
                    // config now exists; load it for seeding
                    $r['seeded'] = dvd_seed($r['pdo']);
                    $done = ['seeded' => $r['seeded']];
                } else {
                    $pdo = dvd_db(); dvd_create_tables($pdo, dvd_config()['driver'] ?? 'mysql'); dvd_set_admin($pdo, $v['email'], $pw);
                    @unlink($resetFile); $done = ['reset' => true];
                }
            } catch (Throwable $e) {
                $m = $e->getMessage();
                if (stripos($m, 'Access denied') !== false) $m = 'The database user or password is not right, or that user has not been added to the database in cPanel.';
                elseif (stripos($m, 'Unknown database') !== false) $m = 'That database name does not exist. In cPanel the full name starts with your account prefix, for example dividend_articles.';
                $errors[] = $m;
            }
        }
    }
}
?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Set up your article system</title>
<style>body{font-family:system-ui,Segoe UI,sans-serif;background:#F5F7FA;color:#17375A;margin:0;padding:24px}main{max-width:640px;margin:0 auto;background:#fff;border:1px solid #D9DEE5;border-radius:12px;padding:28px}h1{font-size:26px;margin:0 0 6px}h2{font-size:17px;margin:26px 0 8px}p,li{line-height:1.55}label{display:block;font-weight:600;font-size:14px;margin:14px 0 6px}input{width:100%;box-sizing:border-box;height:44px;border:1px solid #D9DEE5;border-radius:8px;padding:0 12px;font-size:16px}small{color:#5B6B7F}button{margin-top:22px;height:48px;padding:0 24px;border:0;border-radius:8px;background:#295D8F;color:#fff;font-size:16px;font-weight:600;cursor:pointer}.err{background:#FDE2E0;color:#B3261E;padding:10px 14px;border-radius:8px;margin:12px 0}.ok{background:#DCEFE4;color:#1F7A4D;padding:14px;border-radius:8px}code{background:#EEF2F6;padding:1px 6px;border-radius:4px}</style></head><body><main>
<h1>Set up your article system</h1>
<?php if ($done): ?>
  <div class="ok"><strong>All done.</strong> <?= isset($done['reset']) ? 'Your admin password has been reset.' : 'Your database is ready, your admin login is created and ' . (int)$done['seeded'] . ' draft articles were added.' ?></div>
  <p><a href="<?= $h(dvd_site_url()) ?>/admin/articles"><strong>Go to your article dashboard</strong></a></p>
  <p><small>For safety, delete <code>install.php</code> from the <code>api</code> folder in cPanel File Manager. It has already locked itself and cannot be used again.</small></p>
<?php elseif ($mode === 'locked'): ?>
  <p>The article system is already set up, so this page is locked.</p><p><a href="<?= $h(dvd_site_url()) ?>/admin/articles">Go to the article dashboard</a></p>
  <p><small>Forgot your admin password? In cPanel File Manager, create an empty file called <code>ALLOW_ADMIN_RESET.txt</code> inside the <code>api</code> folder, then reload this page.</small></p>
<?php else: ?>
  <p><?= $mode === 'reset' ? 'Set a new admin login below.' : 'This takes about two minutes and you only do it once.' ?></p>
  <?php if ($mode === 'install'): ?><h2>Before you start</h2><ol><li>In cPanel, open <strong>MySQL Databases</strong>.</li><li>Create a database, then create a database user with a strong password.</li><li>Under <strong>Add User To Database</strong>, add the user to the database and tick <strong>All Privileges</strong>.</li></ol><?php endif; ?>
  <?php if (!$https && !dvd_is_local()): ?><div class="err"><strong>This page is not secure.</strong> You are about to type passwords over plain http. In cPanel, open <em>SSL/TLS Status</em> and run the free AutoSSL, then reload this page using https://.</div><?php endif; ?>
  <?php foreach ($errors as $e): ?><div class="err"><?= $h($e) ?></div><?php endforeach; ?>
  <form method="post" autocomplete="off"><input type="hidden" name="t" value="<?= $h($_SESSION['t']) ?>">
  <?php if ($mode === 'install'): ?>
    <h2>Database</h2>
    <label>Database name <small>(full name, e.g. dividend_articles)</small></label><input name="db_name" value="<?= $h($v['db_name']) ?>" required>
    <label>Database user <small>(full name, e.g. dividend_admin)</small></label><input name="db_user" value="<?= $h($v['db_user']) ?>" required>
    <label>Database password</label><input name="db_pass" type="password" autocomplete="new-password">
    <label>Database host <small>(leave as localhost)</small></label><input name="db_host" value="<?= $h($v['db_host']) ?>" required>
    <h2>Your website</h2>
    <label>Website address</label><input name="site_url" value="<?= $h($v['site_url']) ?>" required>
    <label>Site name</label><input name="site_name" value="<?= $h($v['site_name']) ?>" required>
    <label>Other addresses you may open the admin from <small>(optional, comma separated, e.g. vendii-securities.vercel.app)</small></label><input name="allowed_hosts" value="<?= $h($v['allowed_hosts']) ?>">
  <?php endif; ?>
    <h2>Your admin login</h2>
    <label>Email address</label><input name="email" type="email" value="<?= $h($v['email']) ?>" required>
    <label>Password <small>(at least 10 characters)</small></label><input name="password" type="password" autocomplete="new-password" required>
    <label>Repeat password</label><input name="password2" type="password" autocomplete="new-password" required>
    <button type="submit"><?= $mode === 'reset' ? 'Reset password' : 'Set everything up' ?></button>
  </form>
<?php endif; ?>
</main></body></html>
