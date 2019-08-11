const fastify = require("fastify");
const uuid = require("uuid/v4");
const service = require("./service.json");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const registerServiceBodyScheme = require("./schemas/catalog/register.json");
const getServiceScheme = require("./schemas/catalog/get.json");

const services = new Map();

const app = fastify(service.settings.fastify);

async function checkServiceHealth(service) {
    try {
        const r = await axios({
            method: "get",
            url: `http://${service.hostname || "localhost"}:${service.port}/`
        });
    } catch (e) {
        return "problem";
    }

    return "active";
}

function checkAllServicesHealth() {
    services.forEach(async (value, key, map) => { value.status = await checkServiceHealth(value); })
}

function registerStaticServices() {
    // TODO: Иметь это в конфиге
    const dirPath = path.join(__dirname, "services");

    fs.readdir(dirPath, (err, files) => {
        if (err) {
            return app.log.error("Failed to register static services (unable to scan directory)");
        }

        files.forEach((file) => {
            const service = require(path.join(dirPath, file));
            if (!service.guid)
                service.guid = uuid();
            service.status = "unknown";

            services.set(service.guid, service);
        });
    });
}

app.ready(async () => {
    setInterval(checkAllServicesHealth, 10000);
    registerStaticServices();
});

app.get("/", async (req, res) => {
    return { name: service.name, version: service.version };
});

app.get("/v1/catalog/:guid", { schema: getServiceScheme }, async (req, res) => {
    let service = services.get(req.params.guid);

    if (!service) {
        res.status(404);
        return { "error": "service is not found" };
    }

    return service;
});

app.get("/v1/catalog/listAll", async (req, res) => {
    return Array.from(services.values());
});

app.post("/v1/catalog/register", { schema: { body: registerServiceBodyScheme } }, async (req, res) => {
    let newService = req.body;
    if (!newService.guid)
        newService.guid = uuid();
    else {
        if (services.has(newService.guid)) {
            res.status(304);
            return services.get(newService.guid);
        }
    }
    newService.status = "unknown";

    services.set(newService.guid, newService);

    req.log.info(`service with guid ${newService.guid} and name ${newService.name} was registered`);

    // TODO: Система подписки на ивенты
    // services.forEach(async (value, key, map) => {
    //     if (value.hasOwnProperty("subscribeToEvents")) {
    //         const url = `http://${value.hostname || "localhost"}:${value.port}${value.prefix}/v1/events/registerHandler`;

    //         const r = await axios({
    //             method: "post",
    //             url,
    //             data: newService,
    //             validateStatus: () => true
    //         });
    //     }
    // });

    return newService;
});

// TODO
app.get("/v1/catalog/unregister", (req, res) => {
    return {};
});

(async () => {
    try {
        await app.listen(service.port);
        app.log.info(`Service ${service.name} is listening on port ${service.port}`);
    } catch (e) {
        app.log.fatal(e);
        process.exit(-1);
    }
})()