const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class SharedResume extends Model {
    static associate(models) {
      SharedResume.belongsTo(models.Job, { foreignKey: 'job_id', as: 'job' });
      SharedResume.belongsTo(models.User, { foreignKey: 'uploaded_by', as: 'uploader' });
    }

    toJSONPublic({ canDelete } = {}) {
      return {
        uuid: this.uuid,
        originalName: this.original_name,
        mimeType: this.mime_type,
        sizeBytes: this.size_bytes,
        uploadedBy: this.uploader
          ? { uuid: this.uploader.uuid, name: this.uploader.name }
          : null,
        createdAt: this.created_at,
        ...(canDelete !== undefined ? { canDelete } : {}),
      };
    }
  }

  SharedResume.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: () => uuidv4(),
      },
      job_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      uploaded_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      original_name: { type: DataTypes.STRING(255), allowNull: false },
      stored_path: { type: DataTypes.STRING(512), allowNull: false },
      mime_type: { type: DataTypes.STRING(120), allowNull: false },
      size_bytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    {
      sequelize,
      modelName: 'SharedResume',
      tableName: 'shared_resumes',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return SharedResume;
};
