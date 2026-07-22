'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Seeds a coherent demo dataset:
 *   3 users (alice/bob/carol @demo.test, password: password123)
 *   1 job list "Frontend Roles 2027" owned by Alice, with Bob & Carol as members
 *   3 jobs, and a couple of per-user statuses to make the dashboard interesting.
 *
 * Idempotent: removes any prior demo rows (by the demo emails / list title)
 * before inserting, so it can be re-run safely.
 */

const DEMO_EMAILS = ['alice@demo.test', 'bob@demo.test', 'carol@demo.test'];
const DEMO_LIST_TITLE = 'Frontend Roles 2027';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const sequelize = queryInterface.sequelize;

    // Clean any prior demo data first (children cascade via FKs).
    await cleanup(queryInterface);

    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [
      { name: 'Alice Tan', email: 'alice@demo.test' },
      { name: 'Bob Lee', email: 'bob@demo.test' },
      { name: 'Carol Ng', email: 'carol@demo.test' },
    ].map((u) => ({
      uuid: uuidv4(),
      name: u.name,
      email: u.email,
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('users', users);

    const [userRows] = await sequelize.query(
      `SELECT id, email FROM users WHERE email IN (:emails)`,
      { replacements: { emails: DEMO_EMAILS } }
    );
    const idByEmail = Object.fromEntries(userRows.map((r) => [r.email, r.id]));
    const alice = idByEmail['alice@demo.test'];
    const bob = idByEmail['bob@demo.test'];
    const carol = idByEmail['carol@demo.test'];

    // Job list owned by Alice.
    const listUuid = uuidv4();
    await queryInterface.bulkInsert('job_lists', [
      {
        uuid: listUuid,
        title: DEMO_LIST_TITLE,
        description: 'Curated frontend openings we are applying to together.',
        owner_id: alice,
        created_by: alice,
        updated_by: alice,
        created_at: now,
        updated_at: now,
      },
    ]);
    const [[listRow]] = await sequelize.query(
      `SELECT id FROM job_lists WHERE uuid = :uuid`,
      { replacements: { uuid: listUuid } }
    );
    const listId = listRow.id;

    // Memberships: Alice owner, Bob & Carol members.
    await queryInterface.bulkInsert('job_list_members', [
      { job_list_id: listId, user_id: alice, role: 'owner', invited_by: alice, created_at: now },
      { job_list_id: listId, user_id: bob, role: 'member', invited_by: alice, created_at: now },
      { job_list_id: listId, user_id: carol, role: 'member', invited_by: alice, created_at: now },
    ]);

    // Jobs.
    const jobs = [
      {
        company_name: 'Stripe',
        job_title: 'Senior Frontend Engineer',
        original_url: 'https://stripe.com/jobs/123',
        platform: 'company_website',
        location: 'Remote',
        salary: 'USD 150k',
        created_by: alice,
      },
      {
        company_name: 'Grab',
        job_title: 'Vue.js Developer',
        original_url: 'https://linkedin.com/jobs/456',
        platform: 'linkedin',
        location: 'Kuala Lumpur',
        salary: 'RM 9k',
        created_by: bob,
      },
      {
        company_name: 'Shopee',
        job_title: 'UI Engineer',
        original_url: 'https://jobstreet.com/jobs/789',
        platform: 'jobstreet',
        location: 'Singapore',
        salary: null,
        created_by: carol,
      },
    ].map((j) => ({
      uuid: uuidv4(),
      job_list_id: listId,
      company_name: j.company_name,
      job_title: j.job_title,
      original_url: j.original_url,
      platform: j.platform,
      location: j.location,
      salary: j.salary,
      notes: null,
      expiry_date: null,
      created_by: j.created_by,
      updated_by: j.created_by,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('jobs', jobs);

    const [jobRows] = await sequelize.query(
      `SELECT id, job_title FROM jobs WHERE job_list_id = :listId`,
      { replacements: { listId } }
    );
    const jobIdByTitle = Object.fromEntries(jobRows.map((r) => [r.job_title, r.id]));

    // A few per-user statuses (independent tracking).
    await queryInterface.bulkInsert('user_job_status', [
      {
        job_id: jobIdByTitle['Senior Frontend Engineer'],
        user_id: alice,
        status: 'applied',
        applied_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        job_id: jobIdByTitle['Senior Frontend Engineer'],
        user_id: bob,
        status: 'interview',
        applied_at: now,
        created_at: now,
        updated_at: now,
      },
      {
        job_id: jobIdByTitle['Vue.js Developer'],
        user_id: bob,
        status: 'offer',
        applied_at: now,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await cleanup(queryInterface);
  },
};

/** Removes demo rows. Children (members, jobs, statuses) cascade from FKs. */
async function cleanup(queryInterface) {
  const sequelize = queryInterface.sequelize;
  // Hard-delete demo job lists (paranoid tables ignore soft-delete here).
  await sequelize.query(`DELETE FROM job_lists WHERE title = :title`, {
    replacements: { title: DEMO_LIST_TITLE },
  });
  await sequelize.query(`DELETE FROM users WHERE email IN (:emails)`, {
    replacements: { emails: DEMO_EMAILS },
  });
}
