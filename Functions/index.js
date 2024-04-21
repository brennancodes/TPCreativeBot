const PingMTC = require("./PingMTC");
const RemoveButtonsFromOriginal = require("./RemoveButtonsFromOriginal");
const ValidateSubmission = require("./ValidateSubmission");
const CalculateRotationBalance = require("./CalculateRotationBalance");
const GetMapById = require("./GetMapById");
const GetMapByName = require("./GetMapByName");
const GetAllMaps = require("./GetAllMaps");
const CheckForExcessBlack = require("./CheckForExcessBlack");
const RefreshPins = require("./RefreshPins");
const GetFMRoot = require("./GetFMRoot");
const FinalizeVotes = require("./FinalizeVotes");
const CheckForExistingMapInRotation = require("./CheckForExistingMapInRotation");

module.exports = { 
    PingMTC,
    FinalizeVotes,
    RemoveButtonsFromOriginal, 
    ValidateSubmission, 
    CalculateRotationBalance, 
    GetMapById, 
    GetMapByName, 
    GetAllMaps, 
    CheckForExcessBlack,
    RefreshPins,
    GetFMRoot,
    CheckForExistingMapInRotation
 }