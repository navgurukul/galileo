var _ = require("underscore");
import * as Configs from "../configurations";
import database from "../";

export const getforIndivisualTimePeriod = function (centerId: string, date: string) {

    return database("submissions")
        .count('submissions.id as itemCounts')
        .innerJoin('users', 'users.id', 'submissions.user_id')
        .where({

            "submissions.state": 'pending'
        })
        .andWhere(function () {
            if (centerId.toLowerCase() !== 'all') {
                this.where({ "users.center": centerId, })
            }
        })
        .andWhere(function () {
            switch (date) {


                case "yesterday": {
                    //statements; 
                    this.whereRaw(
                        "date(submitted_at) = date(DATE_SUB(NOW(), INTERVAL 1 day))"
                    );

                    break;
                }
                case "lastWeek": {
                    //statements; 
                    this.whereRaw(
                        "date(submitted_at) >= date(DATE_SUB(NOW(), INTERVAL 1 week))"
                    );

                    break;
                }
                case "lastMonth": {
                    //statements; 
                    this.whereRaw(
                        "date(submitted_at) >= date(DATE_SUB(NOW(), INTERVAL 1 month))"
                    );

                    break;
                }
                case "today": {
                    //statements; 
                    this.whereRaw(
                        "date(submissions.submitted_at) = date(NOW())"
                    );

                    break;
                }
            }


        })
        .whereNotNull("users.center")
        .then(rows => {

            // check if he is a facilitator?
            if (rows.length < 1) {
                return Promise.resolve({itemCounts:0});
            } else {
                return Promise.resolve(rows[0]);

            }
        });

};

export const getNumberOfAssignmentSubmittedPerUser = function (centerId: string) {
    return database("submissions")
        .select("users.name")
        .count('submissions.id as numberOfAssignmentSubmitted')
        .innerJoin('users', 'users.id', 'submissions.user_id')
        .where({

            "submissions.state": 'pending'
        })
        .andWhere(function () {
            if (centerId.toLowerCase() !== 'all') {
                this.where({ "users.center": centerId, })
            }
        })
        .whereNotNull("users.center")
        .groupBy('users.id')


        .then(rows => {

            // check if he is a facilitator?
            if (rows.length < 1) {
                return Promise.resolve([]);
            } else {
                return Promise.resolve(rows);

            }
        });

};


