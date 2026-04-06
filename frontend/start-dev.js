// Wrapper to ensure node is in PATH for child processes (react-scripts)
process.env.PATH = "C:\\Program Files\\nodejs;" + (process.env.PATH || "");
require("@craco/craco/dist/bin/craco");
