const Fs = require("fs");
const Ajv = require("ajv");

const serviceConfigSchema = require("./schemas/serviceConfigSchema.json");

class Service {

    config = null;
    guid = null;
    name = null;
    domain = null;
    prefix = null;
    version = null;

    schemaValidator = new Ajv({allErrors: true});

    validateConfiguration(config) {
        return this.schemaValidator.validate("serviceConfigSchema", config);
    }

    constructor(configFilePath, configFormat = "json") {

        this.schemaValidator.addSchema(serviceConfigSchema, "serviceConfigSchema");
        
        if (configFormat == "json") {
            let configBuffer = Fs.readFileSync(configFilePath, { encoding: "utf-8" }).toString();
            this.config = JSON.parse(configBuffer);
        }
        
        if (!this.validateConfiguration(this.config)) {
            console.log(this.schemaValidator.errorsText())
            throw new Error("Configuration file is invalid or doesn't exist");
        }

    }

}

exports.Service = Service;