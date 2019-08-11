const fastify = require("fastify");
const service = require("./service.json")
const axios = require("axios");

const app = fastify(service.settings.fastify);

const REGISTRY_URI = process.env.REGISTRY_URI || 
    `http://${service.services["registry-service"].hostname}:${service.services["registry-service"].port}` || 
    "http://localhost:11036";

async function register() {
    const r = await axios({
        method: "post",
        url: REGISTRY_URI + "/v1/catalog/register",
        data: {
            guid: service.guid || null,
            name: service.name,
            version: service.version,
            prefix: service.prefix,
            port: service.port,
            hostname: "localhost"
        }
    });

    app.log.trace(r.data);

    if (!service.guid)
        service.guid = r.data.guid;
}

async function unregister() {
    if (!service.guid)
        return app.log.warn("service is not registered yet but tried to unregister");

    const r = await axios({
        method: "get",
        url: REGISTRY_URI + "/v1/catalog/unregister",
        params: {
            guid: service.guid
        }
    });

    app.log.trace(r.data);
}

app.ready(async () => {
    if (service["self-registry"])
        await register();
});

app.get("/", async (req, res) => {
    return { name: service.name, version: service.version };
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