const Service = require("../foundation/Service").Service;
const path = require("path");

class GatewayService extends Service {

    constructor(configPath) {
        super(configPath);

        this.registerControllers(path.join(__dirname, "controllers"), false);
    }
}

const app = new GatewayService(path.join(__dirname, "service.json"));

app.listen();