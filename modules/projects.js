require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

const { sequelize, Sector, Project } = require("../models/project");


const initialize = () => {
  return sequelize.sync()
    .then(() => Promise.resolve())
    .catch((err) => Promise.reject("Unable to sync the database: " + err));
};


const getAllProjects = () => {
  return Project.findAll({ include: [Sector] })
    .then(projects => projects.map(p => p.get({ plain: true })))
    .catch(() => Promise.reject("No projects found."));
};

const getProjectById = (id) => {
  return Project.findAll({
    include: [Sector],
    where: { id: id }
  })
    .then(projects => {
      if (projects.length > 0) return projects[0].get({ plain: true });
      else throw new Error("Unable to find requested project");
    })
    .catch(() => Promise.reject("Unable to find requested project"));
};

const getProjectsBySector = (sector) => {
  return Project.findAll({
    include: [Sector],
    where: {
      '$Sector.sector_name$': {
        [Sequelize.Op.iLike]: `%${sector}%`
      }
    }
  })
    .then(projects => {
      if (projects.length > 0) {
        return projects.map(p => p.get({ plain: true }));
      } else {
        throw new Error("Unable to find requested projects");
      }
    })
    .catch(() => Promise.reject("Unable to find requested projects"));
};

const addProject = (projectData) => {
  return Project.create(projectData);
};

const getAllSectors = () => {
  return Sector.findAll({ raw: true });
};


module.exports = {
  initialize,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
  getAllSectors,
  addProject
};

