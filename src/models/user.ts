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

export class User extends DBTable {

    // table name, reference of db
   public getFirstElement() {
      return this.database.select().from('random');
       //return first row 
   }
}

// export const User = ;