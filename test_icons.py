import requests

base = 'http://127.0.0.1:5000'
icons = [
    '01-main-logo.svg',
    '02-candidate-user.svg',
    '03-admin.svg',
    '04-job-opening.svg',
    '05-resume.svg',
    '06-resume-screening.svg',
    '07-job-requirement-match.svg',
    '08-applicants.svg',
    '09-application-status.svg',
    '10-reports-analytics.svg'
]

if __name__ == '__main__':
    print("Checking static asset HTTP status:")
    for icon in icons:
        url = f"{base}/static/assets/icons/{icon}"
        try:
            r = requests.get(url)
            print(f"  {icon}: HTTP {r.status_code}, Content-Type={r.headers.get('Content-Type')}, Size={len(r.content)} bytes")
        except Exception as e:
            print(f"  {icon}: Error connecting - {e}")
