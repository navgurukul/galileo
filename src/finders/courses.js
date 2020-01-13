const _ = require('underscore');

function AllCoursesFinder(server, config, props) {
	this.courses = () => {

	}
}

function AvailableCoursesFinder(server, configs, props) {
	this.courses = () => {

	}
}

function EnrolledCoursesFinder(server, configs, props) {
	this.courses = () => {

	}
}

function CompletedCoursesFinder(server, configs, props) {
	this.courses = () => {

	}
}

function DependencyCoursesFinder(server, configs, props) {
	this.courses = () => {

	}
}

function UnlockedCoursesFinder(server, configs, props) {
	this.courses = () => {

	}
}

module.exports = (server, configs, props, finderType = "all") => {
	const finders = {
		unlocked: UnlockedCoursesFinder,
		dependent: DependencyCoursesFinder,
		all: AllCoursesFinder,
		available: AvailableCoursesFinder,
		completed: CompletedCoursesFinder,
		enrolled: EnrolledCoursesFinder
	};
	if (!_.keys(finders).includes(finderType)) {
		const {InValidCoursesFinderType} = server.errors;
		throw new InValidCoursesFinderType()
	}
	return new finders[finderType](server, configs, props)
}
;
