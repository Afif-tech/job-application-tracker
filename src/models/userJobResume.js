const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class UserJobResume extends Model {
    static associate(models) {
      UserJobResume.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });
      UserJobResume.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }

    toJSONPublic() {
      return {
        uuid: this.uuid,
        originalName: this.original_name,
        mimeType: this.mime_type,
        sizeBytes: this.size_bytes,
        createdAt: this.created_at,
        updatedAt: this.updated_at,
      };
    }
  }

  UserJobResume.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: () => uuidv4(),
      },
      job_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      original_name: { type: DataTypes.STRING(255), allowNull: false },
      stored_path: { type: DataTypes.STRING(512), allowNull: false },
      mime_type: { type: DataTypes.STRING(120), allowNull: false },
      size_bytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    {
      sequelize,
      modelName: 'UserJobResume',
      tableName: 'user_job_resumes',
      underscored: true,
      timestamps: true,
      // no paranoid: replace overwrites the single row + its file
    }
  );

  return UserJobResume;
};
