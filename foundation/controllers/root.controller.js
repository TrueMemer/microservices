module.exports = {
    url: "/",
    method: "GET",
    handler: (req, res) => {
        res.send({ name: req.app.config.name, version: req.app.config.version })
    }
}