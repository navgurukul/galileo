// import * as Mongoose from "mongoose";
import DBTable from './dbtable';
import * as Bcrypt from "bcryptjs";

export interface IUser {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updateAt: Date;
  validatePassword(requestPassword): boolean;
};

export default class User extends DBTable {

}

// export const User = ;