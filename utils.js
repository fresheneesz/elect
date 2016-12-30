

// random number between 0 and 1 (just like Math.random)
exports.random = function() {
    var randomInteger = getRandomInt(0,255)
    return randomInteger/255
}

function getRandomInt(min, max) {
    // Create byte array and fill with 1 random number
    var byteArray = new Uint8Array(1);
    window.crypto.getRandomValues(byteArray);

    var range = max - min + 1;
    var max_range = 256;
    if (byteArray[0] >= Math.floor(max_range / range) * range)
        return getRandomInt(min, max);
    return min + (byteArray[0] % range);
}

// Returns the results of a yes/no weighted majority vote on each societal preference as an array where
// each index indicates the societal option and the value is either true or false
// deciders - An array of winning candidates in the same form as this.elect returns
module.exports.findSocietalOptionsOutcomes = function(deciders) {
    var voteWeightTotal = 0
    var societalOptionsVotes = []
    deciders.forEach(function(person) {
        voteWeightTotal += person.weight
        person.preferences.forEach(function(preference, index) {
            if(societalOptionsVotes[index] === undefined) {
                societalOptionsVotes[index] = 0
            }

            if(preference > 0) {
                societalOptionsVotes[index] += person.weight
            }
        })
    })

    return societalOptionsVotes.map(function(votesForOneSocietalOption) {
        return votesForOneSocietalOption/voteWeightTotal > .5
    })
}

module.exports.voterOutcomeUtility = function(voter, outcomes) {
    var totalUtility =  0
    voter.forEach(function(utility,index) {
        if(outcomes[index])
            totalUtility += utility
    })

    return totalUtility
}