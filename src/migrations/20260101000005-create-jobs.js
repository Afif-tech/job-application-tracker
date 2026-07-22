'use strict';

const PLATFORMS = ['linkedin', 'jobstreet', 'indeed', 'glassdoor', 'company_website', 'others'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobs', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
      job_list_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'job_lists', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company_name: { type: Sequelize.STRING(160), allowNull: false },
      job_title: { type: Sequelize.STRING(200), allowNull: false },
      original_url: { type: Sequelize.STRING(2048), allowNull: false },
      platform: { type: Sequelize.ENUM(...PLATFORMS), allowNull: false, defaultValue: 'others' },
      location: { type: Sequelize.STRING(160), allowNull: true },
      salary: { type: Sequelize.STRING(120), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('jobs', ['job_list_id'], { name: 'idx_jobs_job_list_id' });
    await queryInterface.addIndex('jobs', ['platform'], { name: 'idx_jobs_platform' });
    await queryInterface.addIndex('jobs', ['created_by'], { name: 'idx_jobs_created_by' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('jobs');
  },
};
