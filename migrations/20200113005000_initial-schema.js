const configs = require('../src/configs');

exports.up = function (knex) {
	const urlMaxLength = 150;
	const nameMaxLength = 100;
	return knex.schema
		.createTable('courses', table => {
			table.increments('id').primary().unsigned();
			table.string('name', nameMaxLength).notNullable();
			table.string('logo', urlMaxLength).notNullable();
			table.integer('sequenceNum').notNullable();
			table.integer('daysToComplete').defaultTo(0);
			table.text('shortDescription');
			table.string('githubUrl', urlMaxLength).notNullable();
			table.datetime('createdAt').defaultTo(knex.fn.now());
			table.datetime('updatedAt').defaultTo(knex.fn.now());
		})
		.createTable('centers', table => {
			table.increments('id').primary().unsigned();
			table.string('name', nameMaxLength).notNullable();
			table.datetime('createdAt').defaultTo(knex.fn.now());
			table.datetime('updatedAt').defaultTo(knex.fn.now());
		})
		.createTable('users', table => {
			table.increments('id').primary().unsigned();
			table.string('name', nameMaxLength).notNullable();
			table.string('email', urlMaxLength).notNullable().unique();
			table.string('profilePicture', urlMaxLength).notNullable();
			table.string('googleUserId', urlMaxLength).notNullable().unique();
			table.integer('centerId')
				.unsigned()
				.references('centers.id')
				.onDelete('SET NULL')
				.index();
			table.string('github', urlMaxLength);
			table.string('linkedin', urlMaxLength);
			table.string('medium', urlMaxLength);
			table.datetime('createdAt').defaultTo(knex.fn.now());
			table.datetime('updatedAt').defaultTo(knex.fn.now());
		})
		.createTable('exercises', table => {
			table.increments('id').primary().unsigned();
			table.integer('parentExerciseId')
				.unsigned()
				.references('id')
				.inTable('exercises')
				.onDelete('SET NULL')
				.index();
			table.integer('coursesId')
				.unsigned()
				.references('id')
				.inTable('courses')
				.onDelete('SET NULL')
				.index();
			table.string('name', nameMaxLength).notNullable();
			table.string('slug').notNullable();
			table.integer('sequenceNum').notNullable();
			table.enu('reviewType', configs.getConstant('reviewType')).defaultTo('automatic');
			table.enu('submissionType', configs.getConstant('submissionType')).notNullable();
			table.text('content', 'LONGTEXT');
			table.text('solution', 'LONGTEXT');
			table.string('githubUrl', urlMaxLength).notNullable();
			table.datetime('createdAt').defaultTo(knex.fn.now());
			table.datetime('updatedAt').defaultTo(knex.fn.now());
		})
};

exports.down = function (knex) {
	return knex.schema
		.dropTableIfExists('exercises')
		.dropTableIfExists('courses')
		.dropTableIfExists('users')
		.dropTableIfExists('centers')
};
