# SE-AI Mind — Genome Model

**Date:** 2025-09-08

---

## Design Principle

The genome represents the versioned state of a Mind.
It must be compact, diffable, and restorable.

---

## Genome Structure

```typescript
interface Genome {
  id: string;
  mindId: string;
  version: GenomeVersion;
  status: 'active' | 'archived' | 'branched';
  
  // What the mind knows and can do
  baseModels: ModelConfig[];
  adapters: AdapterConfig[];
  prompts: PromptConfig[];
  skills: SkillRef[];
  tools: ToolRef[];
  policies: PolicyRef[];
  routing: RoutingConfig;
  evaluators: EvaluatorRef[];
  knowledge: KnowledgeRef[];
  memoryConfig: MemoryConfig;
  
  // Lineage
  lineage: string[];
  parentGenomeId?: string;
  branch?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  description?: string;
  tags: string[];
}
```

---

## Genome Operations

### SNAPSHOT
Create a point-in-time copy of the genome.

### DIFF
Compare two genomes and show what changed.

### RESTORE
Revert to a previous genome version.

### BRANCH
Create a parallel evolution path.

### PROMOTE
Merge a branch back into the main line.

### ROLLBACK
Revert to a known-good state.

---

## Version Numbering

```typescript
interface GenomeVersion {
  major: number;  // Breaking changes
  minor: number;  // New features
  patch: number;  // Bug fixes
}
```

---

## Lineage Tracking

Every genome records its ancestry:
- Parent genome ID
- Branch name (if applicable)
- Full lineage chain

This allows:
- Tracing evolution history
- Understanding what changed
- Rolling back to any point

---

## Genome Diff

```typescript
interface GenomeDiff {
  genomeA: string;
  genomeB: string;
  additions: DiffEntry[];
  deletions: DiffEntry[];
  modifications: DiffEntry[];
}
```

Each diff entry includes:
- Layer (skills, tools, prompts, etc.)
- Key (what changed)
- Old value
- New value

---

## Genome as Mind DNA

The genome is the mind's DNA:
- It encodes what the mind knows
- It encodes what the mind can do
- It evolves over time
- It can be branched and merged
- It can be rolled back

---

*Genome model defined 2025-09-08.*