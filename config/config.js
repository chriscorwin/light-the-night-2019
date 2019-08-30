const path = require('path');
const fs = require('fs');
const util = require('util');
const sizeOf = require('image-size');


// Satic data here, so that we do not have to generate the config data all for every environment unless we wanna
let configData = null;


module.exports = function() {
    // if the static data was already set. return it
    if (configData != null && configData != undefined) {
        return configData;
    }

    // default to production
    const defaultConfigData = require('./config.json');

    let envConfigData = {};
   


    if (process.env.DEBUG === "true") {
        envConfigData.DEBUG = true;
    } else {
        envConfigData.DEBUG = false;
    }
    // merge default with env config, overwriting defaults
    configData = { ...defaultConfigData, ...envConfigData };


    let defaultEngineConfig = {};
    try {
        defaultEngineConfig = configData.theme ? require(`../engine/default-config.js`) : {};
    } catch (e) {
        console.warn('no default engine config');
    }

    let defaultThemeConfig = {};
    try {
        defaultThemeConfig = configData.theme ? require(`../themes/${configData.theme}/localization.js`) : {};
    } catch (e) {
        console.warn('no default product template config');
    }


    const dates = require('../engine/javascripts/dates');
    configData.localization = Object.assign({}, { dates }, defaultEngineConfig, defaultThemeConfig);

    // view engine setup
    // https://expressjs.com/en/4x/api.html#app.set
    // views are looked up in the order they occur in the array (earlier takes precedence over later --cascade flows reverse of the way it does in CSS)
    const appViews = [];

    if (configData.theme) {
        appViews.push(path.join(__dirname, '../', 'themes', configData.theme));
    }
    appViews.push(path.join(__dirname, '../', 'engine'));
    configData.appViews = appViews;



    // LOAD FROM ENV VARIABLES -- you can set an env variable and this will just catch it. NICE.
    configData.SOME_STATIC_VAR = process.env.SOME_STATIC_VAR;
    configData.port = process.env.port || configData.port;



    return configData;
}
