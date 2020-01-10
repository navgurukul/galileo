const Joi = require('joi');
const ObjectionUnique  = require('objection-unique');
const Model  = require('./extenstions/index');
const UserRole = require('./user_role');
const Center = require('./center');
const MentorTree = require('./mentor_tree');
const Course  = require('./course');
const CourseEnrollment = require('./course_enrollment');

const withUniqueValidation = ObjectionUnique({
  fields: ['email', 'googleUserId'],
  identifiers: ['id'],
});
module.exports =  class User extends withUniqueValidation(Model) {
  static get tableName() {
    return 'users';
  }

  static get joiSchema() {
    return Joi.object({
      id: Model.idSchema,
      name: Joi.string().max(50),
      email: Joi.string().email().required(),
      profilePicture: Model.uriSchema,
      googleUserId: Joi.string().required(),
      centerId: Model.idSchema.required(),
      github: Model.uriSchema,
      linkedin: Model.uriSchema,
      medium: Model.uriSchema,
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      roles: {
        relation: Model.HasManyRelation,
        modelClass: UserRole,
        join: {
          from: this.foreignKeyChain('id'),
          to: UserRole.foreignKeyChain('userId'),
        },
      },
      center: {
        relation: Model.BelongsToOneRelation,
        modelClass: Center,
        join: {
          from: this.foreignKeyChain('centerId'),
          to: Center.foreignKeyChain('id'),
        },
      },
      mentees: {
        relation: Model.HasManyRelation,
        modelClass: MentorTree,
        join: {
          from: MentorTree.foreignKeyChain('menteeId'),
          to: this.foreignKeyChain('id'),
        },
      },
      mentor: {
        relation: Model.HasManyRelation,
        modelClass: MentorTree,
        join: {
          from: MentorTree.foreignKeyChain('mentorId'),
          to: this.foreignKeyChain('id'),
        },
      },
      enrolledCourses: {
        relation: Model.ManyToManyRelation,
        modelClass: Course,
        join: {
          from: this.foreignKeyChain('id'),
          through: {
            from: CourseEnrollment.foreignKeyChain('studentId'),
            to: CourseEnrollment.foreignKeyChain('courseId'),
          },
          to: Course.foreignKeyChain('id'),
        },
      },
    };
  }

  hasRole(role) {
    return true;
  }

  async $beforeInsert(ctx) {
    await super.$beforeInsert(ctx);
    this.createdAt = new Date();
  }

  async $beforeUpdate(queryOptions, ctx) {
    await super.$beforeUpdate(queryOptions, ctx);
    const now = new Date();
    this.updatedAt = now;
  }
}
