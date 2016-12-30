
var utils = require('./utils')

module.exports = {
    candidateDictatorUtilities: function(voters, candidates) {
        var candidateOutcomes = candidates.map(function(candidate) {
            return  utils.findSocietalOptionsOutcomes([{weight:1, preferences:candidate}])
        })
        // the utility each voter would get if each candidate were elected dictator
        return voters.map(function(voter) {
            return candidateOutcomes.map(function(outcomes) {
                return  utils.voterOutcomeUtility(voter, outcomes)
            })
        })
    }
}