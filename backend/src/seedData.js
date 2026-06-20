const seedTopics = [
  // PHASE 0
  {
    phase: "PHASE 0 — Buffer & Setup (Jun 20 – Jun 22)",
    week: "Week: Setup",
    title: "Create tracker (this counts!) + organize study space"
  },
  {
    phase: "PHASE 0 — Buffer & Setup (Jun 20 – Jun 22)",
    week: "Week: Setup",
    title: "Light revision: C basics, recursion, basic math"
  },
  {
    phase: "PHASE 0 — Buffer & Setup (Jun 20 – Jun 22)",
    week: "Week: Setup",
    title: "Bookmark PYQ sources, plan Week 1 topics"
  },

  // PHASE 1
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 1 (Jun 23-29) — PDS Part 1",
    title: "C programming + recursion"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 1 (Jun 23-29) — PDS Part 1",
    title: "Arrays"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 1 (Jun 23-29) — PDS Part 1",
    title: "Time complexity analysis"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 1 (Jun 23-29) — PDS Part 1",
    title: "Recurrence relations"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 1 (Jun 23-29) — PDS Part 1",
    title: "PYQs on above topics"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 2 (Jun 30-Jul 6) — PDS Part 2",
    title: "Stacks & Queues"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 2 (Jun 30-Jul 6) — PDS Part 2",
    title: "Linked Lists"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 2 (Jun 30-Jul 6) — PDS Part 2",
    title: "Trees & Binary Search Trees"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 2 (Jun 30-Jul 6) — PDS Part 2",
    title: "Heaps"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 2 (Jun 30-Jul 6) — PDS Part 2",
    title: "PYQs on above topics"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 3 (Jul 7-13) — Algorithms Part 1",
    title: "Sorting"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 3 (Jul 7-13) — Algorithms Part 1",
    title: "Searching"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 3 (Jul 7-13) — Algorithms Part 1",
    title: "Hashing"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 3 (Jul 7-13) — Algorithms Part 1",
    title: "Asymptotic complexity"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 3 (Jul 7-13) — Algorithms Part 1",
    title: "PYQs on above topics"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 4 (Jul 14-20) — Algorithms Part 2",
    title: "Greedy + DP"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 4 (Jul 14-20) — Algorithms Part 2",
    title: "Divide & Conquer"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 4 (Jul 14-20) — Algorithms Part 2",
    title: "Graph traversals, MST, shortest paths"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 4 (Jul 14-20) — Algorithms Part 2",
    title: "Mixed PYQ set (week end)"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 5 (Jul 21-27) — Discrete Maths Part 1",
    title: "Sets, Relations, Functions"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 5 (Jul 21-27) — Discrete Maths Part 1",
    title: "Propositional & Predicate Logic"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 5 (Jul 21-27) — Discrete Maths Part 1",
    title: "Boolean Algebra"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 5 (Jul 21-27) — Discrete Maths Part 1",
    title: "PYQs on above topics"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 6 (Jul 28-Aug 3) — Discrete Maths Part 2",
    title: "Graph theory (DFS/BFS, connectivity, colouring, matching)"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 6 (Jul 28-Aug 3) — Discrete Maths Part 2",
    title: "Combinatorics (P&C, generating functions)"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 6 (Jul 28-Aug 3) — Discrete Maths Part 2",
    title: "End-of-week PYQ set"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 7 (Aug 4-10) — Eng. Maths + OS Part 1",
    title: "Linear Algebra (eigenvalues, system of equations)"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 7 (Aug 4-10) — Eng. Maths + OS Part 1",
    title: "Probability (Bayes, conditional)"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 7 (Aug 4-10) — Eng. Maths + OS Part 1",
    title: "OS: Process Scheduling"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 7 (Aug 4-10) — Eng. Maths + OS Part 1",
    title: "PYQs on above topics"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 8 (Aug 11-17) — OS Part 2 + CN Part 1",
    title: "OS: Deadlock"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 8 (Aug 11-17) — OS Part 2 + CN Part 1",
    title: "OS: Memory Management + Page Replacement"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 8 (Aug 11-17) — OS Part 2 + CN Part 1",
    title: "OS: Disk Scheduling"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 8 (Aug 11-17) — OS Part 2 + CN Part 1",
    title: "CN: OSI/TCP-IP layering"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 8 (Aug 11-17) — OS Part 2 + CN Part 1",
    title: "CN: IP addressing & subnetting"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 9 (Aug 18-23) — CN Part 2 + Catch-up",
    title: "CN: Sliding window, TCP"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 9 (Aug 18-23) — CN Part 2 + Catch-up",
    title: "CN: Application layer protocols"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 9 (Aug 18-23) — CN Part 2 + Catch-up",
    title: "Catch up any slipped topic"
  },
  {
    phase: "PHASE 1 — First Full Pass (Jun 23 – Aug 23)",
    week: "Week 9 (Aug 18-23) — CN Part 2 + Catch-up",
    title: "Full PYQ revision pass, Weeks 1-8"
  },

  // PHASE 2
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 10 (Aug 24-30) — DBMS Part 1",
    title: "ER-model"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 10 (Aug 24-30) — DBMS Part 1",
    title: "Relational algebra + relational model"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 10 (Aug 24-30) — DBMS Part 1",
    title: "SQL basics"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 11 (Aug 31-Sep 6) — DBMS Part 2",
    title: "SQL: joins, group-by, subqueries (heavy practice)"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 11 (Aug 31-Sep 6) — DBMS Part 2",
    title: "Normalization 1NF–BCNF"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 11 (Aug 31-Sep 6) — DBMS Part 2",
    title: "Indexing (B/B+ trees)"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 11 (Aug 31-Sep 6) — DBMS Part 2",
    title: "Transactions & Concurrency"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 12 (Sep 7-13) — Computer Organization Part 1",
    title: "Machine instructions + addressing modes"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 12 (Sep 7-13) — Computer Organization Part 1",
    title: "ALU, Datapath, Control unit"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 13 (Sep 14-20) — Computer Organization Part 2",
    title: "Pipelining + hazards"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 13 (Sep 14-20) — Computer Organization Part 2",
    title: "Memory hierarchy + cache mapping"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 13 (Sep 14-20) — Computer Organization Part 2",
    title: "I/O interfacing (interrupt/DMA)"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 14 (Sep 21-27) — Theory of Computation",
    title: "Regular expressions & finite automata"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 14 (Sep 21-27) — Theory of Computation",
    title: "Context-free grammars + PDA"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 14 (Sep 21-27) — Theory of Computation",
    title: "Turing machines basics"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 15 (Sep 28-Oct 4) — Digital Logic + Compiler Design",
    title: "Number systems + Boolean algebra"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 15 (Sep 28-Oct 4) — Digital Logic + Compiler Design",
    title: "Combinational/sequential circuits + minimization"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 15 (Sep 28-Oct 4) — Digital Logic + Compiler Design",
    title: "Compiler: Grammar, Parsing (if time permits)"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 16-17 (Oct 5-15) — Full Revision + Mocks",
    title: "Re-attempt PYQs across all subjects"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 16-17 (Oct 5-15) — Full Revision + Mocks",
    title: "Mixed-topic problem sets"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 16-17 (Oct 5-15) — Full Revision + Mocks",
    title: "Subject-wise mini mock tests"
  },
  {
    phase: "PHASE 2 — Second Pass + Practice Depth (Aug 24 – Oct 15)",
    week: "Week 16-17 (Oct 5-15) — Full Revision + Mocks",
    title: "Start error log"
  },

  // PHASE 3
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Oct 16-31",
    title: "Full-length mocks, 2-3 per week"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Oct 16-31",
    title: "Review every wrong answer, equal time to test itself"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Oct 16-31",
    title: "Log every mistake with reason"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Nov 1-15",
    title: "Mocks every alternate day"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Nov 1-15",
    title: "Focused 1-2 hr sessions on weak subjects from error log"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Nov 1-15",
    title: "Daily GA practice continues"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Nov 16-25",
    title: "Pure revision: formula sheets + short notes"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Nov 16-25",
    title: "Final pass through error log"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Nov 16-25",
    title: "2-3 more full mocks (sharpening, not learning)"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Nov 26-30",
    title: "Light revision only, no new content"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Nov 26-30",
    title: "No new mocks"
  },
  {
    phase: "PHASE 3 — Mock Test Phase (Oct 16 – Nov 30)",
    week: "Period: Nov 26-30",
    title: "Rest, sleep, trust the work"
  }
];

module.exports = { seedTopics };
