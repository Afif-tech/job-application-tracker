const express = require('express');
const controller = require('../controllers/member.controller');
const validator = require('../validators/member.validator');
const { validate } = require('../middlewares/validate');
const { authorizeJobList } = require('../middlewares/authorize');
const { ROLES } = require('../constants');

// mergeParams lets this nested router read :listId from the parent mount.
const router = express.Router({ mergeParams: true });

// Any member can view the member list.
router.get(
  '/',
  validate(validator.listMembers),
  authorizeJobList(),
  controller.list
);

// Only the owner can invite.
router.post(
  '/',
  validate(validator.invite),
  authorizeJobList({ role: ROLES.OWNER }),
  controller.invite
);

// Only the owner can remove members.
router.delete(
  '/:userId',
  validate(validator.remove),
  authorizeJobList({ role: ROLES.OWNER }),
  controller.remove
);

module.exports = router;
