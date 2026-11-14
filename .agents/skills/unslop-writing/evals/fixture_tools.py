"""Launch Python test doubles without relying on Unix shebang execution."""
import os
import sys


def add_windows_launcher(script):
    if os.name == "nt":
        script.with_name(script.name + ".cmd").write_text(
            f'@echo off\n"{sys.executable}" "%~dp0{script.name}" %*\n',
            encoding="utf-8",
        )
