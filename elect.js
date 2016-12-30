var Election = exports.Election = require("./Election")

var systems = exports.systems = require('./votingSystems')
var strat = exports.strategies = require('./votingStrategies')
var ballots = exports.ballots = require('./ballots')


// For each system:
// algorithm
    // takes in an array of votes where each vote is the output of a given `strategy` for the system
    // returns an object where each key is a winner, and each value is an object with the properties:
        // weight - the winner's vote weight
        // preferences - the winner's voting preferences for each societal option
// each strategy:
    // returns a "vote", a set of data used by votingSystem to determine winners
exports.testSystems = {
    Random: {
        winners: [1,3],
        strategies: strat.noop,
        systems: systems.random
    },
    'Random Voters\' Choice': {
        winners: [1,3],
        strategies: strat.ranked,
        ballots: ballots.ranked,
        systems: systems.randomVotersChoice
    },
    Plurality: {
        winners: [1,3],
        strategies: strat.ranked,
        ballots: ballots.ranked,
        systems: systems.plurality
    },
    Range: {
        winners: [1,3],
        strategies: strat.scored,
        systems: systems.scored,
        ballots: ballots.scored
    },
    'Single-Transferable Vote': {
        winners: [1,3],
        strategies: strat.ranked,
        ballots: ballots.ranked,
        systems: systems.singleTransferableVote
    },
    'Proportional Ranked, 15-Percent Threshold': {
        winners: [3],//[1,3],
        strategies: strat.ranked,
        ballots: ballots.ranked,
        systems: systems.singleTransferableVote
    },
    'Proportional Ranged': {
        winners: [3, Infinity],//[1,3, Infinity],
        strategies: strat.scored,
        ballots: ballots.scored,
        systems: {
            'split-weight, 0% threshold': systems.directRepresentativeRanged['split-weight, 0% threshold'],
            'highest-weight, 20% threshold': systems.directRepresentativeRanged['highest-weight, 20% threshold'],
            'split-weight, minority-max, 20% threshold': systems.directRepresentativeRanged['split-weight, minority-max, 20% threshold'],
            'split-weight, <b>reweighted</b>': systems.directRepresentativeRanged['split-weight, <b>reweighted</b>'],
            'equal-weight, <b>reweighted</b>': systems.directRepresentativeRanged['split-weight, <b>reweighted</b>'],
        }
    },
}

exports.test = function(resultsDiv, options, votingSystems) {
    if(votingSystems === undefined) throw new Error("No voting systems to test")

    var numberOfSocietalOptions = options.issues,
        numberOfCandidates = options.candidates,
        numberOfVoters = options.voters,
        iterations = options.iterations

    var knobsOutput = '<div>Societal Options: '+numberOfSocietalOptions+'</div>'+
                      '<div>Candidates: '+numberOfCandidates+'</div>'+
                      '<div>Voters: '+numberOfVoters+'</div>'+
                      '<div>Iterations: '+iterations+'</div>'+
                      '<br>'

    var n=1, totalRegretFractionSumPerSystem = {}, totalWinnersPerSystem = {}
    function iteration(complete) {
        var election = Election(numberOfVoters, numberOfCandidates, numberOfSocietalOptions)

        for(var systemName in votingSystems) {
            var votingSet = votingSystems[systemName]

            var curBallots = votingSet.ballots
            if(curBallots === undefined) {
                curBallots = ballots.noop
            }

            for(var strategyName in votingSet.strategies) {
                var rawStrategy = votingSet.strategies[strategyName]
                for(var ballotName in curBallots) {
                    var ballot = curBallots[ballotName]
                    var ballotStrategyName = strategyName+' '+ballotName
                    var strategy = function() {
                        return ballot(rawStrategy.apply(this,arguments))
                    }

                    for(var algorithmName in votingSet.systems) {
                        votingSet.winners.forEach(function(maxWinners) {
                            var winners = election.elect(votingSet.systems[algorithmName], strategy, election.voters, election.candidates, maxWinners)
                            var regretFraction = election.regretFraction(election.voters, winners)

                            var systemStrategyName = getVotingTypeName(systemName, ballotStrategyName, algorithmName, maxWinners)
                            if(totalRegretFractionSumPerSystem[systemStrategyName] === undefined) {
                                totalRegretFractionSumPerSystem[systemStrategyName] = 0
                                totalWinnersPerSystem[systemStrategyName] = 0
                            }

                            totalRegretFractionSumPerSystem[systemStrategyName] += regretFraction
                            totalWinnersPerSystem[systemStrategyName] += winners.length
                        })
                    }
                }
            }
        }

        resultsDiv.innerHTML = resultsHtml(n/iterations, true)
        setTimeout(function() {
            if(n<iterations) {
                iteration(complete)
                n++
            } else {
                complete()
            }
        })
    }

    var resultsHtml = function(completionFraction, sort) {
        var content = knobsOutput+'Completion: '+Number(100*completionFraction).toPrecision(3)+'%<br>'+
                      '<div><b>Voter Satisfaction Averages (inverse of Bayesian Regret):</b></div>'+
                      '<table>'

        Object.keys(totalRegretFractionSumPerSystem).map(function(name) {
            return {name:name, totalRegret:totalRegretFractionSumPerSystem[name]}
        }).sort(function(a,b) {
            if(sort) {
                return a.totalRegret - b.totalRegret
            } else {
                return 0
            }
        }).forEach(function(votingType) {
            var systemStrategyName = votingType.name
            var totalRegret = votingType.totalRegret

            var averageRegretFraction = totalRegret/n
            var avgWinners = (totalWinnersPerSystem[systemStrategyName]/n).toPrecision(2)

            var displayAverage = Number(100*(1-averageRegretFraction)).toPrecision(2)
            content += '<tr><td style="text-align:right;">'+systemStrategyName+"</td><td><b>"+displayAverage+'%</b> with avg of '+avgWinners+' winners</td></tr>'
        })

        content+= '</table>'
        return content
    }

    iteration(function() {
        resultsDiv.innerHTML = resultsHtml(1, true)
    })
}


// The name of an election run with a particular system and strategy
function getVotingTypeName(systemName,strategyName, algorithmName, maxWinners) {
    if(strategyName === 'noname') {
        return systemName
    } else {
        return '<span style="color:rgb(0,50,150)">'+systemName+'</span> '+algorithmName+' '+strategyName+' max '+maxWinners+' winners'
    }
}
