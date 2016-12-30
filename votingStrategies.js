
var utils = require('./utils')

// votes are floating point numbers between 0 and 1
function rangeStrategy_honestExact(voter, aggregates) {
    // the maximum utility that the best dictator-candidate would give for this voter
    var maxUtility = Math.max.apply(null, aggregates.candidateDictatorUtilities)
    var minUtility = Math.min.apply(null, aggregates.candidateDictatorUtilities)

    return aggregates.candidateDictatorUtilities.map(function(utility) {
        if(maxUtility === minUtility) { // this branch prevents a divide by 0 error
            return .5
        } else {
            var utilityFraction = (utility-minUtility)/(maxUtility-minUtility)
            return utilityFraction
        }
    })
}

function rankedVote_honest(voter, aggregates) {
    var order = aggregates.candidateDictatorUtilities.map(function(candidateUtility, index) {
        return {utility: candidateUtility, index:index}
    }).sort(function(a,b) {
        return b.utility-a.utility // highest to lowest
    })

    return order.map(function(x) {
        return x.index
    })
}


module.exports = {
    ranked: {
        Honest: rankedVote_honest
    },
    scored: {
        Honest: rangeStrategy_honestExact
    },
    noop: {
        '':function(){}
    }
}