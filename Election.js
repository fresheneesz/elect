var proto = require("proto")

var utils = require('./utils')
var aggregateFns = require('./aggregateFns')
var random = utils.random

var Election = module.exports = proto(function() {
    this.init = function(numberOfVoters, numberOfCandidates, numberOfSocietalOptions) {

        var voters = [], candidates = []
        for(var j=0;j<numberOfVoters;j++) {
            voters.push(generatePerson(numberOfSocietalOptions))
        }
        for(var j=0;j<numberOfCandidates;j++) {
            candidates.push(generatePerson(numberOfSocietalOptions))
        }

        var netUtilities = findNetUtilities(voters)
        var optimalOutcomes = netUtilities.map(function(optionUtility) {
            return optionUtility > 0
        })
        var leastOptimalOutcomes = optimalOutcomes.map(function(outcome) {
            return !outcome
        })

        this.maxUtility = totalOutcomeUtility(voters, optimalOutcomes)
        this.minUtility = totalOutcomeUtility(voters, leastOptimalOutcomes)
        this.maxRegret = this.maxUtility - this.minUtility
        this.voters = voters
        this.candidates = candidates

        this.aggregates = {}
        for(var k in aggregateFns) {
            this.addAggregateFn(k, aggregateFns[k])
        }
    }

    // returns an array of winning candidates represented by objects that have the properties:
        // weight - That winner's voting weight in the legislature
        // utilities - That winner's option utilities (in the same form as returned by generatePerson)
    // algorithm(votes, candidates) - A function that should return the winning candidates in the same form as this.elect returns
    // strategy(voter, candidates) - A function that should return the given voter's vote in whatever form that algorithm requires
    this.elect = function(algorithm, strategy, voters, candidates, maxWinners) {
        var votes = voters.map(function(voter, index) {
            var voterAggregates = {}
            for(var k in this.aggregates) {
                voterAggregates[k] = this.aggregates[k][index]
            }

            return strategy(voter, voterAggregates)
        }.bind(this))

        var results = algorithm(votes, candidates, maxWinners)

        results.forEach(function(winner) {
            winner.preferences = candidates[winner.index]
            if(winner.weight < 0) throw new Error("Winner weight can't be less than 0")
        })

        return results
    }

    this.addAggregateFn = function(name,fn) {
        var that = this
        if(name in this.aggregates) throw new Error("Aggregate function '"+name+"' already exists")

        var values
        Object.defineProperty(this.aggregates, name, {
            get: function() {
                if(values === undefined) {
                    values = fn.call(this, that.voters,that.candidates) // memoize
                }
                return values
            },
            enumerable:true
        })
    }

    // returns a number from 0 to 1 indicating what percentage of the maximum possible voter regret the deciders cause
    this.regretFraction = function(people, deciders) {
        var outcomes = utils.findSocietalOptionsOutcomes(deciders)
        var totalUtility = totalOutcomeUtility(people, outcomes)
        var regret = this.maxUtility - totalUtility

        return regret/this.maxRegret
    }

    // returns the total utility change for the given people if the given outcomes happened
    function totalOutcomeUtility(people, outcomes) {
        var utility = 0
        people.forEach(function(person) {
            utility += utils.voterOutcomeUtility(person, outcomes)
        })

        return utility
    }

    // returns an array where the index indicates a societal option and the value indicates
    // the net utility for that option for the people passed in
    function findNetUtilities(people) {
        var netUtility = []
        people.forEach(function(person) {
            person.forEach(function(optionUtility, index) {
                if(netUtility[index] === undefined) {
                    netUtility[index] = 0
                }

                netUtility[index] += optionUtility
            })
        })

        return netUtility
    }

    // Returns an array where each element is a number from -1 to 1 indicating the utility that person would get
    // from a given societal option (identified by the index)
    function generatePerson(numberOfSocietalOptions, optionPopularityModifiers) {
        var voter = []
        for(var n=0;n<numberOfSocietalOptions;n++) {
            if(optionPopularityModifiers) {
                modifier = optionPopularityModifiers[n]
            } else {
                modifier = 1
            }

            voter[n] = 2*random()*modifier-1
        }

        return voter
    }
})
