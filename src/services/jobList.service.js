const { Op } = require('sequelize');
const { sequelize, JobList, JobListMember, User } = require('../models');
const { ROLES } = require('../constants');
const AppError = require('../helpers/AppError');

/**
 * Lists every job list the user owns or is a member of, with member counts
 * and the caller's role.
 */
async function listForUser(user) {
  const memberships = await JobListMember.findAll({
    where: { user_id: user.id },
    attributes: ['job_list_id', 'role'],
  });
  const roleByListId = new Map(memberships.map((m) => [m.job_list_id, m.role]));
  const listIds = [...roleByListId.keys()];
  if (listIds.length === 0) return [];

  const lists = await JobList.findAll({
    where: { id: { [Op.in]: listIds } },
    include: [{ model: User, as: 'owner' }],
    order: [['created_at', 'DESC']],
  });

  // member counts in one grouped query
  const counts = await JobListMember.findAll({
    attributes: ['job_list_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    where: { job_list_id: { [Op.in]: listIds } },
    group: ['job_list_id'],
    raw: true,
  });
  const countByListId = new Map(counts.map((c) => [c.job_list_id, Number(c.count)]));

  return lists.map((l) =>
    l.toJSONPublic({
      role: roleByListId.get(l.id),
      memberCount: countByListId.get(l.id) || 0,
    })
  );
}

async function getByUuid(jobList, membership) {
  const count = await JobListMember.count({ where: { job_list_id: jobList.id } });
  return jobList.toJSONPublic({ role: membership.role, memberCount: count });
}

/**
 * Creates a list and, in the same transaction, an owner membership row.
 */
async function create(user, { title, description }) {
  return sequelize.transaction(async (transaction) => {
    const jobList = await JobList.create(
      {
        title,
        description: description || null,
        owner_id: user.id,
        created_by: user.id,
        updated_by: user.id,
      },
      { transaction }
    );

    await JobListMember.create(
      {
        job_list_id: jobList.id,
        user_id: user.id,
        role: ROLES.OWNER,
        invited_by: user.id,
      },
      { transaction }
    );

    // reload with owner association for the response
    const reloaded = await JobList.findByPk(jobList.id, {
      include: [{ model: User, as: 'owner' }],
      transaction,
    });
    return reloaded.toJSONPublic({ role: ROLES.OWNER, memberCount: 1 });
  });
}

async function update(jobList, user, { title, description }) {
  if (title !== undefined) jobList.title = title;
  if (description !== undefined) jobList.description = description || null;
  jobList.updated_by = user.id;
  await jobList.save();
  const count = await JobListMember.count({ where: { job_list_id: jobList.id } });
  return jobList.toJSONPublic({ role: ROLES.OWNER, memberCount: count });
}

async function remove(jobList) {
  // Soft-delete the list. Membership rows are kept; access is gated by the
  // (now soft-deleted) list, which no longer resolves in queries.
  await jobList.destroy();
}

module.exports = { listForUser, getByUuid, create, update, remove };
