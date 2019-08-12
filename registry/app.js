const fastify = require("fastify");
const uuid = require("uuid/v4");
const service = require("./service.json");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const Service = require("../foundation/Service").Service;

class RegistryService extends Service {

    services = new Map();

    async checkServiceHealth(service) {
        try {
            const r = await axios({
                method: "get",
                url: `http://${service.hostname || "localhost"}:${service.port}${service.prefix}/`
            });
        } catch (e) {
            return "problem";
        }

        return "active";
    }

    checkAllServicesHealth() {
        this.services.forEach(async (value, key, map) => { value.status = await this.checkServiceHealth(value); })
    }

    registerStaticServices(servicesPath = path.join(__dirname, "services")) {
        fs.readdir(servicesPath, (err, files) => {
            if (err) {
                return app.log.error("Failed to register static services (unable to scan directory)");
            }

            files.forEach((file) => {
                if (!file.endsWith(".service.json")) return;
                const service = require(path.join(servicesPath, file));
                if (!service.guid)
                    service.guid = uuid();
                service.status = "unknown";

                this.services.set(service.guid, service);
            });
        });
    }

    constructor(configFilePath) {
        super(configFilePath);

        // this.loadValidationSchemas(path.join(__dirname, "schemas"));
        this.registerControllers(path.join(__dirname, "controllers"));

        setInterval(async () => this.checkAllServicesHealth(), 10000);
        this.registerStaticServices();
    }

}

const app = new RegistryService(path.join(__dirname, "service.json"));

app.listen();