import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import * as Joi from "joi";

import database from "../";
import { IServerConfigurations } from "../configurations";


export default class CourseController {

    private configs: IServerConfigurations;
    private database: any;
    private user: any ;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public getCoursesList(request: Hapi.Request, reply: Hapi.IReply) {
        return reply({
            "data": [
                {
                    id: 532,
                    name: "Primary Logic 101",
                    description: "Primary Logic using Python 2.7",
                    totalExercises: 123,
                    daysToComplete: 40,
                    enrolled: false,
                },
                {
                    id: 123,
                    name: "JavaScript Basics",
                    description: "Basic JS 101 before getting into web-dev.",
                    totalExercises: 90,
                    daysToComplete: 25,
                    enrolled: true,
                    facilitatingFor: [1, 2]
                },
                {
                    id: 145,
                    name: "HTML / CSS Basics",
                    description: "Get yourself to develop any god-damn page under the sun.",
                    totalExercises: 50,
                    daysToComplete: 15,
                    enrolled: true
                }
            ]
        });
    }

    public getCourseExercises(request: Hapi.Request, reply: Hapi.IReply) {
        return reply({
            data: [
                {
                    id: 241,
                    title: "What is Python?",
                    slug: "what-is-python",
                    content: "# Some heading \n ## Some sub-heading \n Some content.",
                    parentExercise: null,
                    completed: true,
                    completedOn: Date.now(),
                    timeTakenToComplete: 12343
                },
                {
                    id: 242,
                    title: "Constants & Variables in Programming Languages",
                    slug: "constants-variables-in-programming-languages",
                    content: "# Some heading \n ## Some sub-heading \n Some content.",
                    parentExercise: null,
                    completed: false,
                    completedOn: null,
                    timeTakenToComplete: null
                },
                {
                    id: 244,
                    title: "Variable Names & Reserved Words",
                    slug: "variable-names-reserved-words",
                    content: "# Some heading \n ## Some sub-heading \n Some content.",
                    parentExercise: 242,
                    completed: false,
                    completedOn: null,
                    timeTakenToComplete: null
                }
            ]
        });
    }

    public getExerciseById(request: Hapi.Request, reply: Hapi.IReply) {
        return reply({
            id: 244,
            title: "Variable Names & Reserved Words",
            slug: "variable-names-reserved-words",
            content: "# Some heading \n ## Some sub-heading \n Some content.",
            parentExercise: 242,
            completed: false,
            completedOn: null,
            timeTakenToComplete: null
        });
    }

    public getCourseNotes(request: Hapi.Request, reply: Hapi.IReply) {
        reply({
            "notes": "# Some Heading ## Some sub-heading ## Some more sub-heading. Some text."
        });
    }

    public enrollInCourse(request: Hapi.Request, reply: Hapi.IReply) {
        return reply({
            id: 123,
            name: "JavaScript Basics",
            description: "Basic JS 101 before getting into web-dev.",
            totalExercises: 90,
            daysToComplete: 25,
            enrolled: true,
            facilitatingFor: [1, 2]
        });
    }

}
