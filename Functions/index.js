const PingMTC = require("./PingMTC");
const RemoveButtonsFromOriginal = require("./RemoveButtonsFromOriginal");
const ValidateSubmission = require("./ValidateSubmission");
const CalculateRotationBalance = require("./CalculateRotationBalance");
const GetMapById = require("./GetMapById");
const GetMapByName = require("./GetMapByName");
const GetAllMaps = require("./GetAllMaps");
const CheckForExcessBlack = require("./CheckForExcessBlack");
const RefreshPins = require("./RefreshPins");

module.exports = { 
    PingMTC, 
    RemoveButtonsFromOriginal, 
    ValidateSubmission, 
    CalculateRotationBalance, 
    GetMapById, 
    GetMapByName, 
    GetAllMaps, 
    CheckForExcessBlack,
    RefreshPins,
 }