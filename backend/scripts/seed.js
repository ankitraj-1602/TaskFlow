/**
 * Seed script — generates 50k+ realistic records for load testing.
 *
 * Usage:
 *   node scripts/seed.js           # seed the DB
 *   node scripts/seed.js --clean   # delete all seeded data first
 *   node scripts/seed.js --clean-only
 */

require('dotenv').config();
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

// ─── Config ────────────────────────────────────────
const CONFIG = {
  USERS: 100,
  WORKSPACES: 20,
  MEMBERS_PER_WORKSPACE: 25,     // 20 * 25 = 500 memberships
  PROJECTS_PER_WORKSPACE: 10,    // 20 * 10 = 200 projects
  TASKS_PER_PROJECT: 250,        // 200 * 250 = 50,000 tasks
  COMMENT_CHANCE: 0.1,           // 10% tasks get a comment → 5k comments
  BATCH_SIZE: 1000,
  SEED_EMAIL_SUFFIX: '@seed.dev', // so we can identify + clean seeded users
};

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'];
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'];
const ROLES = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];

// ─── Utilities ─────────────────────────────────────
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);
const time = (label, fn) => {
  const start = Date.now();
  return Promise.resolve(fn()).then((result) => {
    log(`⏱️  ${label} took ${Date.now() - start}ms`);
    return result;
  });
};

const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Random pick
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Random int
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Cleanup ───────────────────────────────────────
async function cleanSeedData() {
  log('🧹 Cleaning previous seed data...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete users with seed suffix — cascades to everything else
    const result = await client.query(
      `DELETE FROM users WHERE email LIKE $1 RETURNING id`,
      [`%${CONFIG.SEED_EMAIL_SUFFIX}`]
    );
    log(`   Deleted ${result.rowCount} seed users (cascades to all their data)`);

    // Also clean any orphan workspaces (edge case)
    await client.query(
      `DELETE FROM workspaces WHERE name LIKE '[SEED]%'`
    );

    await client.query('COMMIT');
    log('✅ Cleanup complete');
  } catch (error) {
    await client.query('ROLLBACK');
    log(`❌ Cleanup failed: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

// ─── Seeding Functions ─────────────────────────────

async function seedUsers() {
  log(`👥 Seeding ${CONFIG.USERS} users...`);

  // Hash once, reuse for all users (bcrypt is slow — hashing 100 times = 10s)
  const passwordHash = await bcrypt.hash('Test@123456', 10);

  const users = [];
  for (let i = 0; i < CONFIG.USERS; i++) {
    users.push({
      email: `seeduser${i}${CONFIG.SEED_EMAIL_SUFFIX}`,
      password_hash: passwordHash,
      name: faker.person.fullName(),
      job_title: faker.person.jobTitle(),
      timezone: 'UTC',
      is_email_verified: true,
    });
  }

  // Batch insert
  const ids = [];
  for (const batch of chunk(users, CONFIG.BATCH_SIZE)) {
    const values = [];
    const placeholders = batch.map((u, idx) => {
      const base = idx * 6;
      values.push(
        u.email,
        u.password_hash,
        u.name,
        u.job_title,
        u.timezone,
        u.is_email_verified
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    });

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, job_title, timezone, is_email_verified)
       VALUES ${placeholders.join(',')}
       RETURNING id`,
      values
    );
    ids.push(...result.rows.map((r) => r.id));
  }

  log(`✅ Created ${ids.length} users`);
  return ids;
}

async function seedWorkspaces(userIds) {
  log(`🏢 Seeding ${CONFIG.WORKSPACES} workspaces...`);

  const workspaceIds = [];

  for (let i = 0; i < CONFIG.WORKSPACES; i++) {
    const ownerId = userIds[i % userIds.length];
    const name = `[SEED] ${faker.company.name()}`;
    const slug = `seed-ws-${i}-${faker.string.alphanumeric(6).toLowerCase()}`;

    const result = await pool.query(
      `INSERT INTO workspaces (name, slug, description, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, slug, faker.company.catchPhrase(), ownerId]
    );
    workspaceIds.push({ id: result.rows[0].id, ownerId });
  }

  log(`✅ Created ${workspaceIds.length} workspaces`);
  return workspaceIds;
}

async function seedWorkspaceMembers(workspaces, userIds) {
  log(`👥 Seeding workspace members...`);

  let total = 0;

  for (const workspace of workspaces) {
    // Owner is already a member with OWNER role
    const members = [
      { userId: workspace.ownerId, role: 'OWNER' },
    ];

    // Add random others
    const shuffled = [...userIds].sort(() => Math.random() - 0.5);
    const others = shuffled
      .filter((id) => id !== workspace.ownerId)
      .slice(0, CONFIG.MEMBERS_PER_WORKSPACE - 1);

    for (const userId of others) {
      members.push({ userId, role: pick(ROLES) });
    }

    // Batch insert
    const values = [];
    const placeholders = members.map((m, idx) => {
      const base = idx * 3;
      values.push(workspace.id, m.userId, m.role);
      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    });

    await pool.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ${placeholders.join(',')}
       ON CONFLICT (workspace_id, user_id) DO NOTHING`,
      values
    );

    total += members.length;
  }

  log(`✅ Created ${total} workspace memberships`);
}

async function seedProjects(workspaces, userIds) {
  log(`📁 Seeding projects...`);

  const projects = [];

  for (const workspace of workspaces) {
    for (let i = 0; i < CONFIG.PROJECTS_PER_WORKSPACE; i++) {
      const createdById = workspace.ownerId;
      const ownerId = pick(userIds);

      const result = await pool.query(
        `INSERT INTO projects (name, description, status, start_date, due_date, workspace_id, created_by_id, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          faker.commerce.productName() + ' Project',
          faker.commerce.productDescription(),
          pick(PROJECT_STATUSES),
          faker.date.past({ years: 1 }),
          faker.date.future({ years: 1 }),
          workspace.id,
          createdById,
          ownerId,
        ]
      );

      projects.push({
        id: result.rows[0].id,
        workspaceId: workspace.id,
      });
    }
  }

  log(`✅ Created ${projects.length} projects`);
  return projects;
}

async function seedProjectMembers(projects) {
  log(`👥 Seeding project members...`);

  let total = 0;

  for (const project of projects) {
    // Get workspace members for this project
    const { rows: workspaceMembers } = await pool.query(
      `SELECT id, user_id, role FROM workspace_members WHERE workspace_id = $1 LIMIT 10`,
      [project.workspaceId]
    );

    if (workspaceMembers.length === 0) continue;

    const values = [];
    const placeholders = workspaceMembers.map((wm, idx) => {
      const base = idx * 3;
      values.push(project.id, wm.id, wm.role === 'OWNER' ? 'MANAGER' : wm.role);
      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    });

    await pool.query(
      `INSERT INTO project_members (project_id, workspace_member_id, role)
       VALUES ${placeholders.join(',')}
       ON CONFLICT (project_id, workspace_member_id) DO NOTHING`,
      values
    );

    total += workspaceMembers.length;
  }

  log(`✅ Created ${total} project memberships`);
}

async function seedTasks(projects) {
  log(`✅ Seeding ${CONFIG.TASKS_PER_PROJECT} tasks per project (${projects.length * CONFIG.TASKS_PER_PROJECT} total)...`);

  let totalCreated = 0;
  const allTaskIds = [];

  for (let pIdx = 0; pIdx < projects.length; pIdx++) {
    const project = projects[pIdx];

    // Get workspace members for assignment
    const { rows: members } = await pool.query(
      `SELECT id FROM workspace_members WHERE workspace_id = $1`,
      [project.workspaceId]
    );

    if (members.length === 0) continue;

    const memberIds = members.map((m) => m.id);
    const createdById = project.workspaceId; // will be overwritten by actual user id

    // Get the workspace owner as creator
    const { rows: workspace } = await pool.query(
      `SELECT owner_id FROM workspaces WHERE id = $1`,
      [project.workspaceId]
    );
    const creatorId = workspace[0].owner_id;

    // Build all tasks for this project in one batch
    const tasks = [];
    for (let i = 0; i < CONFIG.TASKS_PER_PROJECT; i++) {
      const status = pick(TASK_STATUSES);
      const isDone = status === 'DONE';

      tasks.push({
        title: faker.hacker.phrase().slice(0, 200),
        description: faker.lorem.paragraphs(randInt(1, 3)),
        status,
        priority: pick(TASK_PRIORITIES),
        dueDate: faker.date.future({ years: 1 }),
        storyPoints: randInt(1, 13),
        position: i + 1,
        projectId: project.id,
        createdById: creatorId,
        assigneeId: Math.random() > 0.2 ? pick(memberIds) : null,
        reporterId: creatorId,
        completedAt: isDone ? faker.date.recent({ days: 30 }) : null,
      });
    }

    // Insert in sub-batches of 1000
    for (const batch of chunk(tasks, CONFIG.BATCH_SIZE)) {
      const values = [];
      const placeholders = batch.map((t, idx) => {
        const base = idx * 12;
        values.push(
          t.title,
          t.description,
          t.status,
          t.priority,
          t.dueDate,
          t.storyPoints,
          t.position,
          t.projectId,
          t.createdById,
          t.assigneeId,
          t.reporterId,
          t.completedAt
        );
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12})`;
      });

      const result = await pool.query(
        `INSERT INTO tasks (
          title, description, status, priority, due_date, story_points,
          position, project_id, created_by_id, assignee_id, reporter_id, completed_at
        ) VALUES ${placeholders.join(',')}
        RETURNING id`,
        values
      );

      allTaskIds.push(...result.rows.map((r) => r.id));
      totalCreated += result.rows.length;
    }

    // Log progress every 20 projects
    if ((pIdx + 1) % 20 === 0) {
      log(`   Progress: ${pIdx + 1}/${projects.length} projects, ${totalCreated} tasks`);
    }
  }

  log(`✅ Created ${totalCreated} tasks`);
  return allTaskIds;
}

async function seedComments(taskIds, userIds) {
  const commentCount = Math.floor(taskIds.length * CONFIG.COMMENT_CHANCE);
  log(`💬 Seeding ~${commentCount} comments...`);

  const comments = [];
  const sampleTaskIds = [...taskIds].sort(() => Math.random() - 0.5).slice(0, commentCount);

  for (const taskId of sampleTaskIds) {
    const numComments = randInt(1, 3);
    for (let i = 0; i < numComments; i++) {
      comments.push({
        taskId,
        authorId: pick(userIds),
        content: faker.lorem.sentence(),
      });
    }
  }

  let created = 0;
  for (const batch of chunk(comments, CONFIG.BATCH_SIZE)) {
    const values = [];
    const placeholders = batch.map((c, idx) => {
      const base = idx * 3;
      values.push(c.content, c.taskId, c.authorId);
      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    });

    await pool.query(
      `INSERT INTO comments (content, task_id, author_id)
       VALUES ${placeholders.join(',')}`,
      values
    );
    created += batch.length;
  }

  log(`✅ Created ${created} comments`);
}

// ─── Main ──────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes('--clean') || args.includes('--clean-only');
  const cleanOnly = args.includes('--clean-only');

  try {
    log('🚀 Starting seed script...');
    log(`Config: ${JSON.stringify(CONFIG, null, 2)}`);

    if (shouldClean) {
      await cleanSeedData();
    }

    if (cleanOnly) {
      log('✅ Clean-only mode done');
      process.exit(0);
    }

    // Verify tables exist
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'workspaces', 'workspace_members', 'projects', 'project_members', 'tasks', 'comments')
    `);

    if (tableCheck.rows.length < 7) {
      throw new Error('Missing tables. Run migrations first.');
    }

    const startTotal = Date.now();

    // Seed in order
    const userIds = await time('seedUsers', () => seedUsers());
    const workspaces = await time('seedWorkspaces', () => seedWorkspaces(userIds));
    await time('seedWorkspaceMembers', () => seedWorkspaceMembers(workspaces, userIds));
    const projects = await time('seedProjects', () => seedProjects(workspaces, userIds));
    await time('seedProjectMembers', () => seedProjectMembers(projects));
    const taskIds = await time('seedTasks', () => seedTasks(projects));
    await time('seedComments', () => seedComments(taskIds, userIds));

    const totalTime = ((Date.now() - startTotal) / 1000).toFixed(2);
    log(`🎉 Seeding complete in ${totalTime}s!`);

    // Summary
    const summary = await pool.query(`
      SELECT 'users' as table, COUNT(*) FROM users WHERE email LIKE '%${CONFIG.SEED_EMAIL_SUFFIX}'
      UNION ALL SELECT 'workspaces', COUNT(*) FROM workspaces WHERE name LIKE '[SEED]%'
      UNION ALL SELECT 'projects', COUNT(*) FROM projects WHERE name LIKE '%Project'
      UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
      UNION ALL SELECT 'comments', COUNT(*) FROM comments
    `);

    console.log('\n📊 Database summary:');
    console.table(summary.rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

main();