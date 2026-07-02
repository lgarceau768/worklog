#!/usr/bin/env bun
/**
 * wl — Worklog CLI for efficient JSON operations.
 * Installed to .worklog/bin/wl.ts by the opencode-worklog plugin.
 * Run with: bun .worklog/bin/wl.ts <command> [args]
 *
 * Usage:
 *   wl todo list [--all] [--priority=high|medium|low] [--json]
 *   wl todo add <title> [--priority=medium] [--notes=...]
 *   wl todo done <id> [--notes=...]
 *   wl todo drop <id>
 *   wl todo get <id>
 *   wl todo note <id> <text>
 *   wl blocker list [--all]
 *   wl status
 */

import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

const WORKLOG = process.env.WORKLOG_DIR ?? ".worklog"

// ── types ─────────────────────────────────────────────────────────────────────

type Priority = "high" | "medium" | "low"
type Status = "open" | "done" | "dropped"

interface Todo {
  id: string
  title: string
  status: Status
  priority: Priority
  created: string
  closed: string | null
  notes: string
}

interface TodoFile {
  version: number
  todos: Todo[]
}

// ── file helpers ──────────────────────────────────────────────────────────────

const todosPath = () => join(WORKLOG, "todos.json")
const blockersPath = () => join(WORKLOG, "blockers.md")
const today = () => new Date().toISOString().slice(0, 10)

function loadTodos(): TodoFile {
  const p = todosPath()
  if (!existsSync(p)) return { version: 1, todos: [] }
  return JSON.parse(readFileSync(p, "utf8"))
}

function saveTodos(data: TodoFile) {
  writeFileSync(todosPath(), JSON.stringify(data, null, 2) + "\n")
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

function sortedTodos(items: Todo[]) {
  return [...items].sort((a, b) =>
    (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
  )
}

// ── todo commands ─────────────────────────────────────────────────────────────

function todoList(flags: Record<string, string | boolean>) {
  const data = loadTodos()
  let items = data.todos
  if (!flags.all) items = items.filter(t => t.status === "open")
  if (flags.priority) items = items.filter(t => t.priority === flags.priority)
  if (flags.json) { console.log(JSON.stringify(items, null, 2)); return }
  items = sortedTodos(items)
  for (const t of items) {
    const notes = t.notes ? ` | ${t.notes}` : ""
    console.log(`[${t.priority}] ${t.id} — ${t.title}${notes}`)
  }
  if (!items.length) console.log("No open todos.")
}

function todoAdd(title: string, flags: Record<string, string | boolean>) {
  const data = loadTodos()
  const ids = data.todos.map(t => parseInt(t.id)).filter(n => !isNaN(n))
  const newId = String((ids.length ? Math.max(...ids) : 0) + 1).padStart(3, "0")
  data.todos.push({
    id: newId,
    title,
    status: "open",
    priority: (flags.priority as Priority) ?? "medium",
    created: today(),
    closed: null,
    notes: (flags.notes as string) ?? "",
  })
  saveTodos(data)
  console.log(`Added TODO-${newId}: ${title}`)
}

function todoSetStatus(id: string, status: Status, notes?: string) {
  const data = loadTodos()
  const t = data.todos.find(t => t.id === id)
  if (!t) { console.error(`TODO ${id} not found.`); process.exit(1) }
  t.status = status
  t.closed = today()
  if (notes) t.notes = [t.notes, notes].filter(Boolean).join(" | ")
  saveTodos(data)
  console.log(`${status.charAt(0).toUpperCase() + status.slice(1)} TODO-${id}: ${t.title}`)
}

function todoGet(id: string) {
  const data = loadTodos()
  const t = data.todos.find(t => t.id === id)
  if (!t) { console.error(`TODO ${id} not found.`); process.exit(1) }
  console.log(JSON.stringify(t, null, 2))
}

function todoNote(id: string, text: string) {
  const data = loadTodos()
  const t = data.todos.find(t => t.id === id)
  if (!t) { console.error(`TODO ${id} not found.`); process.exit(1) }
  t.notes = [t.notes, text].filter(Boolean).join(" | ")
  saveTodos(data)
  console.log(`Updated TODO-${id} notes.`)
}

// ── blocker commands ──────────────────────────────────────────────────────────

function blockerList(showAll: boolean) {
  const bp = blockersPath()
  if (!existsSync(bp)) { console.log("No blockers file."); return }
  const text = readFileSync(bp, "utf8")
  const blocks = text.split(/(?=^## BLOCKER-)/m).filter(b => b.startsWith("## BLOCKER-"))
  let found = 0
  for (const block of blocks) {
    const isOpen = block.includes("[OPEN]")
    if (!showAll && !isOpen) continue
    const lines = block.trim().split("\n")
    console.log(lines[0])
    const what = lines.find(l => l.startsWith("**What:**"))
    if (what) console.log(`  ${what}`)
    found++
  }
  if (!found) console.log(showAll ? "No blockers recorded." : "No open blockers.")
}

// ── status dashboard ──────────────────────────────────────────────────────────

function status() {
  const data = loadTodos()
  const open = sortedTodos(data.todos.filter(t => t.status === "open"))
  const closed = data.todos.filter(t => t.status !== "open").length
  const bp = blockersPath()
  const openBlockers = existsSync(bp) ? (readFileSync(bp, "utf8").match(/\[OPEN\]/g) ?? []).length : 0

  console.log(`TODOs: ${open.length} open, ${closed} closed`)
  for (const t of open.slice(0, 5)) {
    const notes = t.notes ? ` | ${t.notes}` : ""
    console.log(`  [${t.priority}] ${t.id} — ${t.title}${notes}`)
  }
  if (open.length > 5) console.log(`  … and ${open.length - 5} more`)
  console.log(`Blockers: ${openBlockers} open`)
}

// ── arg parsing ───────────────────────────────────────────────────────────────

function parseFlags(args: string[]): { positional: string[]; flags: Record<string, string | boolean> } {
  const positional: string[] = []
  const flags: Record<string, string | boolean> = {}
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [k, v] = arg.slice(2).split("=")
      flags[k] = v ?? true
    } else {
      positional.push(arg)
    }
  }
  return { positional, flags }
}

function usage() {
  console.log(`Usage: wl <command> [subcommand] [args]

Commands:
  todo list [--all] [--priority=high|medium|low] [--json]
  todo add <title> [--priority=medium] [--notes=text]
  todo done <id> [--notes=text]
  todo drop <id>
  todo get <id>
  todo note <id> <text>
  blocker list [--all]
  status`)
}

// ── main ──────────────────────────────────────────────────────────────────────

const [cmd, subcmd, ...rest] = process.argv.slice(2)
const { positional, flags } = parseFlags(rest)

if (cmd === "todo") {
  if (subcmd === "list")       todoList(flags)
  else if (subcmd === "add")   todoAdd(positional[0] ?? flags.title as string, flags)
  else if (subcmd === "done")  todoSetStatus(positional[0], "done", flags.notes as string)
  else if (subcmd === "drop")  todoSetStatus(positional[0], "dropped")
  else if (subcmd === "get")   todoGet(positional[0])
  else if (subcmd === "note")  todoNote(positional[0], rest.slice(1).join(" ").replace(/^--\S+=?/, "").trim() || positional[1])
  else usage()
} else if (cmd === "blocker") {
  if (subcmd === "list") blockerList(!!flags.all)
  else usage()
} else if (cmd === "status") {
  status()
} else {
  usage()
}
