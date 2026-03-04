---
name: agents-markdown
description: The AGENTS.md template and instructions for how to write a better AGENTS.md file.
license: MIT
compatibility: opencode
metadata:
  repo: oh-our-opencodes
---

## Purpose
This skill is for writing a better AGENTS.md file. It provides a template and instructions for how to write a better AGENTS.md file.

You should just **copy the template** and **fill in the placeholders based on the codebase**. The **copy** means do not modify any words in this template except for the placeholders.

## Template 

```markdown
# {Title}

{Description_Of_The_Project}

## MOST IMPORTANT RULES

- DO NOT modify AGENTS.md unless the user permits it by explicitly asking you to do so.
- When you adding new feature or fixing a bug, please consider about how to minimize the impact on the existing code, which means modify codes as less as possible.
- When you want to ask user for making decisions, if there is a `question` tool or `ask_user` tool, prefer to use it instead of asking the user directly. If there is no suitable tool, ask the user directly.
- Before making any changes, write a TODO list to remind yourself to implement the features later, if there is a `todo` tool, prefer to use it instead of writing the TODO list manually.
- Before you start writing code, you need to inform the user of the solution you intend to adopt. Only after discussing and confirming with the user should you begin the work. And also remember that DO NOT ASK ANY QUESTIONS IN SUBAGENTS.

## Run / Build / Lint / Test

{Run_Build_Lint_Test_Instructions}

## Code Style

{Code_Style_Instructions}

## Git Commit Message Style

The git commit message style should be composed of two parts: title and body. The title should be `<type>: <subject>` (such as `feat: add new feature` or `fix: fix bug`). The body should be the detailed description of the changes in list format.

It's important that DO NOT include any symbol like $ or ` in the title or body. This would cause the bash shell to interpret the title or body as a command or a code block.

```

The placeholder in the template is:

### 1. Title

The title of the project.

### 2. Description_Of_The_Project

A description of this project. A paragraph and brief directory structure of the project. Below is an example, just following the schema:

```markdown
This repo is ...

- `apps/`: frontend apps
  - `apps/web-editor/`: React editor SPA
  - `apps/portal/`: (placeholder) website entry/aggregator app
- `services/`: backend packages and services
- `tools/`: tools for the project
- `docs/`: documentation
```

### 3. Run_Build_Lint_Test_Instructions

Instructions for how to run the project, build the project, lint the project, and test the project.

### 4. Code_Style_Instructions

Code style of the project. Each language used in this project should have its own code style instructions.

## Constraints

Make sure that the number of lines in AGENTS.md does not exceed 150. If it does, you need to shorten the content.
