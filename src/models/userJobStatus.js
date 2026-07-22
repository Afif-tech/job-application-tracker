const { DataTypes, Model } = require('sequelize');
const { APPLICATION_STATUSES } = require('../constants');

module.exports = (sequelize) => {
  class UserJobStatus extends Model {
    static associate(models) {
      UserJobStatus.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });
      UserJobStatus.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }

    toJSONPublic() {
      return {
        status: this.status,
        appliedAt: this.applied_at || null,
        updatedAt: this.updated_at,
      };
    }
  }

  UserJobStatus.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      job_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      status: {
        type: DataTypes.ENUM(...APPLICATION_STATUSES),
        allowNull: false,
        defaultValue: 'not_applied',
      },
      applied_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'UserJobStatus',
      tableName: 'user_job_status',
      underscored: true,
      timestamps: true,
    }
  );

  return UserJobStatus;
};
