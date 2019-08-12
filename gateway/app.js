const Service = require("../foundation/Service").Service;
const path = require("path");

class GatewayService extends Service {
    constructor() {
        super(path.join(__dirname, "service.json"));
    }
}

const app = new GatewayService();

app.listen();