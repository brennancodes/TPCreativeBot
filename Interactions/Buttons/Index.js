const ConfirmMapSubmission = require('./ConfirmMapSubmission.js');
const CancelMapSubmission = require('./CancelMapSubmission.js');
const ConfirmMapUpdate = require('./ConfirmMapUpdate.js');
const ConfirmMapRemoval = require('./ConfirmMapRemoval.js');
const ConfirmManualAdd = require('./ConfirmManualAdd.js');
const CancelAction = require("./CancelAction");
const ConfirmGetCurrentRating = require("./ConfirmGetCurrentRating");
const ShareToChannel = require("./ShareToChannel");

module.exports = { 
    ConfirmMapSubmission, 
    CancelMapSubmission, 
    ConfirmMapUpdate, 
    ConfirmMapRemoval,
    ConfirmManualAdd,
    CancelAction, 
    ConfirmGetCurrentRating,
    ShareToChannel
};