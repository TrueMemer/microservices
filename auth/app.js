const path = require("path");
const Service = require("../foundation/Service").Service;

class AuthService extends Service {

    constructor() {
        super(path.join(__dirname, "service.json"));

        this.registerControllers(path.join(__dirname, "controllers"));
    }

}

const app = new AuthService(path.join(__dirname, "service.json"));

app.listen();