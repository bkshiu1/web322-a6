/********************************************************************************
*  WEB322 – Assignment 05 
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Karl Shiu  Student ID: 131531246  Date: 18/7/2025 
*
*  Published URL: https://web322assingment-4.onrender.com
*
********************************************************************************/
    /*Due to issues installing Tailwind via npm scripts, the styles were built using the direct CLI command
      .\tailwindcss.exe -i ./public/css/tailwind.css -o ./public/css/main.css
      which is functionally equivalent to npm run tw:build*/

const express = require("express");
const path = require("path");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

const projectData = require("./modules/projects");
const { deleteProject } = require("./modules/projects");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.render("home", { page: "/" });
});

app.get("/about", (req, res) => {
  res.render("about", { page: "/about" });
});

app.get("/solutions/projects", (req, res) => {
  const sector = req.query.sector;

  const fetch = sector
    ? projectData.getProjectsBySector(sector)
    : projectData.getAllProjects();

  fetch
    .then(data => {
      res.render("projects", { page: "/solutions/projects", data });
    })
    .catch(err => {
      res.status(404).render("404", {
        page: "/solutions/projects",
        message: "No projects found."
      });
    });
});

app.get("/solutions/projects/:id", (req, res) => {
  const id = parseInt(req.params.id);
  projectData.getProjectById(id)
    .then(project => {
      res.render("project", {
        page: "/solutions/projects",
        data: project
      });
    })
    .catch(err => {
      res.status(404).render("404", {
        page: "/solutions/projects",
        message: "Project not found."
      });
    });
});

app.get("/solutions/addProject", async (req, res) => {
  try {
    const sectors = await projectData.getAllSectors();
    res.render("addProject", { page: "/solutions/addProject", sectors });
  } catch (err) {
    res.status(500).send("Unable to load sectors");
  }
});

app.post("/solutions/addProject", async (req, res) => {
  try {
    await projectData.addProject(req.body);
    res.redirect("/solutions/projects");
  } catch (err) {
    res.render("500", {
      page: "/solutions/addProject",
      message: `I'm sorry, but we have encountered the following error: ${err}`
    });
  }
});

app.get("/solutions/editProject/:id", async (req, res) => {
  try {
    const project = await projectData.getProjectById(req.params.id);
    const sectors = await projectData.getAllSectors();
    res.render("editProject", { project, sectors });
  } catch (err) {
    res.status(500).render("500", {
      message: `Error loading project for edit: ${err}`
    });
  }
});

app.post("/solutions/editProject", async (req, res) => {
  try {
    await projectData.editProject(req.body);
    res.redirect("/solutions/projects");
  } catch (err) {
    res.status(500).render("500", {
      message: `Error saving edited project: ${err}`
    });
  }
});

app.post("/solutions/editProject/:id", async (req, res) => {
  try {
    await projectData.updateProject(req.params.id, req.body);
    res.redirect("/solutions/projects");
  } catch (err) {
    res.render("500", {
      message: `Sorry, there was an error: ${err}`
    });
  }
});

app.get("/solutions/deleteProject/:id", (req, res) => {
  deleteProject(req.params.id)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err =>
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`
      })
    );
});

app.use((req, res) => {
  res.status(404).render("404", {
    page: "",
    message: "Sorry, the page you're looking for doesn't exist."
  });
});

// Initialize and optionally listen (for local)
projectData.initialize().then(() => {
  if (!process.env.VERCEL) {
    app.listen(HTTP_PORT, () => {
      console.log(`Server listening on port ${HTTP_PORT}`);
    });
  }
}).catch(err => {
  console.error("Failed to initialize project data:", err);
});

module.exports = app;
