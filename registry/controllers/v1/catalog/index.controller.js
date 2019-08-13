const uuid = require("uuid/v4");

module.exports = [
    {
        method: "GET",
        url: "/v1/catalog/:guid",
        handler: (req, res) => {
            let service = req.app.services.get(req.params.guid);

            if (!service) {
                res.status(404);
                return res.send({ "error": "service is not found" });
            }
        
            return res.send(service);
        }
    },
    {
        method: "GET",
        url: "/v1/catalog/listAll",
        handler: (req, res) => {
            return res.send(Array.from(req.app.services.values()));
        }
    },
    {
        method: "POST",
        url: "/v1/catalog/register",
        handler: (req, res) => {
            const bodyValid = req.app.schemaValidator.validate("serviceRegisterSchema", req.body);
            if (!bodyValid) return res.status(400).send({ errors: req.app.schemaValidator.errors });

            let newService = req.body;
            if (!newService.guid)
                newService.guid = uuid();
            else {
                if (req.app.services.has(newService.guid)) {
                    res.status(304);
                    return res.send(req.app.services.get(newService.guid));
                }
            }
            newService.status = "unknown";
        
            req.app.services.set(newService.guid, newService);
        
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
        
            return res.send(newService);
        }
    }
];