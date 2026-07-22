/**
 * Shared enums used across models, validators, and services.
 * The frontend mirrors these in src/utils/constants.js — keep them in sync.
 */

const PLATFORMS = [
  'linkedin',
  'jobstreet',
  'indeed',
  'glassdoor',
  'company_website',
  'others',
];

const APPLICATION_STATUSES = [
  'not_applied',
  'applied',
  'interview',
  'assessment',
  'hr_interview',
  'technical_interview',
  'offer',
  'rejected',
  'accepted',
];

const ROLES = {
  OWNER: 'owner',
  MEMBER: 'member',
};

const RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'];

module.exports = {
  PLATFORMS,
  APPLICATION_STATUSES,
  ROLES,
  RESUME_MIME_TYPES,
  RESUME_EXTENSIONS,
};
