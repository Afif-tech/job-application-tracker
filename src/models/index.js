const sequelize = require('../config/database');

// Model factory functions
const defineUser = require('./user');
const defineRefreshToken = require('./refreshToken');
const defineJobList = require('./jobList');
const defineJobListMember = require('./jobListMember');
const defineJob = require('./job');
const defineSharedResume = require('./sharedResume');
const defineUserJobResume = require('./userJobResume');
const defineUserJobStatus = require('./userJobStatus');

// Instantiate models
const User = defineUser(sequelize);
const RefreshToken = defineRefreshToken(sequelize);
const JobList = defineJobList(sequelize);
const JobListMember = defineJobListMember(sequelize);
const Job = defineJob(sequelize);
const SharedResume = defineSharedResume(sequelize);
const UserJobResume = defineUserJobResume(sequelize);
const UserJobStatus = defineUserJobStatus(sequelize);

const models = {
  User,
  RefreshToken,
  JobList,
  JobListMember,
  Job,
  SharedResume,
  UserJobResume,
  UserJobStatus,
};

// Wire up associations (each model exposes an optional associate())
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = { sequelize, Sequelize: require('sequelize'), ...models };
