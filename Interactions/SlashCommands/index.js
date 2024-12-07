const SubmitMap = require("./submitmap");
const RemoveMap = require("../../Interactions/SlashCommands/removemap");
const GetFeedback = require("./getfeedback");
const RotationSummary = require("./rotationsummary");
const UpdateMap = require("./updatemap");
const ManualAdd = require("./manualadd");
const FindMap = require("./findmap");
const FindFortunateMap = require("./findfortunatemap");
const GetCurrentRating = require("./getcurrentrating");
const CreativeHelp = require("./creativehelp");
const PromoteMap = require("./promotemap");
const TrialSummary = require("./trialsummary");
const ThrowbackSummary = require("./throwbacksummary");
const MTC = require("./mtc");
const ResetVotes = require("./resetvotes");

module.exports = { 
    SubmitMap, 
    RemoveMap, 
    GetFeedback, 
    RotationSummary, 
    UpdateMap,
    ManualAdd,
    FindMap, 
    FindFortunateMap,
    GetCurrentRating, 
    CreativeHelp,
    PromoteMap,
    TrialSummary,
    ThrowbackSummary,
    MTC,
    ResetVotes
}
