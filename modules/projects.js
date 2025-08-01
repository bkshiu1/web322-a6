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

function editProject(id, projectData) {
  return Project.update(projectData, {
    where: { id: id }
  }).then(() => {
    return;
  }).catch(err => {
    return Promise.reject(err.errors[0].message);
  });
}

async function editProject(data) {
  try {
    const project = await Project.findByPk(data.id);
    if (!project) throw new Error("Project not found");

    await project.update(data);
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err.message);
  }
}

function updateProject(id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await Project.update(data, {
        where: { id: id }
      });
      resolve();
    } catch (err) {
      reject(err.errors ? err.errors[0].message : err.message);
    }
  });
}

function deleteProject(id) {
  return new Promise((resolve, reject) => {
    Project.destroy({
      where: { id }
    })
      .then(() => resolve())
      .catch(err => reject(err.errors ? err.errors[0].message : err));
  });
}

module.exports.editProject = editProject;

module.exports = {
  initialize,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
  getAllSectors,
  addProject,
  editProject,
  updateProject,
  deleteProject
};

