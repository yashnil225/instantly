# verify-app.py (Production-Grade High-Deliverability Email Verifier)

import csv
import io
import re
import sys
import time
import uuid
import json
import urllib.request
import dns.resolver
from flask import Flask, request, jsonify, Response
from tempfile import NamedTemporaryFile

# Ensure UTF-8 output on Windows consoles
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

app = Flask(__name__)

# Manual CORS headers handler to avoid cors dependency issues
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

print("\U0001F525 HIGH-DELIVERABILITY VERIFIER RUNNING - Anti-Bounce Shield Active \U0001F525")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$")

TYPO_MAP = {
    'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.co': 'gmail.com',
    'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yaho.co': 'yahoo.com',
    'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com',
    'iclud.com': 'icloud.com', 'icoud.com': 'icloud.com', 'zoho.cm': 'zoho.com'
}

FREE_PROVIDERS = {
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.fr',
    'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com',
    'icloud.com', 'me.com', 'mac.com', 'aol.com', 'zoho.com', 'protonmail.com',
    'proton.me', 'mail.com', 'gmx.com', 'gmx.net', 'yandex.com'
}

ROLE_BASED_PREFIXES = {
    'admin', 'administrator', 'support', 'help', 'info', 'billing', 'accounts',
    'payments', 'sales', 'contact', 'office', 'jobs', 'careers', 'press',
    'media', 'legal', 'compliance', 'security', 'abuse', 'postmaster', 'hostmaster',
    'marketing', 'team', 'hr', 'operations', 'no-reply', 'noreply', 'donotreply',
    'finance', 'accounting', 'general', 'hello', 'hi', 'enquiries', 'inquiries',
    'service', 'dev', 'developer', 'feedback', 'test', 'inbox', 'frontdesk'
}

DISPOSABLE_DOMAINS = {
    'mailinator.com', '10minutemail.com', '10minutemail.net', 'guerrillamail.com', 'guerrillamail.net',
    'guerrillamail.org', 'guerrillamailblock.com', 'sharklasers.com', 'tempmail.com', 'temp-mail.org',
    'tempmail.net', 'temp-mail.io', 'throwawaymail.com', 'fakeinbox.com', 'getairmail.com',
    'dispostable.com', 'yopmail.com', 'yopmail.fr', 'yopmail.net', 'trashmail.com',
    'trashmail.net', 'trashmail.org', 'trashmail.me', 'trashmail.at', 'trashmail.io',
    'nada.ltd', 'inboxkitten.com', 'crazymailing.com', 'crazymailing.net', 'mytemp.email',
    'dropmail.me', 'mohmal.com', 'burnermail.io', 'generator.email', 'tempail.com',
    'tempinbox.com', 'emailondeck.com', 'maildrop.cc', 'harakirimail.com', 'tmailor.com',
    'fakemailgenerator.com', 'internxt.com', 'minuteinbox.com', 'luxusmail.org', 'brefmail.com',
    'grr.la', 'spam4.me', 'pokemail.net', 'mailnesia.com', 'jetable.org', 'meltmail.com',
    'incognitomail.org', 'safetymail.info', 'spambox.us', 'hidemail.de', 'wegwerfmail.de',
    'spamavert.com', 'tempsky.com', 'e4ward.com', 'sneakemail.com', 'mytempemail.com',
    'boun.cr', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'fleckens.hu', 'gustr.com',
    'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'einrot.com'
}

GATEWAY_SHIELDS = [
    (re.compile(r"\.pphosted\.com$", re.I), "Proofpoint Enterprise Gateway"),
    (re.compile(r"\.gpphosted\.com$", re.I), "Proofpoint Enterprise Gateway"),
    (re.compile(r"\.mimecast\.com$", re.I), "Mimecast Secure Gateway"),
    (re.compile(r"\.iphmx\.com$", re.I), "Cisco IronPort Gateway"),
    (re.compile(r"\.ironport\.com$", re.I), "Cisco IronPort Gateway"),
    (re.compile(r"\.barracudanetworks\.com$", re.I), "Barracuda Gateway"),
    (re.compile(r"\.fireeyecloud\.com$", re.I), "Trellix/FireEye Gateway"),
    (re.compile(r"\.sophos\.com$", re.I), "Sophos Mail Gateway"),
    (re.compile(r"\.fortimail\.com$", re.I), "Fortinet FortiMail Gateway"),
    (re.compile(r"\.trendmicro\.com$", re.I), "Trend Micro Gateway"),
    (re.compile(r"\.messagelabs\.com$", re.I), "Symantec MessageLabs"),
    (re.compile(r"\.mailanyone\.net$", re.I), "MailAnyone Gateway")
]

PARKED_PATTERNS = [
    re.compile(r"sedoparking\.com", re.I),
    re.compile(r"parkingcrew\.net", re.I),
    re.compile(r"bodis\.com", re.I),
    re.compile(r"above\.com", re.I),
    re.compile(r"hugedomains\.com", re.I),
    re.compile(r"dan\.com", re.I),
    re.compile(r"cashparking\.com", re.I),
    re.compile(r"sav\.com", re.I),
    re.compile(r"renewyourname\.net", re.I)
]

mx_cache = {}
data = {}

def get_domain_mx(domain):
    if domain in mx_cache:
        return mx_cache[domain]

    # Primary: DoH via Google DNS (Port 443 - zero UDP timeouts on Windows)
    try:
        url = f"https://dns.google/resolve?name={urllib.parse.quote(domain)}&type=MX"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            d = json.loads(resp.read().decode('utf-8'))
            answers = d.get('Answer', [])
            if answers:
                records = []
                for a in answers:
                    parts = a.get('data', '').split(' ')
                    prio = int(parts[0]) if len(parts) > 1 and parts[0].isdigit() else 10
                    exch = (parts[1] if len(parts) > 1 else parts[0]).rstrip('.').lower()
                    records.append((prio, exch))
                records.sort(key=lambda x: x[0])
                mx_cache[domain] = records
                return records
    except Exception:
        pass

    # Fallback: dnspython resolver
    try:
        answers = dns.resolver.resolve(domain, 'MX', lifetime=2.0)
        records = sorted([(r.preference, str(r.exchange).rstrip('.').lower()) for r in answers], key=lambda x: x[0])
        mx_cache[domain] = records
        return records
    except Exception:
        pass

    return []

def check_email(email):
    email = (email or '').strip()
    if not email or not EMAIL_REGEX.match(email) or '..' in email or email.startswith('.') or email.endswith('.'):
        return "invalid", "bad_syntax"

    parts = email.split('@')
    if len(parts) != 2:
        return "invalid", "bad_syntax"
    local, domain = parts[0].lower(), parts[1].lower()

    if len(local) > 64 or len(domain) > 255:
        return "invalid", "length_exceeded"

    # Domain typo
    if domain in TYPO_MAP:
        return "invalid", f"typo_detected_{TYPO_MAP[domain]}"

    # Disposable
    if domain in DISPOSABLE_DOMAINS or domain.startswith(('temp', 'dispos', 'burner', 'throwaway', 'fake', 'trash')):
        return "invalid", "disposable_domain"

    # Role-based
    if local in ROLE_BASED_PREFIXES:
        return "risky", "role_based_alias"

    # MX Lookup
    records = get_domain_mx(domain)
    if not records:
        return "invalid", "no_mx_record"

    primary_mx = records[0][1]

    # Null MX
    if not primary_mx or primary_mx in ('.', '0.0.0.0', '127.0.0.1', 'localhost'):
        return "invalid", "null_mx_refused"

    # Parked Domain
    if any(p.search(primary_mx) for p in PARKED_PATTERNS):
        return "invalid", "parked_expired_domain"

    # Gateway Shield Catch-All (Proofpoint, Cisco IronPort, Mimecast, Barracuda)
    for pat, name in GATEWAY_SHIELDS:
        if pat.search(primary_mx):
            return "risky", f"catch_all_gateway_{name.replace(' ', '_')}"

    return "valid", "active_mailbox_exchange"

@app.route('/')
@app.route('/index.html')
def index():
    return send_file('index.html')

@app.route('/verify', methods=['POST'])
def verify():
    job_id = str(uuid.uuid4())
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    content = file.read().decode('utf-8-sig', errors='replace')
    reader = list(csv.DictReader(io.StringIO(content)))
    total = len(reader)
    if total == 0:
        return jsonify({"error": "CSV file is empty"}), 400

    email_field = next((f for f in reader[0].keys() if f and f.lower().strip() in ('email', 'e-mail', 'email address', 'email_address', 'mail', 'work email', 'contact email')), None)
    if not email_field:
        email_field = next((f for f in reader[0].keys() if f and 'email' in f.lower()), None)
    if not email_field:
        email_field = list(reader[0].keys())[0]

    output = io.StringIO()
    fieldnames = list(reader[0].keys()) + ['status', 'reason']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    data[job_id] = {
        "progress": 0,
        "row": 0,
        "total": total,
        "log": "",
        "cancel": False,
        "output": output,
        "writer": writer,
        "records": reader,
        "email_field": email_field,
        "filename": file.filename
    }

    def run():
        for i, row in enumerate(reader, start=1):
            if data[job_id]['cancel']:
                data[job_id]['log'] = f"\u274c Canceled job {job_id}"
                break
            email = (row.get(email_field) or '').strip()
            if not email:
                status, reason = 'invalid', 'empty_email'
            else:
                status, reason = check_email(email)
            row['status'], row['reason'] = status, reason
            writer.writerow(row)
            percent = int((i / total) * 100)
            icon = "\u2705" if status == 'valid' else ("\u26a0\ufe0f" if status == 'risky' else "\u274c")
            data[job_id].update({
                "progress": percent,
                "row": i,
                "log": f"{icon} {email} \u2192 {status.upper()} ({reason})"
            })

    import threading
    threading.Thread(target=run, daemon=True).start()

    return jsonify({"job_id": job_id})

@app.route('/progress')
def progress():
    job_id = request.args.get("job_id")
    d = data.get(job_id, {})
    return jsonify({"percent": d.get("progress", 0), "row": d.get("row", 0), "total": d.get("total", 0)})

@app.route('/log')
def log():
    job_id = request.args.get("job_id")
    return Response(data.get(job_id, {}).get("log", ""), mimetype='text/plain')

@app.route('/cancel', methods=['POST'])
def cancel():
    job_id = request.args.get("job_id")
    if job_id in data:
        data[job_id]['cancel'] = True
    return '', 204

@app.route('/download')
def download():
    job_id = request.args.get("job_id")
    filter_type = request.args.get("type", "all")
    job = data.get(job_id)
    if not job:
        return "Invalid job ID", 404

    csv_content = job['output'].getvalue()
    reader = list(csv.DictReader(io.StringIO(csv_content)))

    if filter_type == "valid":
        filtered = [row for row in reader if row.get('status') == 'valid']
    elif filter_type == "risky":
        filtered = [row for row in reader if row.get('status') == 'risky']
    elif filter_type == "invalid":
        filtered = [row for row in reader if row.get('status') == 'invalid']
    elif filter_type == "risky_invalid":
        filtered = [row for row in reader if row.get('status') in ('risky', 'invalid')]
    else:
        filtered = reader

    fieldnames = list(reader[0].keys()) if reader else ['status', 'reason']
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in filtered:
        writer.writerow(row)

    download_name = f"{filter_type}-verified-{job['filename']}"
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={"Content-Disposition": f"attachment; filename={download_name}"}
    )

if __name__ == '__main__':
    app.run(debug=False, port=5050, host='127.0.0.1')
