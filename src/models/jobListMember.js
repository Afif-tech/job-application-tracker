const { DataTypes, Model } = require('sequelize');
const { ROLES } = require('../constants');

module.exports = (sequelize) => {
  class JobListMember extends Model {
    static associate(models) {
      JobListMember.belongsTo(models.JobList, {
        foreignKey: 'job_list_id',
        as: 'jobList',
      });
      JobListMember.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
      JobListMember.belongsTo(models.User, {
        foreignKey: 'invited_by',
        as: 'inviter',
      });
    }
  }

  JobListMember.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      job_list_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      role: {
        type: DataTypes.ENUM(ROLES.OWNER, ROLES.MEMBER),
        allowNull: false,
        defaultValue: ROLES.MEMBER,
      },
      invited_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    {
      sequelize,
      modelName: 'JobListMember',
      tableName: 'job_list_members',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return JobListMember;
};
