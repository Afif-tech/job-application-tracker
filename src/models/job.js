const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { PLATFORMS } = require('../constants');

module.exports = (sequelize) => {
  class Job extends Model {
    static associate(models) {
      Job.belongsTo(models.JobList, { foreignKey: 'job_list_id', as: 'jobList' });
      Job.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
      Job.hasMany(models.SharedResume, { foreignKey: 'job_id', as: 'sharedResumes' });
      Job.hasMany(models.UserJobResume, { foreignKey: 'job_id', as: 'userResumes' });
      Job.hasMany(models.UserJobStatus, { foreignKey: 'job_id', as: 'userStatuses' });
    }

    /**
     * @param {object} [opts]
     * @param {boolean} [opts.canManage]      whether the requesting user may edit/delete
     * @param {Array}   [opts.sharedResumes]  pre-shaped shared resume list
     * @param {object}  [opts.myResume]       requesting user's personal resume, or null
     */
    toJSONPublic({ canManage, sharedResumes, myResume, myStatus } = {}) {
      return {
        uuid: this.uuid,
        companyName: this.company_name,
        jobTitle: this.job_title,
        originalUrl: this.original_url,
        platform: this.platform,
        location: this.location || null,
        salary: this.salary || null,
        notes: this.notes || null,
        expiryDate: this.expiry_date || null,
        createdBy: this.creator
          ? { uuid: this.creator.uuid, name: this.creator.name }
          : null,
        createdAt: this.created_at,
        updatedAt: this.updated_at,
        ...(canManage !== undefined ? { canManage } : {}),
        ...(sharedResumes !== undefined ? { sharedResumes } : {}),
        ...(myResume !== undefined ? { myResume } : {}),
        ...(myStatus !== undefined ? { myStatus } : {}),
      };
    }
  }

  Job.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: () => uuidv4(),
      },
      job_list_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      company_name: { type: DataTypes.STRING(160), allowNull: false },
      job_title: { type: DataTypes.STRING(200), allowNull: false },
      original_url: { type: DataTypes.STRING(2048), allowNull: false },
      platform: {
        type: DataTypes.ENUM(...PLATFORMS),
        allowNull: false,
        defaultValue: 'others',
      },
      location: { type: DataTypes.STRING(160), allowNull: true },
      salary: { type: DataTypes.STRING(120), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      expiry_date: { type: DataTypes.DATEONLY, allowNull: true },
      created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    {
      sequelize,
      modelName: 'Job',
      tableName: 'jobs',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return Job;
};
