set shell := ["sh", "-uc"]
set windows-shell := ["powershell.exe", "-c"]

dev:
    pnpm dev --host 0.0.0.0
