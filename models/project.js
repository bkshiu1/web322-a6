require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

const Sector = sequelize.define('Sector', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sector_name: DataTypes.STRING
}, { timestamps: false });

const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: DataTypes.STRING,
  feature_img_url: DataTypes.STRING,
  summary_short: DataTypes.TEXT,
  intro_short: DataTypes.TEXT,
  impact: DataTypes.TEXT,
  original_source_url: DataTypes.STRING,
  sector_id: { type: DataTypes.INTEGER, allowNull: false }
}, { timestamps: false });

Project.belongsTo(Sector, { foreignKey: 'sector_id' });

module.exports = { sequelize, Sector, Project };
