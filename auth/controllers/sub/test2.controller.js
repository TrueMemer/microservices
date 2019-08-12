module.exports = [
    {
        method: "GET",
        url: "/test2",
        handler: (req, res) => {
            res.send("ok");
        }
    }
]