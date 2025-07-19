/********************************************************************************
*  WEB322 – Assignment 04 
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Karl Shiu  Student ID: 131531246  Date: 4/7/2025 
*
*  Published URL: https://web322assingment-4.onrender.com
*
********************************************************************************/

const express = require("express");
const path = require("path");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

const projectData = require("./modules/projects");

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));

app.use(express.static("public"));

projectData.initialize().then(() => {

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
        res.render("projects", {
          page: "/solutions/projects",
          data
        });
      })
      .catch(err => {
        res.status(404).render("404", {
          page: "/solutions/projects",
          message: "No projects found."
        });
      });
  });

  //changed
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


  app.use((req, res) => {
    res.status(404).render("404", {
      page: "",
      message: "Sorry, the page you're looking for doesn't exist."
    });
  });

  app.listen(HTTP_PORT, () => {
    console.log(`Server listening on port ${HTTP_PORT}`);
  });

}).catch(err => {
  console.error("Failed to start server:", err);
});