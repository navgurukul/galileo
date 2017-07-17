
export default (sequelize, DataTypes) => {

  return sequelize.define('project', {
    title: sequelize.STRING,
    description: sequelize.TEXT
  });

}

