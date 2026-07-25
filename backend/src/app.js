const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");

const notFound = require("./shared/middleware/notFound");
const errorHandler = require("./shared/middleware/errorHandler");

const authRoutes = require(
  "./modules/auth/routes/auth.routes"
);

const sessionRoutes = require(
  "./modules/auth/routes/session.routes"
);

const organizationRoutes = require(
  "./modules/org/routes/organization.routes"
);

const departmentRoutes = require(
  "./modules/department/routes/department.routes"
);

const teamRoutes = require(
  "./modules/team/routes/team.routes"
);

const projectRoutes = require(
  "./modules/project/routes/project.routes"
);

const boardRoutes = require(
  "./modules/board/routes/board.routes"
);

const taskRoutes = require(
  "./modules/task/routes/task.routes"
);

const notificationRoutes = require(
  "./modules/notification/routes/notification.routes"
);

const messageRoutes = require(
  "./modules/chat/routes/message.routes"
);

const searchRoutes = require(
  "./modules/search/routes/search.routes"
);

const dmRoutes = require(
  "./modules/dm/routes/dm.routes"
);

const analyticsRoutes = require(
  "./modules/analytics/routes/analytics.routes"
);

const documentRoutes = require(
  "./modules/document/routes/document.routes"
);

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(compression());

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// Static serving for attachments
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Team Project Management Portal API is running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server Healthy",
  });
});


app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/auth",
  sessionRoutes
); 

app.use(
  "/api/v1",
  departmentRoutes
);

app.use(
  "/api/v1/orgs",
  organizationRoutes
);



app.use(
  "/api/v1",
  teamRoutes
);

app.use(
  "/api/v1",
  projectRoutes
);

app.use(
  "/api/v1",
  boardRoutes
);

app.use(
  "/api/v1",
  taskRoutes
);

app.use(
  "/api/v1/notifications",
  notificationRoutes
);

app.use(
  "/api/v1",
  messageRoutes
);

app.use(
  "/api/v1",
  searchRoutes
);

app.use(
  "/api/v1",
  dmRoutes
);

app.use(
  "/api/v1",
  analyticsRoutes
);

app.use(
  "/api/v1",
  documentRoutes
);


app.use(notFound);

app.use(errorHandler);

module.exports = app;