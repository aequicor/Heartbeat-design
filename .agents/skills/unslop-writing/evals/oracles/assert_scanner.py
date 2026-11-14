#!/usr/bin/env python3
"""Manifest-local entry point for the shipping scanner assertions."""
import argparse
import hashlib
from pathlib import Path
import subprocess
import sys


def source_digest():
    scripts = Path(__file__).resolve().parents[2] / "scripts"
    digest = hashlib.sha256()
    for path in sorted(scripts.rglob("*.py")):
        digest.update(path.relative_to(scripts).as_posix().encode("utf-8") + b"\0")
        digest.update(hashlib.sha256(path.read_bytes()).digest())
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-sha256", required=True)
    parser.add_argument("scanner", choices=("structure_scan", "banned_phrase_scan", "validate_preservation"))
    parser.add_argument("arguments", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.source_sha256 != source_digest():
        parser.error("scanner sources changed; regenerate evals/shared-benchmark.json")
    script = Path(__file__).resolve().parents[2] / "scripts" / (args.scanner + ".py")
    return subprocess.run([sys.executable, str(script), *args.arguments]).returncode


if __name__ == "__main__":
    raise SystemExit(main())
