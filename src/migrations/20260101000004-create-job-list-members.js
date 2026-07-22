'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('job_list_members', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      job_list_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'job_lists', key: 'id' },
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
      role: {
        type: Sequelize.ENUM('owner', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      invited_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addConstraint('job_list_members', {
      fields: ['job_list_id', 'user_id'],
      type: 'unique',
      name: 'uq_job_list_members_list_user',
    });
    await queryInterface.addIndex('job_list_members', ['user_id'], {
      name: 'idx_job_list_members_user_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('job_list_members');
  },
};
