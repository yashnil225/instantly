# verify-app.py (with filtered CSV downloads)

import csv
import io
import re
import sys
import time
import uuid
import dns.resolver
import smtplib
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from tempfile import NamedTemporaryFile

# Ensure UTF-8 output on Windows consoles
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

app = Flask(__name__)
CORS(app)

print("\U0001F525 VERIFIER RUNNING - Want sales calls from leads? Go to AlexBerman.com/Mastermind \U0001F525")

EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")
DISPOSABLE_DOMAINS = {"mailinator.com", "10minutemail.com", "guerrillamail.com"}
ROLE_BASED_PREFIXES = {"info", "support", "admin", "sales", "contact"}

data = {}

def check_email(email):
    if not EMAIL_REGEX.match(email):
        return "invalid", "bad_syntax"

    parts = email.split('@')
    if len(parts) != 2:
        return "invalid", "bad_syntax"
    local, domain = parts[0], parts[1]

    if domain.lower() in DISPOSABLE_DOMAINS:
        return "invalid", "disposable_domain"
    if local.lower() in ROLE_BASED_PREFIXES:
        return "invalid", "role_based"

    try:
        records = dns.resolver.resolve(domain, 'MX')
        mx_record = str(records[0].exchange).rstrip('.')
    except Exception:
        return "invalid", "no_mx"

    try:
        server = smtplib.SMTP(timeout=5)
        server.connect(mx_record)
        server.helo("example.com")
        server.mail("probe@example.com")
        code, _ = server.rcpt(f"doesnotexist123@{domain}")
        try:
            server.quit()
        except Exception:
            pass
        if code == 250:
            return "risky", "domain_accepts_all"
    except Exception:
        pass

    def smtp_check():
        srv = None
        try:
            srv = smtplib.SMTP(timeout=5)
            srv.connect(mx_record)
            srv.helo("example.com")
            srv.mail("verifier@example.com")
            code, _ = srv.rcpt(email)
            return code
        except Exception:
            return None
        finally:
            if srv:
                try:
                    srv.quit()
                except Exception:
                    pass

    code = smtp_check()
    if code in [421, 450, 451, 452, 503]:
        time.sleep(2)
        code = smtp_check()

    if code == 250:
        return "valid", "smtp_ok"
    elif code is None:
        return "risky", "smtp_timeout"
    elif code in [421, 450, 451, 452, 503]:
        return "risky", f"smtp_soft_fail_{code}"
    elif code == 550:
        return "invalid", "smtp_reject"
    else:
        return "invalid", f"smtp_{code}"

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

    email_field = next((f for f in reader[0].keys() if f and f.lower().strip() in ('email', 'e-mail', 'email address', 'email_address', 'mail')), None)
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
            data[job_id].update({"progress": percent, "row": i,
                                 "log": f"\u2705 {email} \u2192 {status} ({reason})"})
        out_buf = data[job_id]['output']
        csv_text = out_buf.getvalue()
        temp = NamedTemporaryFile(delete=False, suffix=".csv", mode='w+', encoding='utf-8')
        temp.write(csv_text)
        temp.flush()
        temp.close()
        data[job_id]['file_path'] = temp.name

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

    download_name = f"{filter_type}-galadon-{job['filename']}"
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={"Content-Disposition": f"attachment; filename={download_name}"}
    )

if __name__ == '__main__':
    app.run(debug=False, port=5050, host='127.0.0.1')

