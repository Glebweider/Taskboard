const path = require("node:path");

module.exports = {
    webpack: {
        alias: {
            "@Components": path.resolve(__dirname, "src/components"),
            "@Styles": path.resolve(__dirname, "src/styles"),
            "@Utils": path.resolve(__dirname, "src/utils"),
            "@Redux": path.resolve(__dirname, "src/redux"),
        },
    },
};
