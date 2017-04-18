import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Jwt from "jsonwebtoken";
import * as GoogleAuth from "google-auth-library";

import database from "../";
import { IServerConfigurations } from "../configurations";


export default class ReportController {

    private configs: IServerConfigurations;
    private database: any;
    private user: any ;

    constructor(configs: IServerConfigurations, database: any) {
        this.database = database;
        this.configs = configs;
    }

    public getBatchCourseReport(request: Hapi.Request, reply: Hapi.IReply) {
        return reply({
            data: [
                {
                    id: 241,
                    title: "What is Python?",
                    slug: "what-is-python",
                    content: "# Some heading \n ## Some sub-heading \n Some content.",
                    parentExercise: null,
                    assignmentReviewType: null,
                    completionDetails: [
                        {
                            userId: 32,
                            completed: true,
                            completedOn: Date.now(),
                            timeTakenToComplete: 3600,
                            attemptsTaken: 2
                        },
                        {
                            userId: 45,
                            completed: false,
                            completedOn: null,
                            timeTakenToComplete: null,
                            attemptsTaken: 3
                        },
                        {
                            userId: 76,
                            completed: true,
                            completedOn: Date.now(),
                            timeTakenToComplete: 36000,
                            attemptsTaken: 1
                        }
                    ]
                },
                {
                    id: 242,
                    title: "Constants & Variables in Programming Languages",
                    slug: "constants-variables-in-programming-languages",
                    content: "# Some heading \n ## Some sub-heading \n Some content.",
                    parentExercise: null,
                    assignmentReviewType: "auto",
                    completionDetails: [
                        {
                            userId: 32,
                            completed: true,
                            completedOn: Date.now(),
                            timeTakenToComplete: 3600,
                            attemptsTaken: 2
                        },
                        {
                            userId: 45,
                            completed: false,
                            completedOn: null,
                            timeTakenToComplete: null,
                            attemptsTaken: 3
                        },
                        {
                            userId: 76,
                            completed: false,
                            completedOn: null,
                            timeTakenToComplete: null,
                            attemptsTaken: 5
                        }
                    ]
                },
            ]
        });
    }

}

