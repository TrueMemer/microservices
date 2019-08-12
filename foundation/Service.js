const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const axios = require("axios");
const Fastify = require("fastify");

class InvalidConfigException extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidConfigException";
    }
}

/** Class respesenting a service */
class Service {

    /**
     * Service configuration object.
     */
    config = null;

    /**
     * Fastify server object.
     */
    app = null;
    /**
     * JSON schema validator.
     */
    schemaValidator = new Ajv({ allErrors: true });

    /**
     * Loads schema files from schemasFolderPath and adds them to validator.
     * All schema files must have ".schema.json" extensions.
     * @param {string} schemasFolderPath 
     */
    loadValidationSchemas(schemasFolderPath = path.join(__dirname, "schemas")) {
        const files = fs.readdirSync(schemasFolderPath);

        files.forEach((file) => {
            if (!file.endsWith(".schema.json")) return;

            const fullPath = path.join(schemasFolderPath, file);
            const schema = require(fullPath);

            this.schemaValidator.addSchema(schema, schema.name);
        });
    }

    /**
     * Registers a service in registry service specified in config file.
     * If config["self-register"] is true, will be executed on service initialization.
     * 
     * Not recommended to use besides internal use.
     */
    async register() {
        if (!this.config.services["registry-service"]) {
            this.app.log.warn("Service tried to register, but registry server is not specified in config file");
            return;
        }
        try {
            const r = await axios({
                method: "post",
                baseURL: `http://${this.config.services["registry-service"].hostname}:${this.config.services["registry-service"].port}`,
                url: "/v1/catalog/register",
                validateStatus: (status) => { return status >= 200 && status <= 304; },
                data: {
                    guid: this.config.guid,
                    name: this.config.name,
                    version: this.config.version,
                    prefix: this.config.prefix,
                    port: this.config.port,
                    hostname: this.config.hostname || "localhost"
                }
            });

            this.app.log.info("Service is registered");
        } catch (e) {
            this.app.log.warn("Failed to register service (is registry service up?). Retrying after 10 seconds...");
            setTimeout(async () => this.register(), 10000);
            return;
        }
    }

    /**
     * Validates config object with internal scheme.
     * For internal use only.
     * @param {object} config 
     */
    validateConfiguration(config) {
        return this.schemaValidator.validate("serviceConfigSchema", config);
    }

    /**
     * Loads config file from disk.
     * Not recommended to use.
     * @param {string} configFilePath - config file path
     * @param {string} configFormat - config file format (default: json)
     */
    loadConfigFromFile(configFilePath, configFormat = "json") {
        let config = {};

        if (configFormat == "json") {
            let configBuffer = fs.readFileSync(configFilePath, { encoding: "utf-8" }).toString();
            config = JSON.parse(configBuffer);
        }

        const configValid = this.validateConfiguration(config);
        if (!configValid)
            return null;

        return config;
    }

    /**
     * Initializes http server.
     * For internal use only.
     */
    initHttpServer() {
        this.app = Fastify(this.config.settings.fastify || {});
    }

    /**
     * Starts listeting on port specified in config file.
     */
    listen() {
        this.app.listen(this.config.port);
    }

    /**
     * This method registers controllers from controllerDirPath.
     * All controllers in a directory must have ".controller.js" extension.
     * These controller files use fastify route syntax.
     * 
     * @example
     * {
     *  method: "GET",
     *  url: "/",
     *  handler: (req, res) => {
     *    res.send("ok");
     *  }
     * }
     * 
     * @param {string} controllerDirPath - controllers directory path
     * 
     * @throws {Error}
     */
    registerControllers(controllerDirPath = path.join(__dirname, "controllers")) {
        const files = fs.readdirSync(controllerDirPath);

        const appMiddleware = (req, res, done) => {
            req.app = this;
            done();
        }

        files.forEach((file) => {
            if (!file.endsWith(".controller.js")) return;

            const controller = require(path.join(controllerDirPath, file));

            this.app.route(Object.assign({ preHandler: appMiddleware }, controller));
        });
    }

    /**
     * Creates a new service.
     * Loads configuration file from config. If config is a string, it will treat it as a path. 
     * @param {string | object} config - config file path or object
     * @param {string} configFormat - config format (for now only json is supported)
     */
    constructor(config, configFormat = "json") {

        this.loadValidationSchemas();

        if (typeof config == "string")
            this.config = this.loadConfigFromFile(config, configFormat);
        else this.config = config;
        
        if (!this.config) {
            throw new InvalidConfigException("Configuration file is invalid or doesn't exist");
        }

        this.initHttpServer();
        this.registerControllers();

        if (this.config["self-registry"])
            this.register();
    }

}

exports.Service = Service;