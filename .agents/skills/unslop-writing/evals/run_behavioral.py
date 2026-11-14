#!/usr/bin/env python3
"""Run behavioral acceptance with native Python on Windows and POSIX."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
MODEL = "gpt-5.6-luna"


def harness_command():
    executable = shutil.which("skill-benchmark")
    if executable:
        return [executable]
    executable = ROOT / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
    if executable.is_file():
        return [str(executable), "-m", "skill_benchmark"]
    raise FileNotFoundError("Install evals/requirements.txt into .venv; see evals/CHECKS.md")


def shell_command(argv):
    return subprocess.list2cmdline(argv) if os.name == "nt" else shlex.join(argv)


def read_rows(path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def validate_acceptance(benchmark, tasks_path):
    report = json.loads(benchmark.read_text(encoding="utf-8"))
    expected = {row["case_id"] for row in read_rows(tasks_path) if row.get("variant") == "with_skill"}
    if not expected:
        raise ValueError("behavioral acceptance failed: prepared tasks have no with-skill cases")
    failed, observed = [], []
    for row in report.get("results", []):
        if row.get("variant") != "with_skill":
            continue
        observed.append(row.get("case_id"))
        if (row.get("missing_output") or row.get("execution_valid") is not True
                or row.get("combined_pass_rate") != 1.0):
            failed.append(row.get("case_id", "<unknown>"))
    observed_set = set(observed)
    missing = expected - observed_set
    unexpected = observed_set - expected
    duplicates = {case_id for case_id in observed_set if observed.count(case_id) > 1}
    if missing or unexpected or duplicates:
        details = [label + "=" + ",".join(sorted(str(v) for v in values))
                   for label, values in (("missing", missing), ("unexpected", unexpected), ("duplicate", duplicates))
                   if values]
        raise ValueError("behavioral acceptance failed: result coverage mismatch (" + "; ".join(details) + ")")
    if failed:
        raise ValueError("behavioral acceptance failed: " + ", ".join(sorted(set(failed))))
    print("behavioral acceptance passed: every with-skill case cleared every gate")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("split", nargs="?", default="tune", choices=("tune", "holdout", "holdback"))
    parser.add_argument("--uncached", action="store_true")
    args = parser.parse_args(argv)
    if args.split == "holdback" and os.environ.get("UNSLOP_CONFIRM_HOLDBACK") != "1":
        parser.error("Refusing to run sealed holdback split without UNSLOP_CONFIRM_HOLDBACK=1")
    cache_mode = "off" if args.uncached else os.environ.get("UNSLOP_BEHAVIORAL_CACHE_MODE", "read-write")
    if cache_mode not in {"off", "read-write"}:
        parser.error(f"invalid UNSLOP_BEHAVIORAL_CACHE_MODE: {cache_mode}")
    jobs = os.environ.get("UNSLOP_BEHAVIORAL_JOBS", "2")
    if not re.fullmatch(r"[1-9][0-9]*", jobs):
        parser.error(f"invalid UNSLOP_BEHAVIORAL_JOBS: {jobs}")
    os.environ.setdefault("PYTHONUTF8", "1")
    os.chdir(ROOT)
    run_root = Path(os.environ.get("UNSLOP_BEHAVIORAL_RUN_ROOT", "runs"))
    cache_dir = Path(os.environ.get("UNSLOP_BEHAVIORAL_CACHE_DIR", str(run_root / ".cache/behavioral")))
    # Keep the prior shasum identity algorithm to preserve existing caches.
    hashes = "".join(hashlib.sha256((ROOT / name).read_bytes()).hexdigest() + "  " + name + "\n"
                     for name in ("evals/run_local.py", "evals/model_generate.py", "evals/cache_judge.py"))
    automatic = "behavioral-" + hashlib.sha256(hashes.encode()).hexdigest()
    identity = os.environ.get("UNSLOP_BEHAVIORAL_CACHE_IDENTITY", automatic)
    judge_identity = os.environ.get("UNSLOP_BEHAVIORAL_JUDGE_IDENTITY", identity)
    run_dir = run_root / args.split
    tasks, judge, fixed, benchmark = [run_dir / name for name in
                                     ("tasks.jsonl", "judge.jsonl", "judge.fixed.jsonl", "benchmark.json")]
    run_dir.mkdir(parents=True, exist_ok=True)
    manifest = "evals/shared-benchmark.json"
    harness = harness_command()
    subprocess.run([*harness, "prepare", manifest, "--split", args.split, "--out", str(tasks)], check=True)
    runner = [sys.executable, "evals/run_local.py", str(tasks), "--jobs", jobs, "--model", MODEL, "--cache-mode", cache_mode]
    if cache_mode != "off":
        runner += ["--cache-dir", str(cache_dir / "generation"), "--cache-identity", identity]
    subprocess.run(runner, check=True)
    judge_args = [*harness, "judge", manifest, "--runs", str(run_dir), "--split", args.split, "--out", str(judge)]
    if cache_mode != "off":
        judge_argv = [sys.executable, "evals/cache_judge.py", "--cache-dir", str(cache_dir / "judge"),
                      "--identity", judge_identity, "--judge-argv", sys.executable,
                      "evals/model_generate.py", "--kind", "codex", "--model", MODEL]
        judge_args += ["--judge-backend", "cmd", "--judge-cmd", shell_command(judge_argv)]
    else:
        judge_args += ["--judge-backend", "codex", "--judge-model", MODEL, "--codex-cmd", "codex exec"]
    subprocess.run(judge_args, check=True)
    rows = read_rows(judge)
    for row in rows:
        if row.get("verdict_kind") == "scored" and (row.get("score") is None or row.get("threshold") is None):
            raise ValueError(f"invalid scored judge verdict: {row.get('judge_task_id', '<unknown>')}")
    fixed.write_text("\n".join(json.dumps(row) for row in rows) + "\n", encoding="utf-8")
    subprocess.run([*harness, "benchmark", manifest, "--runs", str(run_dir), "--split", args.split,
                    "--allow-scripts", "--judge-results", str(fixed), "--out", str(benchmark)], check=True)
    validate_acceptance(benchmark, tasks)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.CalledProcessError) as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)
