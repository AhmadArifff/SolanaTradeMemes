#!/usr/bin/env node
/**
 * Session State Manager CLI for SolanaTradeMemes
 * 
 * Memeriksa, menampilkan, dan memvalidasi status sesi aktif untuk mencegah context drift antar-sesi multi-agen.
 * Penggunaan:
 *   node .agents/02-session-state/session-manager.js
 *   node .agents/02-session-state/session-manager.js --status
 */

const fs = require('node:fs');
const path = require('node:path');

const sessionFile = path.join(__dirname, 'active-session.json');

if (!fs.existsSync(sessionFile)) {
  console.error('[SessionManager] Error: active-session.json tidak ditemukan!');
  process.exit(1);
}

const session = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));

console.log('================================================================');
console.log('       SESSION STATE TRACKER - SOLANATRADEMEMES MONOREPO        ');
console.log('================================================================');
console.log(`Session ID    : ${session.session_id}`);
console.log(`Project       : ${session.project} (${session.tagline})`);
console.log(`Active Branch : ${session.active_branch}`);
console.log(`Status        : ${session.status}`);
console.log(`Current Sprint: ${session.current_sprint}`);
console.log(`Active Goal   : ${session.active_goal}`);
console.log(`Last Updated  : ${session.last_updated}`);
console.log('----------------------------------------------------------------');

console.log('\n[Milestone Terselesaikan (Completed)]:');
if (session.completed_milestones && session.completed_milestones.length > 0) {
  session.completed_milestones.forEach((m, idx) => {
    console.log(`  ${idx + 1}. [${m.status}] ${m.title}`);
    console.log(`     Ref: ${m.prd_sections.join(', ')} | Tgl: ${m.verified_at}`);
  });
} else {
  console.log('  (Belum ada milestone selesai)');
}

console.log('\n[Milestone Sedang Berjalan (In Progress)]:');
if (session.in_progress_milestones && session.in_progress_milestones.length > 0) {
  session.in_progress_milestones.forEach((m, idx) => {
    console.log(`  * [${m.status}] ${m.title}`);
    console.log(`    Ref: ${m.prd_sections.join(', ')}`);
  });
}

console.log('\n[Milestone Mendatang (Upcoming)]:');
if (session.upcoming_milestones && session.upcoming_milestones.length > 0) {
  session.upcoming_milestones.forEach((m, idx) => {
    console.log(`  - [${m.status}] ${m.title} (${m.prd_sections.join(', ')})`);
  });
}

console.log('\n[Batasan Arsitektur yang Dikunci (Established Constraints)]:');
if (session.established_constraints && session.established_constraints.length > 0) {
  session.established_constraints.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c}`);
  });
}

console.log('\n[Langkah Kerja Selanjutnya (Next Steps)]:');
if (session.next_actionable_steps && session.next_actionable_steps.length > 0) {
  session.next_actionable_steps.forEach((s, idx) => {
    console.log(`  -> ${s}`);
  });
}

console.log('\n================================================================');
console.log('                 SINKRONISASI SESI TERVALIDASI                  ');
console.log('================================================================\n');
