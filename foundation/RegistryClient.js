const axios = require("axios");

module.exports = class RegistryClient {

    registryUrl = null;

    constructor(registryHost, registryPort) {
        this.registryUrl = `http://${registryHost}:${registryPort}`;
    }

    async getAllServices() {
        try {
            const request = await axios({
                method: "get",
                url: this.registryUrl + "/v1/catalog/listAll"
            });

            return await request.data;
        } catch (e) {
            return null;
        }
    }

}