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
*  Published URL: https://web322-a5-nbwk.onrender.com
*
********************************************************************************/
    /*Due to issues installing Tailwind via npm scripts, the styles were built using the direct CLI command
      .\tailwindcss.exe -i ./public/css/tailwind.css -o ./public/css/main.css
      which is functionally equivalent to npm run tw:build*/
const express = require("express");
const path = require("path");
const clientSessions = require("client-sessions");
const authData = require("./modules/auth-service");
const projectData = require("./modules/projects");
const { deleteProject } = require("./modules/projects");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(clientSessions({
  cookieName: "session",
  secret: "secretClimateKey123",
  duration: 2 * 60 * 1000,
  activeDuration: 1000 * 60
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// ------------------ ROUTES ------------------

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


app.get("/solutions/addProject", ensureLogin, async (req, res) => {
  try {
    const sectors = await projectData.getAllSectors();
    res.render("addProject", { page: "/solutions/addProject", sectors });
  } catch (err) {
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
    await projectData.editProject(req.body);
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

app.get("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
  deleteProject(req.params.id)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err =>
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`
      })
    );
});

app.get("/login", (req, res) => {
  res.render("login", {
    errorMessage: "",
    userName: ""
  });
});
app.get("/register", (req, res) => {
  res.render("register", {
    errorMessage: "",
    successMessage: "",
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
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", {
    user: req.session.user
  });
});


app.post("/register", async (req, res) => {
  try {
    const { userName, password, password2, email } = req.body;

    if (!userName || !password || !password2 || !email) {
      return res.render("register", {
        errorMessage: "All fields are required",
        userName,
      });
    }

    if (password !== password2) {
      return res.render("register", {
        errorMessage: "Passwords do not match",
        userName,
      });
    }

    await authData.registerUser(req.body); // ✅ Fixed: Pass whole userData object

    return res.render("register", {
      successMessage: "Registration successful!",
    });

  } catch (err) {
    return res.render("register", {
      errorMessage: err,
      userName: req.body.userName,
    });
  }
});




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
