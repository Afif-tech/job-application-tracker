const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class JobList extends Model {
    static associate(models) {
      JobList.belongsTo(models.User, { foreignKey: 'owner_id', as: 'owner' });
      JobList.hasMany(models.JobListMember, {
        foreignKey: 'job_list_id',
        as: 'members',
      });
      // Convenience many-to-many through the join table.
      JobList.belongsToMany(models.User, {
        through: models.JobListMember,
        foreignKey: 'job_list_id',
        otherKey: 'user_id',
        as: 'memberUsers',
      });
    }

    toJSONPublic(extra = {}) {
      return {
        uuid: this.uuid,
        title: this.title,
        description: this.description || null,
        owner: this.owner ? this.owner.toPublicJSON() : undefined,
        createdAt: this.created_at,
        updatedAt: this.updated_at,
        ...extra,
      };
    }
  }

  JobList.init(
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
      title: { type: DataTypes.STRING(160), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      owner_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    {
      sequelize,
      modelName: 'JobList',
      tableName: 'job_lists',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return JobList;
};
