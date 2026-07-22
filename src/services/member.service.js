const { JobListMember, User } = require('../models');
const { ROLES } = require('../constants');
const AppError = require('../helpers/AppError');

/**
 * Shapes a JobListMember (with its user eager-loaded) for API output.
 */
function toPublic(member) {
  return {
    uuid: member.user.uuid,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
    joinedAt: member.created_at,
  };
}

async function list(jobList) {
  const members = await JobListMember.findAll({
    where: { job_list_id: jobList.id },
    include: [{ model: User, as: 'user' }],
    order: [
      ['role', 'ASC'], // owner first
      ['created_at', 'ASC'],
    ],
  });
  return members.map(toPublic);
}

/**
 * Invites an existing user (looked up by email) as a member of the list.
 * Owner-only — enforced by the route middleware.
 */
async function invite(jobList, inviter, email) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw AppError.notFound('No account found with that email');
  }

  const existing = await JobListMember.findOne({
    where: { job_list_id: jobList.id, user_id: user.id },
  });
  if (existing) {
    throw AppError.conflict('This user is already a member of the list');
  }

  const member = await JobListMember.create({
    job_list_id: jobList.id,
    user_id: user.id,
    role: ROLES.MEMBER,
    invited_by: inviter.id,
  });
  member.user = user;
  return toPublic(member);
}

/**
 * Removes a member (by their user uuid) from the list. The owner can never
 * be removed — ownership transfer would be a separate future feature.
 */
async function remove(jobList, userUuid) {
  const user = await User.findOne({ where: { uuid: userUuid } });
  if (!user) {
    throw AppError.notFound('User not found');
  }

  const member = await JobListMember.findOne({
    where: { job_list_id: jobList.id, user_id: user.id },
  });
  if (!member) {
    throw AppError.notFound('This user is not a member of the list');
  }

  if (member.role === ROLES.OWNER) {
    throw AppError.badRequest('The list owner cannot be removed');
  }

  await member.destroy();
}

module.exports = { list, invite, remove };
