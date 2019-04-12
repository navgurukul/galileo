var _ = require("underscore");
import * as Configs from "../configurations";
import database from "../";

export const getforIndivisualTimePeriod = function (centerId: string, date: string) {
    return database("submissions")
        .count('submissions.id as itemcounts')
        .innerJoin('users', 'users.id', 'submissions.userId')
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
                        "date(submittedAt) = date(DATE_SUB(NOW(), INTERVAL 1 day))"
                    );

                    break;
                }
                case "lastWeek": {
                    //statements; 
                    this.whereRaw(
                        "date(submittedAt) >= date(DATE_SUB(NOW(), INTERVAL 1 week))"
                    );

                    break;
                }
                case "lastMonth": {
                    //statements; 
                    this.whereRaw(
                        "date(submittedAt) >= date(DATE_SUB(NOW(), INTERVAL 1 month))"
                    );

                    break;
                }
                // case "lastMonth": {
                //     //statements; 
                //     this.whereRaw(
                //         "date(submittedAt) >= date(DATE_SUB(NOW(), INTERVAL 1 month))"
                //     );

                //     break;
                // }
                case "today": {
                    //statements; 
                    this.whereRaw(
                        "date(submissions.submittedAt) = date(NOW())"
                    );

                    break;
                }
            }


        })
        .whereNotNull("users.center")


        .then(rows => {

            // check if he is a facilitator?
            if (rows.length < 1) {

            } else {
                //console.log("total record", rows);
                // return rows[0].itemcount
                // return  totalRecord = rows[0].itemcount

                return Promise.resolve(rows[0]);

            }
        });

};

export const getNumberOfAssignmentSubmittedPerUser = function (centerId: string) {
    return database("submissions")
        .select("users.name")
        .count('submissions.id as numberOfAssignmentSubmitted')
        .innerJoin('users', 'users.id', 'submissions.userId')
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

            } else {
              //  console.log(`total record for ${centerId} =`, rows);
                // return rows[0].itemcount
                // return  totalRecord = rows[0].itemcount

                return Promise.resolve(rows);

            }
        });

};


