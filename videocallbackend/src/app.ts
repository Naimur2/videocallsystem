import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import { swaggerSpec } from "./config/swagger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import routes from "./routes";

// Pure functions for application configuration
const createCorsOptions = (origin: string | string[]) => ({
  origin,
  credentials: true,
});

const createMorganFormat = (isDevelopment: boolean): string =>
  isDevelopment ? "dev" : "combined";

const createRootResponse = (apiPrefix: string) => ({
  success: true,
  message: "Video Call Backend API",
  version: "1.0.0",
  documentation: `${apiPrefix}/info`,
});

const createServerInfo = (
  port: number,
  apiPrefix: string,
  nodeEnv: string
) => ({
  port,
  apiDocumentation: `http://localhost:${port}${apiPrefix}/info`,
  healthCheck: `http://localhost:${port}${apiPrefix}/health`,
  environment: nodeEnv,
});

// Higher-order function for middleware application
const applyMiddleware = (app: Application) => (middleware: any) => {
  app.use(middleware);
  return app;
};

// Function composition for middleware setup
const setupSecurity = (app: Application): Application => {
  const apply = applyMiddleware(app);
  return apply(helmet());
};

const setupCors = (
  app: Application,
  corsOrigin: string | string[]
): Application => {
  const apply = applyMiddleware(app);
  const corsOptions = createCorsOptions(corsOrigin);
  return apply(cors(corsOptions));
};

const setupLogging = (
  app: Application,
  isDevelopment: boolean
): Application => {
  const apply = applyMiddleware(app);
  const morganFormat = createMorganFormat(isDevelopment);
  return apply(morgan(morganFormat));
};

const setupBodyParsing = (app: Application): Application => {
  const apply = applyMiddleware(app);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  return app;
};

const setupSwagger = (app: Application): Application => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "MediaSoup Video Call API",
      customCss: ".swagger-ui .topbar { display: none }",
      explorer: true,
    })
  );
  return app;
};

const setupRoutes = (app: Application, apiPrefix: string): Application => {
  // API routes
  app.use(apiPrefix, routes);

  // Root endpoint
  const rootResponse = createRootResponse(apiPrefix);
  app.get("/", (req: any, res: any) => {
    res.json(rootResponse);
  });

  return app;
};

const setupErrorHandling = (app: Application): Application => {
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

// Pure function to log server startup info
const logServerStartup = (
  serverInfo: ReturnType<typeof createServerInfo>
): void => {
  console.log(`🚀 Server is running on port ${serverInfo.port}`);
  console.log(`📖 API Documentation: ${serverInfo.apiDocumentation}`);
  console.log(`🏥 Health Check: ${serverInfo.healthCheck}`);
  console.log(`🌍 Environment: ${serverInfo.environment}`);
};

// Functional application factory
const createApp = (config: typeof import("@/config").config): Application => {
  const app = express();

  // Apply middleware using function composition
  const setupFunctions = [
    (app: Application) => {
      setupSecurity(app);
      return app;
    },
    (app: Application) => {
      setupCors(app, config.allowedOrigins);
      return app;
    },
    (app: Application) => {
      setupLogging(app, config.isDevelopment);
      return app;
    },
    (app: Application) => {
      setupBodyParsing(app);
      return app;
    },
    (app: Application) => {
      setupSwagger(app);
      return app;
    },
    (app: Application) => {
      setupRoutes(app, config.apiPrefix);
      return app;
    },
    (app: Application) => {
      setupErrorHandling(app);
      return app;
    },
  ];

  let configuredApp = app as any;
  for (const setupFn of setupFunctions) {
    configuredApp = setupFn(configuredApp);
  }

  return configuredApp;
};

// Main application function
const startServer = (
  app: Application,
  config: typeof import("@/config").config
): void => {
  app.listen(config.port, () => {
    const serverInfo = createServerInfo(
      config.port,
      config.apiPrefix,
      config.nodeEnv
    );
    logServerStartup(serverInfo);
  });
};

// Export functional interface
const createVideoCallApp = () => {
  const app = createApp(config);

  return {
    app,
    listen: () => startServer(app, config),
  };
};

export default createVideoCallApp;
export { createApp };
