#!/usr/bin/env python3
"""Purpose-fit verification for SereneSpace (Stillness).

Production build, the full vitest suite, and the Playwright journeys in
real Chromium. Exit 0 and FAILURES=0 mean green.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))

checks = []
failures = []


def record(name, ok, detail=''):
    checks.append({'name': name, 'ok': bool(ok), 'detail': detail})
    print(('PASS' if ok else 'FAIL') + ' ' + name + (' :: ' + detail if detail else ''))
    if not ok:
        failures.append(name)


def main():
    npm = shutil.which('npm')
    record('doctor: npm on PATH', npm is not None, npm or 'not found')
    if not npm:
        return finish()

    if not os.path.isdir(os.path.join(REPO_ROOT, 'node_modules')):
        ci = subprocess.run([npm, 'ci', '--no-audit', '--no-fund'], cwd=REPO_ROOT,
                            capture_output=True, text=True, timeout=900)
        record('npm ci', ci.returncode == 0, ci.stderr.strip()[-200:])
        if ci.returncode != 0:
            return finish()

    build = subprocess.run([npm, 'run', 'build'], cwd=REPO_ROOT,
                           capture_output=True, text=True, timeout=900)
    record('production build green (tsc + vite)', build.returncode == 0,
           (build.stdout.strip().splitlines() or [''])[-1] if build.returncode == 0
           else (build.stdout + build.stderr).strip()[-300:])

    vitest = subprocess.run(['npx', 'vitest', 'run'], cwd=REPO_ROOT,
                            capture_output=True, text=True, timeout=900)
    clean = re.sub(r'\x1b\[[0-9;]*m', '', vitest.stdout)
    m = re.search(r'Tests\s+(\d+) passed', clean)
    record('vitest suite green', vitest.returncode == 0 and m,
           ('%s tests passed' % m.group(1)) if m else (clean + vitest.stderr).strip()[-200:])

    pw_cache = os.path.expanduser('~/.cache/ms-playwright')
    if not os.path.isdir(pw_cache):
        inst = subprocess.run(['npx', 'playwright', 'install', 'chromium'], cwd=REPO_ROOT,
                              capture_output=True, text=True, timeout=900)
        record('playwright chromium installed', inst.returncode == 0, inst.stderr.strip()[-200:])
        if inst.returncode != 0:
            return finish()
    pw = subprocess.run(['npx', 'playwright', 'test'], cwd=REPO_ROOT,
                        capture_output=True, text=True, timeout=1200)
    m2 = re.search(r'(\d+) passed', pw.stdout)
    record('playwright journeys green', pw.returncode == 0 and m2,
           ('%s journeys passed' % m2.group(1)) if m2 else (pw.stdout + pw.stderr).strip()[-200:])
    return finish()


def finish():
    evidence_dir = tempfile.mkdtemp(prefix='verify-serene-space-')
    with open(os.path.join(evidence_dir, 'evidence.json'), 'w') as f:
        json.dump({'repo': 'SereneSpace', 'checks': checks, 'failures': failures}, f, indent=2)
    print('EVIDENCE_DIR=' + evidence_dir)
    print('FAILURES=%d' % len(failures))
    return 0 if not failures else 1


if __name__ == '__main__':
    sys.exit(main())
