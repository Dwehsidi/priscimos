<?php
/**
 * Quote request handler for priscimosenterprise.net
 * Priscimos Enterprise Solutions LLC (DBA PEG Solutions)
 *
 * Works on any PHP 7.4+ host with mail() enabled (cPanel, Hostinger, GoDaddy, Namecheap...).
 * The website's JavaScript posts here and expects JSON; without JavaScript the
 * visitor is redirected to thank-you.html.
 */
declare(strict_types=1);

// ---- Settings ---------------------------------------------------------------
$TO_EMAIL   = 'info@priscimosenterprise.net';     // inbox that receives quote requests
$FROM_EMAIL = 'website@priscimosenterprise.net';  // sender; use an address on this domain
$SITE_NAME  = 'Priscimos Enterprise Solutions';
$SERVICES   = ['Medical courier', 'Non-medical courier', 'Other / custom'];
// -----------------------------------------------------------------------------

$accept    = isset($_SERVER['HTTP_ACCEPT']) ? (string) $_SERVER['HTTP_ACCEPT'] : '';
$wantsJson = strpos($accept, 'application/json') !== false;

function respond(bool $ok, string $message, int $status, bool $json, array $errors = []): void
{
    http_response_code($status);
    if ($json) {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        $out = ['ok' => $ok, 'message' => $message];
        if ($errors) {
            $out['errors'] = $errors;
        }
        echo json_encode($out);
        exit;
    }
    if ($ok) {
        header('Location: thank-you.html', true, 303);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $safe = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    $list = '';
    foreach ($errors as $e) {
        $list .= '<li>' . htmlspecialchars($e, ENT_QUOTES, 'UTF-8') . '</li>';
    }
    echo "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
        . "<title>Quote request not sent</title><body style='font:18px/1.6 system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 20px;color:#0E1B45'>"
        . "<h1>Quote request not sent</h1><p>{$safe}</p><ul>{$list}</ul>"
        . "<p><a href='javascript:history.back()'>Go back to the form</a> or call <a href='tel:+14059790213'>(405) 979-0213</a>.</p></body>";
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'Send the form from the website.', 405, $wantsJson);
}

// Spam trap: the hidden "website" field is empty for real visitors.
if (!empty($_POST['website'])) {
    respond(true, 'Quote request sent', 200, $wantsJson);
}

function field(string $key, int $max): string
{
    $v = isset($_POST[$key]) ? (string) $_POST[$key] : '';
    $v = trim(strip_tags($v));
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

$data = [
    'first_name' => field('first_name', 60),
    'last_name' => field('last_name', 60),
    'company'   => field('company', 160),
    'phone'     => field('phone', 40),
    'email'     => field('email', 160),
    'service'   => field('service', 60),
    'frequency' => field('frequency', 60),
    'pickup'    => field('pickup', 120),
    'dropoff'   => field('dropoff', 120),
    'date'      => field('date', 20),
    'details'   => field('details', 2000),
];

$errors = [];
if ($data['first_name'] === '') {
    $errors['first_name'] = 'Enter your first name.';
}
if ($data['last_name'] === '') {
    $errors['last_name'] = 'Enter your last name.';
}
$data['name'] = trim($data['first_name'] . ' ' . $data['last_name']);
if (strlen(preg_replace('/\D/', '', $data['phone']) ?? '') < 7) {
    $errors['phone'] = 'Enter a phone number we can reach you on.';
}
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Enter an email address, like name@example.com.';
}
if (!in_array($data['service'], $SERVICES, true)) {
    $errors['service'] = 'Choose the service you need.';
}
if ($data['pickup'] === '') {
    $errors['pickup'] = 'Enter the pickup city or ZIP code.';
}
if ($data['dropoff'] === '') {
    $errors['dropoff'] = 'Enter the drop-off city or ZIP code.';
}
if ($errors) {
    respond(false, 'Some details are missing or need fixing.', 422, $wantsJson, $errors);
}

$oneLine = static function (string $s): string {
    return trim(str_replace(["\r", "\n", '%0a', '%0d'], ' ', $s));
};

$subject = 'Quote request: ' . $data['service'] . ' - ' . $oneLine($data['name']);
$lines = [
    'New quote request from priscimosenterprise.net',
    '',
    'Name:        ' . $data['name'],
    'Company:     ' . ($data['company'] !== '' ? $data['company'] : '-'),
    'Phone:       ' . $data['phone'],
    'Email:       ' . $data['email'],
    '',
    'Service:     ' . $data['service'],
    'How often:   ' . ($data['frequency'] !== '' ? $data['frequency'] : '-'),
    'Pickup:      ' . $data['pickup'],
    'Drop-off:    ' . $data['dropoff'],
    'Date needed: ' . ($data['date'] !== '' ? $data['date'] : '-'),
    '',
    'Details:',
    $data['details'] !== '' ? $data['details'] : '-',
    '',
    '--',
    'Sent ' . date('Y-m-d H:i T') . ' from ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown IP'),
];
$body = implode("\r\n", $lines);

$headers = [
    'From: ' . $SITE_NAME . ' <' . $FROM_EMAIL . '>',
    'Reply-To: ' . $oneLine($data['name']) . ' <' . $oneLine($data['email']) . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$sent = @mail($TO_EMAIL, $encodedSubject, $body, implode("\r\n", $headers), '-f' . $FROM_EMAIL);

if (!$sent) {
    respond(false, "Your request didn't send because the mail server didn't accept it.", 500, $wantsJson);
}
respond(true, 'Quote request sent', 200, $wantsJson);
