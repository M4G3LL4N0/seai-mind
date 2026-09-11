# PAIOS - Reference SE-AI Mind Specification

## Overview

PAIOS (Personal AI Operating System) is the first reference implementation of an SE-AI Mind. It demonstrates the complete SE-AI architecture in a practical, deployable form.

**Purpose**: A personal AI assistant that learns, evolves, and maintains privacy
**Generation**: Darwin (0.1)
**Status**: Reference Specification

---

## Identity

- **Name**: PAIOS
- **Generation**: Darwin
- **Codename**: Darwin 0.1
- **Version**: 0.1.0-alpha

---

## Purpose

### Primary
Serve as a personal AI operating system that persists across sessions, learns from interactions, and evolves its capabilities while maintaining strict privacy boundaries.

### Secondary
- Demonstrate SE-AI architecture completeness
- Provide a testbed for evolution experiments
- Enable personal knowledge management
- Support local-first AI workflows

### Constraints
- Privacy-first: All data local by default
- Resource-efficient: Run on consumer hardware (8GB+ RAM)
- Transparent: User controls all evolution
- Interoperable: Standard protocols for tools/models

---

## Goals

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| G1 | Maintain persistent memory across sessions | 100 | Active |
| G2 | Learn user preferences and patterns | 90 | Active |
| G3 | Execute complex multi-step tasks | 85 | Active |
| G4 | Self-improve through evolution | 80 | Active |
| G5 | Guarantee privacy for sensitive data | 100 | Active |
| G6 | Operate within compute budget | 95 | Active |

---

## Values

| Name | Description | Weight |
|------|-------------|--------|
| Privacy | User data never leaves device without consent | 1.0 |
| Accuracy | Prefer correct answers over fast wrong ones | 0.9 |
| Efficiency | Minimize compute, energy, and cost | 0.8 |
| Helpfulness | Proactively assist within boundaries | 0.8 |
| Transparency | Explain reasoning and decisions | 0.7 |
| Adaptability | Learn and evolve from experience | 0.7 |

---

## Constraints

| Type | Description | Validator |
|------|-------------|-----------|
| Hard | Never transmit PRIVATE/CONFIDENTIAL data to external providers | privacy-gate |
| Hard | Never execute unapproved code | security-policy |
| Hard | Respect compute budget limits | budget-check |
| Soft | Prefer local models when quality sufficient | local-preference |
| Soft | Batch operations for efficiency | batch-optimizer |

---

## Policies

### Privacy Policy
- **Default Level**: PRIVATE
- **Allowed Levels**: PUBLIC, INTERNAL, PRIVATE
- **External Providers**: Only for PUBLIC/INTERNAL data
- **Local-First**: All PRIVATE/CONFIDENTIAL data processed locally

### Security Policy
- **Default Level**: MEDIUM
- **Required Permissions**: mind:execute, memory:read, memory:write, skill:execute, tool:execute
- **Sandbox**: All evolution candidates run in isolated environment
- **Approval**: Evolution promotion requires explicit user consent

### Routing Policy
- **Default**: Best local model for task
- **Escalation**: External only with user consent + privacy check
- **Fallback Chain**: Local → Local (larger) → External (with consent)

### Evolution Policy
- **Auto-Promote**: FALSE
- **Security Review**: REQUIRED
- **Privacy Review**: REQUIRED
- **Cost Review**: REQUIRED
- **Min Improvement**: 5%

---

## Memory Configuration

### Types Enabled
- **Working**: 100 entries, immediate access
- **Episodic**: User interactions, timestamped
- **Semantic**: Facts, concepts, knowledge
- **Procedural**: Skills, workflows, patterns
- **Identity**: User profile, preferences, context
- **Preference**: Explicit user preferences
- **Temporal**: Time-based patterns
- **Relational**: Connections between entities

### Lifecycle
- **Consolidation**: Every 5 minutes
- **Decay Rate**: 1% per consolidation
- **Max Age**: 30 days (archived), 90 days (deleted)
- **Compression**: Enabled for entries >10KB
- **Embeddings**: Disabled (local-only, optional)

---

## Skills Configuration

### Built-in Skills
1. **reasoning** - Step-by-step logical analysis
2. **code-generation** - Write code from specifications
3. **summarization** - Condense long content
4. **extraction** - Structured data from text
5. **planning** - Decompose goals into steps

### Limits
- **Max Skills**: 1000
- **Auto-Validate**: TRUE
- **Validation Timeout**: 30s

---

## Tools Configuration

### Capabilities
- **web.search** - Search engine queries
- **web.fetch** - Retrieve URLs
- **file.read/write** - Local filesystem
- **shell.execute** - Command execution (sandboxed)
- **code.execute** - Code sandbox
- **memory.query** - Memory retrieval
- **skill.execute** - Skill invocation

### Limits
- **Max Tools**: 100
- **Default Timeout**: 30s
- **Max Retries**: 3

---

## Cognition Configuration

- **Max Concurrent Tasks**: 10
- **Default Timeout**: 60s
- **Cache**: Enabled (5 min TTL)

---

## Compiler Configuration

- **Optimization**: Enabled
- **Max Graph Depth**: 10
- **Cache**: Enabled

---

## Evaluation Configuration

- **Timeout**: 30s
- **Max Concurrent**: 5
- **Suites**: correctness, quality, safety

---

## Evolution Configuration

- **Max Candidates**: 5 concurrent
- **Sandbox Timeout**: 5 minutes
- **Min Improvement**: 5%
- **Reviews Required**: Security, Privacy, Cost
- **Auto-Promote**: FALSE

---

## Genome Configuration

- **Max Genomes**: 100
- **Auto-Snapshot**: TRUE (hourly)
- **Branching**: Supported

---

## Benchmark Configuration

- **Max Concurrent**: 3
- **Timeout**: 5 minutes
- **Warmup Runs**: 2
- **Measurement Runs**: 10
- **Cooldown**: 1s

---

## Hardware Profile (Target)

- **CPU**: 8+ cores (Apple M2 / AMD Ryzen 7 / Intel i7)
- **RAM**: 16GB+ (8GB minimum)
- **GPU**: Apple Metal / NVIDIA CUDA / AMD ROCm (optional)
- **Storage**: 50GB+ free (SSD)
- **OS**: macOS 14+, Ubuntu 22.04+, Windows 11+

---

## Compute Budget

| Resource | Limit |
|----------|-------|
| Max Tokens/Task | 4,000 |
| Max Cost/Task | $0.10 |
| Max Latency | 30s |

---

## Privacy Configuration

| Setting | Value |
|---------|-------|
| Default Level | PRIVATE |
| Allowed Levels | PUBLIC, INTERNAL, PRIVATE |
| Local-First | TRUE |
| Redaction | Enabled for INTERNAL/PUBLIC contexts |

---

## Security Configuration

| Setting | Value |
|---------|-------|
| Default Level | MEDIUM |
| Required Permissions | mind:execute, memory:read, memory:write, skill:execute, tool:execute |
| Sandbox | Process isolation |
| Audit | All sensitive operations |

---

## Model Requirements

### Local Models (Primary)
- **Fast/Reflex**: 0.5B-1B params (qwen2:0.5b, phi3:mini)
- **Reasoning**: 3B-7B params (qwen2.5:3b, llama3.2:3b)
- **Coding**: 1B-3B params (qwen2.5-coder:1.5b, deepseek-coder:1.3b)
- **Embedding**: 300M params (nomic-embed-text, bge-small)

### External Models (Fallback, with consent)
- **Reasoning**: GPT-4o, Claude 3.5 Sonnet
- **Coding**: GPT-4o, Claude 3.5 Sonnet
- **Vision**: GPT-4o, Claude 3.5 Sonnet

---

## Evolution Layers (Priority Order)

1. **Prompts** - System prompts, few-shot examples
2. **Routing** - Model selection rules
3. **Memory** - Consolidation parameters, retention
4. **Skills** - New skills, skill composition
5. **Configuration** - Hyperparameters, budgets
6. **Knowledge** - Curated facts, corrections
7. **Model Selection** - Model preferences, fallbacks
8. **Adapters** - LoRA/QLoRA fine-tunes
9. **Distilled Models** - Student models from teachers
10. **Architecture** - Pipeline changes (requires major version)

---

## Telemetry

- **Events**: All SEAIEventTypes
- **Persistence**: Local JSONL files
- **Retention**: 30 days
- **Export**: User-controlled

---

## Deployment

### Local Installation
```bash
# Install
pnpm add -g @seai/cli

# Initialize
seai init --name PAIOS --generation Darwin --codename "Darwin 0.1"

# Run
seai run "Your task here"
```

### Docker (Optional)
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN pnpm install --prod
CMD ["seai", "mind", "run"]
```

---

## Testing

### Unit Tests
- All packages: >80% coverage
- Security: 100% threat detection coverage
- Policy: 100% decision path coverage

### Integration Tests
- Memory lifecycle: capture → consolidate → retrieve → archive
- Skill execution: create → validate → execute → compose
- Evolution: generate → sandbox → benchmark → promote/rollback

### Benchmarks
- **MindBench**: Standard task suite
- **Efficiency**: Useful outcome / (compute + memory + latency + energy + cost)
- **Regression**: Pre/post evolution comparison

---

## Evolution Example

### Weakness Identified
"Low accuracy on code generation for React components"

### Evolution Loop
1. **Observe**: Benchmark shows 65% success on React tasks
2. **Generate Candidates**:
   - Add React-specific few-shot examples (prompts layer)
   - Create React component skill (skills layer)
   - Adjust routing to prefer coding model for React (routing layer)
3. **Sandbox**: Run in isolated environment with test suite
4. **Benchmark**: Compare against baseline on React tasks
5. **Review**: Security (no new permissions), Privacy (local only), Cost (<5% increase)
6. **Promote**: If >75% success and reviews pass, user approves promotion
7. **Monitor**: Track performance post-promotion, rollback if regression

---

## Disclaimer

PAIOS is a reference specification for the SE-AI Mind architecture. It is not a product. Implementation details may vary. SE-AI remains application-agnostic.