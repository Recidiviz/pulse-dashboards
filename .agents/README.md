# .agents

Agent-agnostic skill storage for this repo. Skills are prompt bundles — instructions and reference documents that extend an agent's behavior for specific tasks.

## Structure

Skills follow the [agent skills](https://agentskills.io/what-are-skills) convention:

```
.agents/
  skills/
    <skill-name>/
      SKILL.md          # Required: instructions + metadata
      scripts/          # Optional: executable code
      references/       # Optional: documentation
      assets/           # Optional: templates, resources
```

Agent-specific integrations symlink into this directory. For example, Claude Code loads skills from `.claude/skills/`, where each entry is a symlink pointing here:

```
.claude/skills/feature-sliced-design -> ../../.agents/skills/feature-sliced-design
```

## Lockfile

`skills-lock.json` at the repo root pins each skill to an upstream source and content hash, similar to a package lockfile:

```json
{
  "version": 1,
  "skills": {
    "feature-sliced-design": {
      "source": "feature-sliced/skills",
      "sourceType": "github",
      "computedHash": "..."
    }
  }
}
```

## Adding a skill

Skills can be added via the [`skills` CLI](https://skills.sh) or manually:

```bash
npx skills add <github-org>/<repo>
```

This vendors the skill into `.agents/skills/` and updates `skills-lock.json`. Then symlink it for any agent integrations, e.g. for Claude:

```bash
ln -s ../../.agents/skills/<skill-name> .claude/skills/<skill-name>
```

## Updating a skill

```bash
npx skills update <skill-name>
```
