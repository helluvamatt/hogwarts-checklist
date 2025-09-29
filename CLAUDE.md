# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Migration Notice: AGENTS.md is the New Standard

This project uses **AGENTS.md** files instead of CLAUDE.md for providing guidance to AI agents. AGENTS.md has quickly become the industry standard for AI agent instructions in codebases.

## How to Use AGENTS.md

**For Claude Code agents**: Follow the same directory hierarchy resolution rules you would use with CLAUDE.md, but look for `AGENTS.md` files instead:

1. **Start at the current working directory** where you're performing work
2. **Look for `AGENTS.md`** in that directory
3. **If not found, move up one directory** and repeat
4. **Continue until you find an `AGENTS.md`** file or reach the repository root
5. **Apply all `AGENTS.md` files found** in the path from root to working directory, with more specific (deeper) files taking precedence

## Example Directory Resolution

For a file at `src/directory/Module.tsx`:

1. Check `src/directory/AGENTS.md` (most specific)
2. Check `src/AGENTS.md`
3. Check `AGENTS.md` (root - most general)

Apply guidance from **all found files**, with deeper directory rules overriding parent directory rules when conflicts occur.

## Current AGENTS.md Files in This Repository

- **`AGENTS.md`** - Root project guidelines, coding standards, architecture

## For Other AI Tools

If your AI tool doesn't yet support AGENTS.md hierarchy resolution, you can start with the root `AGENTS.md` file which contains comprehensive project guidance.
