const Joi = require('joi');
const Model = require('./extenstions/index');
const Exercise = require('./exercise');
const CourseRelation = require('./course_relation');

module.exports = class Course extends Model {
	static get tableName() {
		return 'courses';
	}

	static get joiSchema() {
		return Joi.object({
			id: Model.idSchema,
			name: Joi.string().required(),
			logo: Joi.string().uri().required(),
			sequenceNum: Joi.number().integer().required(),
			daysToComplete: Joi.number().integer().required(),
			shortDescriptions: Joi.string().required(),
			githubUrl: Model.uriSchema, // Add custom Joi for github
			createdAt: Joi.date(),
			updatedAt: Joi.date(),
		});
	}

	static get relationMappings() {
		return {
			exercises: {
				relation: Model.HasManyRelation,
				modelClass: Exercise,
				join: {
					from: this.foreignKeyChain('id'),
					to: Exercise.foreignKeyChain('courseId'),
				},
			},
			// dependentsOn: {
			//   relation: Model.ManyToManyRelation,
			//   modelClass: Course,
			//   join: {
			//     from: this.foreignKeyChain('id'),
			//     through: {
			//       from: CourseRelation.foreignKeyChain('courseId'),
			//       to: CourseRelation.foreignKeyChain('dependencyCourseId'),
			//     },
			//     to: this.foreignKeyChain('id'),
			//   },
			// },
		};
	}

	$beforeInsert() {
		const now = new Date();
		this.createdAt = now;
	}

	$beforeUpdate() {
		const now = new Date();
		this.updatedAt = now;
	}
};
