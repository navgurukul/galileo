//ignore this
// import * as Mongoose from "mongoose";
import database from '../index';
import DBTable from './dbtable';

import {IServerConfigurations} from "../configurations/index";

export class SelectLanguageModel extends DBTable {
    configs: any;

    constructor(configs: IServerConfigurations) {
        super(database, "language_preference");
        this.configs = configs;
    }

}
