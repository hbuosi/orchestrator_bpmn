# Control-Flow Pattern Reference — v1.0

This is a lightweight reference card for annotating Standard Subflow Library patterns with Workflow Control-Flow Pattern (WCP) codes from Van der Aalst's taxonomy. It covers the WCP codes most commonly encountered in business service workflow decomposition.

## Purpose

Every standard subflow pattern in the library should carry a WCP annotation that identifies the control-flow primitives it implements. This annotation enables:
- structural deduplication (detecting when two business-semantic patterns share the same control-flow structure)
- formal auditability against established workflow theory
- classification of newly discovered patterns against known structural types

## How to annotate

For each standard subflow, identify which WCP codes describe its control-flow structure. A single subflow typically combines 2–5 WCP primitives. Record the WCP codes as a comma-separated list in the WCP Annotation field of the Standard Subflow Library.

## Core WCP Codes (most frequently used in this framework)

### Basic Control-Flow

| WCP | Name | Description | Typical BT Context |
|---|---|---|---|
| WCP-1 | Sequence | Execute activities in order | All linear module chains (INT, CLS) |
| WCP-4 | Exclusive Choice | Choose one path based on data | Approval decisions (APR1, APR2), validation gates (VAL) |
| WCP-5 | Simple Merge | Merge branches after exclusive choice | Rejoin after Yes/No decision |
| WCP-10 | Arbitrary Cycle | Loop back to earlier step | Rework/resubmission loops (REV→EXC→re-entry) |

### Advanced Branching and Synchronisation

| WCP | Name | Description | Typical BT Context |
|---|---|---|---|
| WCP-2 | Parallel Split | Execute activities concurrently | Parallel stakeholder engagement (STK), parallel approvals |
| WCP-3 | Synchronisation | Wait for all parallel branches | Rejoin after parallel activities complete |
| WCP-6 | Multi-Choice | Activate one or more branches | Variant-driven orchestrators with optional modules |
| WCP-7 | Structured Synchronising Merge | Merge branches from multi-choice | Rejoin after variant-specific modules |
| WCP-9 | Structured Discriminator | Proceed after first of N branches completes | First-response patterns in external referrals |

### Iteration

| WCP | Name | Description | Typical BT Context |
|---|---|---|---|
| WCP-10 | Arbitrary Cycle | Unrestricted loop | Rework loops with iteration caps |
| WCP-21 | Structured Loop | Repeat block while condition holds | Chase/follow-up cycles (DLC) |

### State-Based

| WCP | Name | Description | Typical BT Context |
|---|---|---|---|
| WCP-16 | Deferred Choice | Branch based on environment event | Timer-based escalation vs normal completion |
| WCP-18 | Milestone | Activity enabled only in specific state | SLA checkpoint triggers, stage-gated approvals |

### Cancellation and Termination

| WCP | Name | Description | Typical BT Context |
|---|---|---|---|
| WCP-19 | Cancel Activity | Withdraw a running activity | Timeout/expiry paths (withdrawal, auto-close) |
| WCP-20 | Cancel Case | Terminate entire case | End – Withdrawn, End – Cancelled |
| WCP-11 | Implicit Termination | Terminate when nothing remains | Natural closure after all paths complete |

## Common WCP Combinations for Standard Subflow Families

| Family | Typical WCP Combination | Explanation |
|---|---|---|
| INT-Basic | WCP-1 | Pure sequence: submit → log → timer → acknowledge |
| INT-Standard | WCP-1, WCP-4, WCP-5, WCP-10 | Sequence with validation gate; exclusive choice on completeness; rework loop for resubmission |
| APR1-Simple | WCP-1, WCP-4, WCP-5 | Sequence into approval decision; exclusive choice (approve/reject); merge |
| APR1-WithEscalation | WCP-1, WCP-4, WCP-5, WCP-10, WCP-16 | As APR1-Simple plus rework loop and deferred choice for timeout escalation |
| APR2-Simple | WCP-1, WCP-4, WCP-5 | Same as APR1-Simple but for L2 authority |
| CLS-Standard | WCP-1 | Pure sequence: compile → notify → archive |
| TRK-Full | WCP-1, WCP-18 | Sequence with milestone-gated checkpoints |
| EXT-Standard | WCP-1, WCP-16, WCP-19 | Sequence with deferred choice (response vs timeout); cancel on expiry |
| STK-Internal | WCP-1, WCP-2, WCP-3 | Sequence with possible parallel engagement; synchronise before proceeding |

## Usage rules

1. Annotate at the pattern level, not the instance level. The WCP annotation describes the structural archetype, not service-specific configuration.
2. Use the minimum set of WCP codes that fully describes the control-flow structure. Do not over-annotate.
3. If a pattern's control-flow structure does not match any combination of the codes above, check the full Van der Aalst catalogue (workflowpatterns.com/patterns/control/) for the appropriate WCP code.
4. WCP annotations are reviewed during consolidation passes. If two patterns share the same WCP annotation but different Standard IDs, they are candidates for merge evaluation.
