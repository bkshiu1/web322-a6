/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Karl Shiu_________ Student ID: 131531246___ Date: 1/8/2025___
*
*  Published URL: _https://web322-a6.onrender.com______&_______https://github.com/bkshiu1/web322-a6
*
********************************************************************************/


const express = require("express");
const path = require("path");
const clientSessions = require("client-sessions");
const authData = require("./modules/auth-service");
const projectData = require("./modules/projects");
const { deleteProject } = require("./modules/projects");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware to ensure a user is logged in
function ensureLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Set EJS as templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(clientSessions({
  cookieName: "session",
  secret: "secretClimateKey123",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));

// Make session available in views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});


// ------------------ ROUTES ------------------

// Public Pages
app.get("/", (req, res) => res.render("home", { page: "/" }));
app.get("/about", (req, res) => res.render("about", { page: "/about" }));

// Projects List + Filter
app.get("/solutions/projects", async (req, res) => {
  try {
    const data = req.query.sector
      ? await projectData.getProjectsBySector(req.query.sector)
      : await projectData.getAllProjects();

    res.render("projects", { page: "/solutions/projects", data });
  } catch (err) {
    res.status(404).render("404", {
      page: "/solutions/projects",
      message: "No projects found."
    });
  }
});

// Project Details
app.get("/solutions/projects/:id", async (req, res) => {
  try {
    const project = await projectData.getProjectById(req.params.id);
    if (project) {
      res.render("project", {
        page: "/solutions/projects",
        data: project,
        session: req.session
      });
    } else {
      res.status(404).render("404", {
        page: "/solutions/projects",
        message: "Project not found"
      });
    }
  } catch (err) {
    res.status(500).render("500", {
      page: "/solutions/projects",
      message: `Sorry, there was an error loading the project: ${err}`
    });
  }
});

// Add Project (GET + POST)
app.get("/solutions/addProject", ensureLogin, async (req, res) => {
  try {
    const sectors = await projectData.getAllSectors();
    res.render("addProject", { page: "/solutions/addProject", sectors });
  } catch {
    res.status(500).send("Unable to load sectors");
  }
});

app.post("/solutions/addProject", ensureLogin, async (req, res) => {
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

// Edit Project (GET + POST)
app.get("/solutions/editProject/:id", ensureLogin, async (req, res) => {
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

app.post("/solutions/editProject", ensureLogin, async (req, res) => {
  try {
    await projectData.editProject(req.body); // requires body.id inside
    res.redirect("/solutions/projects");
  } catch (err) {
    res.status(500).render("500", {
      message: `Error saving edited project: ${err}`
    });
  }
});

app.post("/solutions/editProject/:id", ensureLogin, async (req, res) => {
  try {
    await projectData.updateProject(req.params.id, req.body);
    res.redirect("/solutions/projects");
  } catch (err) {
    res.render("500", {
      message: `Sorry, there was an error: ${err}`
    });
  }
});

// Delete Project
app.get("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
  deleteProject(req.params.id)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err =>
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`
      })
    );
});

// Auth: Login + Register + Logout
app.get("/login", (req, res) => {
  res.render("login", {
    errorMessage: "",
    userName: ""
  });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect("/solutions/projects");
    })
    .catch((err) => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName
      });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register", {
    errorMessage: "",
    successMessage: "",
    userName: ""
  });
});

app.post("/register", async (req, res) => {
  const { userName, password, password2, email } = req.body;

  if (!userName || !password || !password2 || !email) {
    return res.render("register", {
      errorMessage: "All fields are required",
      userName
    });
  }

  if (password !== password2) {
    return res.render("register", {
      errorMessage: "Passwords do not match",
      userName
    });
  }

  try {
    await authData.registerUser(req.body);
    res.render("register", {
      successMessage: "Registration successful!"
    });
  } catch (err) {
    res.render("register", {
      errorMessage: err,
      userName: req.body.userName
    });
  }
});

// User history (requires login)
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", {
    user: req.session.user
  });
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).render("404", {
    page: "",
    message: "Sorry, the page you're looking for doesn't exist."
  });
});


// ------------------ SERVER STARTUP ------------------

projectData.initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`app listening on: ${HTTP_PORT}`);
    });
  })
  .catch(err => {
    console.log(`unable to start server: ${err}`);
  });

module.exports = app;
