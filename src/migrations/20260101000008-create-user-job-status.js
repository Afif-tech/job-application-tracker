'use strict';

const STATUSES = [
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

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_job_status', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      job_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'jobs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM(...STATUSES),
        allowNull: false,
        defaultValue: 'not_applied',
      },
      applied_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addConstraint('user_job_status', {
      fields: ['job_id', 'user_id'],
      type: 'unique',
      name: 'uq_user_job_status_job_user',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_job_status');
  },
};
