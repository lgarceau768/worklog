#!/usr/bin/env python3
"""
wl — Worklog CLI for efficient JSON operations.
Installed to .worklog/bin/wl by the opencode-worklog plugin.

Usage:
  wl todo list [--all] [--priority=high|medium|low] [--json]
  wl todo add <title> [--priority=medium] [--notes=...]
  wl todo done <id> [--notes=...]
  wl todo drop <id>
  wl todo get <id>
  wl todo note <id> <text>
  wl blocker list [--all]
  wl status
"""

import json, sys, os, argparse, re
from datetime import date
from pathlib import Path

WORKLOG = Path(os.environ.get("WORKLOG_DIR", ".worklog"))


# ── file helpers ─────────────────────────────────────────────────────────────

def todos_path():
    return WORKLOG / "todos.json"

def blockers_path():
    return WORKLOG / "blockers.md"

def load_todos():
    p = todos_path()
    if not p.exists():
        return {"version": 1, "todos": []}
    return json.loads(p.read_text())

def save_todos(data):
    todos_path().write_text(json.dumps(data, indent=2) + "\n")

PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}

def sorted_todos(items):
    return sorted(items, key=lambda t: PRIORITY_ORDER.get(t.get("priority", "low"), 99))


# ── todo commands ─────────────────────────────────────────────────────────────

def cmd_todo_list(args):
    data = load_todos()
    items = data["todos"]
    if not getattr(args, "all", False):
        items = [t for t in items if t.get("status") == "open"]
    if getattr(args, "priority", None):
        items = [t for t in items if t.get("priority") == args.priority]
    if getattr(args, "json", False):
        print(json.dumps(items, indent=2))
        return
    items = sorted_todos(items)
    for t in items:
        notes = f" | {t['notes']}" if t.get("notes") else ""
        print(f"[{t.get('priority','medium')}] {t['id']} — {t['title']}{notes}")
    if not items:
        print("No open todos.")


def cmd_todo_add(args):
    data = load_todos()
    ids = [int(t["id"]) for t in data["todos"] if str(t.get("id", "")).isdigit()]
    new_id = str(max(ids) + 1 if ids else 1).zfill(3)
    item = {
        "id": new_id,
        "title": args.title,
        "status": "open",
        "priority": getattr(args, "priority", None) or "medium",
        "created": date.today().isoformat(),
        "closed": None,
        "notes": getattr(args, "notes", None) or "",
    }
    data["todos"].append(item)
    save_todos(data)
    print(f"Added TODO-{new_id}: {args.title}")


def cmd_todo_set_status(args, status):
    data = load_todos()
    for t in data["todos"]:
        if t["id"] == args.id:
            t["status"] = status
            t["closed"] = date.today().isoformat()
            if getattr(args, "notes", None):
                existing = t.get("notes") or ""
                t["notes"] = (existing + " | " + args.notes).lstrip(" | ")
            save_todos(data)
            print(f"{status.capitalize()} TODO-{args.id}: {t['title']}")
            return
    print(f"TODO {args.id} not found.", file=sys.stderr)
    sys.exit(1)


def cmd_todo_get(args):
    data = load_todos()
    for t in data["todos"]:
        if t["id"] == args.id:
            print(json.dumps(t, indent=2))
            return
    print(f"TODO {args.id} not found.", file=sys.stderr)
    sys.exit(1)


def cmd_todo_note(args):
    data = load_todos()
    for t in data["todos"]:
        if t["id"] == args.id:
            existing = t.get("notes") or ""
            t["notes"] = (existing + " | " + args.text).lstrip(" | ")
            save_todos(data)
            print(f"Updated TODO-{args.id} notes.")
            return
    print(f"TODO {args.id} not found.", file=sys.stderr)
    sys.exit(1)


# ── blocker commands ──────────────────────────────────────────────────────────

def cmd_blocker_list(args):
    bp = blockers_path()
    if not bp.exists():
        print("No blockers file.")
        return
    text = bp.read_text()
    show_all = getattr(args, "all", False)
    # Each blocker block starts with "## BLOCKER-NNN"
    blocks = re.split(r"(?=^## BLOCKER-)", text, flags=re.MULTILINE)
    found = 0
    for block in blocks:
        if not block.startswith("## BLOCKER-"):
            continue
        is_open = "[OPEN]" in block
        if not show_all and not is_open:
            continue
        # Print just the header line + What line
        lines = block.strip().splitlines()
        header = lines[0]
        what = next((l for l in lines if l.startswith("**What:**")), "")
        print(f"{header}")
        if what:
            print(f"  {what}")
        found += 1
    if not found:
        print("No open blockers." if not show_all else "No blockers recorded.")


# ── status dashboard ──────────────────────────────────────────────────────────

def cmd_status(_args):
    data = load_todos()
    open_todos = sorted_todos([t for t in data["todos"] if t.get("status") == "open"])
    done_count = sum(1 for t in data["todos"] if t.get("status") in ("done", "dropped"))

    bp = blockers_path()
    open_blockers = 0
    if bp.exists():
        open_blockers = bp.read_text().count("[OPEN]")

    print(f"TODOs: {len(open_todos)} open, {done_count} closed")
    for t in open_todos[:5]:
        notes = f" | {t['notes']}" if t.get("notes") else ""
        print(f"  [{t.get('priority','medium')}] {t['id']} — {t['title']}{notes}")
    if len(open_todos) > 5:
        print(f"  … and {len(open_todos) - 5} more")
    print(f"Blockers: {open_blockers} open")


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(prog="wl", description="Worklog CLI")
    sub = p.add_subparsers(dest="cmd")

    # todo
    tp = sub.add_parser("todo")
    ts = tp.add_subparsers(dest="subcmd")

    lp = ts.add_parser("list")
    lp.add_argument("--all", action="store_true", help="Include done/dropped")
    lp.add_argument("--priority", choices=["high", "medium", "low"])
    lp.add_argument("--json", action="store_true", help="Output raw JSON")

    ap = ts.add_parser("add")
    ap.add_argument("title")
    ap.add_argument("--priority", choices=["high", "medium", "low"], default="medium")
    ap.add_argument("--notes", default="")

    dp = ts.add_parser("done")
    dp.add_argument("id")
    dp.add_argument("--notes", default="")

    drp = ts.add_parser("drop")
    drp.add_argument("id")

    gp = ts.add_parser("get")
    gp.add_argument("id")

    np = ts.add_parser("note")
    np.add_argument("id")
    np.add_argument("text")

    # blocker
    bp = sub.add_parser("blocker")
    bs = bp.add_subparsers(dest="subcmd")
    bl = bs.add_parser("list")
    bl.add_argument("--all", action="store_true", help="Include resolved blockers")

    # status
    sub.add_parser("status")

    args = p.parse_args()

    if args.cmd == "todo":
        if args.subcmd == "list":       cmd_todo_list(args)
        elif args.subcmd == "add":      cmd_todo_add(args)
        elif args.subcmd == "done":     cmd_todo_set_status(args, "done")
        elif args.subcmd == "drop":     cmd_todo_set_status(args, "dropped")
        elif args.subcmd == "get":      cmd_todo_get(args)
        elif args.subcmd == "note":     cmd_todo_note(args)
        else:                           tp.print_help()
    elif args.cmd == "blocker":
        if args.subcmd == "list":       cmd_blocker_list(args)
        else:                           bp.print_help()
    elif args.cmd == "status":
        cmd_status(args)
    else:
        p.print_help()


if __name__ == "__main__":
    main()
