var noop = function(vote){return vote}

module.exports = {
    noop: {'':noop},
    ranked: {
        "raw":noop,
        "Max 3": function(vote) {
            return vote.slice(0,3)
        }
    },
    scored: {
        "raw":noop,
        "Nearest 1-5": function(vote) {
            return vote.map(function(candidateScore) {
                return Math.round(5*candidateScore)/5
            })
        }
    }
}