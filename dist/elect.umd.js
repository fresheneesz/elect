(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["elect"] = factory();
	else
		root["elect"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!******************!*\
  !*** ./elect.js ***!
  \******************/
/***/ function(module, exports, __webpack_require__) {

	var Election = exports.Election = __webpack_require__(/*! ./Election */ 1)
	
	var systems = exports.systems = __webpack_require__(/*! ./votingSystems */ 2)
	var strat = exports.strategies = __webpack_require__(/*! ./votingStrategies */ 3)
	var ballots = exports.ballots = __webpack_require__(/*! ./ballots */ 4)
	
	
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


/***/ },
/* 1 */
/*!*********************!*\
  !*** ./Election.js ***!
  \*********************/
/***/ function(module, exports, __webpack_require__) {

	var proto = __webpack_require__(/*! proto */ 7)
	
	var utils = __webpack_require__(/*! ./utils */ 5)
	var aggregateFns = __webpack_require__(/*! ./aggregateFns */ 6)
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


/***/ },
/* 2 */
/*!**************************!*\
  !*** ./votingSystems.js ***!
  \**************************/
/***/ function(module, exports, __webpack_require__) {

	var random = __webpack_require__(/*! ./utils */ 5).random
	
	
	function pluralityAlg(votes, candidates, maxWinners) {
	    var results = []
	    for(var n=0; n<candidates.length;n++) {
	        results[n] = 0
	    }
	
	    votes.forEach(function(vote) {
	        results[vote[0]]++
	    })
	
	    var sortedTransformedResults = results.map(function(value,index){
	        return {candidate:index,votes:value}
	    }).sort(function(a,b) {
	        return b.votes - a.votes // reverse sort
	    })
	
	    return sortedTransformedResults.slice(0,maxWinners).map(function(winner) {
	        return {index: winner.candidate, weight:1}
	    })
	}
	
	
	// countType can either be "normal" or "maxMinority"
	    // normal is where the winners are the x candidates with the greatest total score
	    // maxMinority is where each successive winner is chosen from only the votes of those who haven't chosen a winner as their top choice
	    // reweighted is for a reweighted range vote described here; http://www.rangevoting.org/RRV.html
	// winnerWeightType can either be "highest" or "split"
	    // "highest" means winner vote weight will be the sum of the number of voters who gave that winner the highest score
	    // "split" means winner vote weight is the sum of all votes
	    // "equal" means each winner gets an equal vote weight
	// minThreshold is a number from 0 to 1 representing the ratio of average score to the average score of the highest scoring candidate
	    // note that the votes are shifted so that they're a range from 0 to 2 for the purposes of calculating this
	function directRepresentationRange(countType, winnerWeightType, minThreshold) {
	    return function(votes, candidates, maxWinners) {
	
	        var winners = {}, disqualified = {}
	
	        var countedVotes = countVotes(candidates, votes, winners, disqualified)
	        var nextWinner = findNextWinner(countedVotes)
	        var highestAvgScore = getAvgScore(countedVotes[nextWinner])
	
	        countedVotes.forEach(function(info, candidate) {
	            var avgScore = getAvgScore(info)
	            if(avgScore < highestAvgScore*minThreshold) {
	                disqualified[candidate] = true
	            }
	        })
	
	        winners[nextWinner] = true
	
	        while(Object.keys(winners).length < maxWinners && Object.keys(winners).length+Object.keys(disqualified).length < candidates.length) {
	            var nextWinnerCountedVotes = countVotes(candidates, votes, winners, disqualified, countType)
	
	            var nextWinner = findNextWinner(nextWinnerCountedVotes)
	            winners[nextWinner] = true
	        }
	
	        if(winnerWeightType === 'highest') {
	            var results = []
	            var resultsMap = {} //maps a winner to a result index
	            for(var winner in winners) {
	                resultsMap[winner] = results.length
	                results.push({index:winner, weight:0})
	            }
	
	            votes.forEach(function(vote) {
	                var highestWinners = {}, highestWinnerScore = -Infinity
	                vote.forEach(function(score, candidateIndex) {
	                    if(candidateIndex in winners) {
	                        if(score > highestWinnerScore) {
	                            highestWinners = {}
	                            highestWinners[candidateIndex] = true
	                            highestWinnerScore = score
	                        } else if(score === highestWinnerScore) {
	                            highestWinners[candidateIndex] = true
	                        }
	                    }
	                })
	
	                var numberOfHighestWinners = Object.keys(highestWinners).length
	                for(var winner in highestWinners) {
	                    results[resultsMap[winner]].weight += 1/numberOfHighestWinners
	                }
	            })
	        } else if(winnerWeightType === 'split') {
	            var results = []
	            for(var winner in winners) {
	                var avgScore = countedVotes[winner].totalScore/countedVotes[winner].totalNumber
	                results.push({index:winner, weight:avgScore})
	            }
	        } else if(winnerWeightType === 'equal') {
	            var results = []
	            for(var winner in winners) {
	                results.push({index:winner, weight:1})
	            }
	        }
	
	        return results
	    }
	
	    function getAvgScore(candidateInfo) {
	        return candidateInfo.totalScore/candidateInfo.totalNumber
	    }
	
	    function findNextWinner(countedVotes) {
	        var nextWinner, curWinnerScore = -Infinity
	        countedVotes.forEach(function(info, candidate) {
	            if(info.totalScore > curWinnerScore) {
	                nextWinner = candidate
	                curWinnerScore = info.totalScore
	            }
	        })
	
	        return nextWinner
	    }
	
	    function countVotes(candidates, votes, winners, disqualified, countType) {
	        if(winners === undefined) winners = {}
	        var countedVotes = candidates.map(function(p,c){
	            if(!(c in winners) && !(c in disqualified)) {
	                return {totalScore:0, totalNumber:0}
	            } else {
	                return {totalScore:-Infinity, totalNumber:0}
	            }
	        })
	        votes.forEach(function(vote) {
	            if(countType === 'maxMinority') {
	                var highestCandidates = {}, highestScore = -Infinity
	                vote.forEach(function(score, candidateIndex) {
	                    if(score > highestScore) {
	                        highestCandidates = {}
	                        highestCandidates[candidateIndex] = true
	                        highestScore = score
	                    } else if(score === highestScore) {
	                        highestCandidates[candidateIndex] = true
	                    }
	                })
	
	                for(var c in highestCandidates) {  // only count votes for people who's highest choice isn't a winner
	                    if(c in winners) {
	                        return; // continue
	                    }
	                }
	            } else if(countType === 'reweighted') {
	                var sumScoreForWinners = 0
	                vote.forEach(function(score, candidateIndex) {
	                    if(candidateIndex in winners) {
	                        sumScoreForWinners += score
	                    }
	                })
	
	                var weight = 1/(1+sumScoreForWinners/2)
	            }
	
	            vote.forEach(function(score, candidateIndex) {
	                if(!(candidateIndex in disqualified)) {
	                    var hasntChosenAWinner = !(candidateIndex in winners)
	                    if(countType === 'reweighted') {
	                        countedVotes[candidateIndex].totalScore += score*weight
	                        countedVotes[candidateIndex].totalNumber ++
	                    } else if(countType !== 'maxMinority' || hasntChosenAWinner) {  // only count votes for new potential winners
	                        countedVotes[candidateIndex].totalScore += score
	                        countedVotes[candidateIndex].totalNumber ++
	                    }
	                }
	            })
	        })
	        return countedVotes
	    }
	}
	
	// threshold - a number between 0 and 1 inclusive
	function fractionalRepresentativeRankedVote(threshold) {
	    return function(votes, candidates, maxWinners) {
	        var minimumWinningVotes = votes.length*threshold
	        var originalVotes = votes
	
	        var currentWinners = {}, countedVotes = candidates.map(function(){return 0})
	        votes.forEach(function(vote) {
	            var candidateIndex = vote[0]
	            countedVotes[candidateIndex] ++
	        })
	
	        // select initial winners
	        for(var candidateIndex in countedVotes) {
	            var votesForThisCandidate = countedVotes[candidateIndex]
	            if(votesForThisCandidate >= minimumWinningVotes) {
	                currentWinners[candidateIndex] = true
	            }
	        }
	
	        // remove votes of those who have chosen a winner
	        votes = votes.filter(function(vote) {
	            return !(vote[0] in currentWinners)
	        })
	
	        // iterate through preferences to find more winners
	        for(var currentPreferenceIndex = 1; currentPreferenceIndex<candidates.length; currentPreferenceIndex++) {
	            votes.forEach(function(vote) {
	                var candidateIndex = vote[currentPreferenceIndex]
	                countedVotes[candidateIndex] ++
	            })
	
	            // if there are any winners combining preferences 0 through n, choose best winner who isn't already a winner
	            var leadingNonWinner, leadingNonWinnerVotes = 0
	            for(var candidateIndex in countedVotes) {
	                var votesForThisCandidate = countedVotes[candidateIndex]
	                if(votesForThisCandidate >= minimumWinningVotes) {
	                    if(!(candidateIndex in currentWinners) && votesForThisCandidate > leadingNonWinnerVotes) {
	                        leadingNonWinner = candidateIndex
	                        leadingNonWinnerVotes = votesForThisCandidate
	                    }
	                }
	            }
	
	            if(leadingNonWinner !== undefined) {
	                currentWinners[leadingNonWinner] = true
	            }
	
	            // redact votes by voters who have chosen a winner from non-winners they previously chose
	            votes.forEach(function(vote) {
	                var curCandidateIndex = vote[currentPreferenceIndex]
	                if(curCandidateIndex in currentWinners) {
	                    for(var n=0; n<currentPreferenceIndex; n++) {
	                        var candidatePreferenceIndex = vote[n]
	                        countedVotes[candidatePreferenceIndex] --
	                    }
	                }
	            })
	
	            // remove votes of those who have just chosen a winner
	            votes = votes.filter(function(vote) {
	                return !(vote[currentPreferenceIndex] in currentWinners)
	            })
	        }
	
	        // this needs to happen because its possible for a vote to be counted for an earlier winner,
	        // when the vote's preference is for a winner that was chosen in a later round
	        var winnersRecount = candidates.map(function(){return 0})
	        originalVotes.forEach(function(vote) {
	            for(var n=0;n<vote.length;n++) {
	                if(vote[n] in currentWinners) {
	                    winnersRecount[vote[n]] ++
	                    break;
	                }
	            }
	        })
	
	        var finalWinners = []
	        for(var candidateIndex in currentWinners) {
	            var votesForThisCandidate = winnersRecount[candidateIndex]
	            finalWinners.push({index: candidateIndex, weight:votesForThisCandidate/originalVotes.length})
	        }
	
	        return finalWinners.slice(0, maxWinners)
	    }
	}
	
	function singleTransferrableVote(votes, candidates, maxWinners) {
	    var seats = maxWinners
	    var voteQuota = 1+votes.length/(seats+1)
	
	    var newVotesMap = function() {
	        var votesList = {}
	        candidates.forEach(function(candidate, index){
	            votesList[index] = {currentVotes: [], currentCount:0}
	        })
	
	        return votesList
	    }
	
	    var countedVotes = newVotesMap(), currentWinners = {}, eliminatedCandidates = {}
	    votes.forEach(function(vote) {
	        var candidate = countedVotes[vote[0]]
	        candidate.currentVotes.push({vote:vote, weight:1, currentPreferenceIndex:0})
	        candidate.currentCount ++
	    })
	
	    var transferVotes = function(transferOrigin, transferDestination, ratioToTransfer) {
	        transferOrigin.currentVotes.forEach(function(voteInfo) {
	            var newCandidatePreference = voteInfo.currentPreferenceIndex +1
	            while(true) {
	                var nextCandidatePreference = voteInfo.vote[newCandidatePreference]
	                if(nextCandidatePreference in eliminatedCandidates || nextCandidatePreference in currentWinners) {
	                    newCandidatePreference ++
	                } else {
	                    break
	                }
	            }
	
	            var candidateIndex = voteInfo.vote[newCandidatePreference]
	            if(candidateIndex !== undefined) {
	                transferDestination[candidateIndex].currentVotes.push({        // transfer the excess
	                    vote:voteInfo.vote,
	                    weight:voteInfo.weight*ratioToTransfer,
	                    currentPreferenceIndex:newCandidatePreference
	                })
	                transferDestination[candidateIndex].currentCount += voteInfo.weight*ratioToTransfer
	            }
	
	            //transferOrigin.currentCount -= voteInfo.weight*ratioToTransfer // just for testing // todo: comment this out
	            voteInfo.weight *= (1-ratioToTransfer) // keep the remainder
	        })
	    }
	
	    while(true) {
	        var votesInTranfer = newVotesMap()
	        while(true) {
	            var excessFound = false
	            for(var candidateIndex in countedVotes) {
	                var votes = countedVotes[candidateIndex].currentCount
	                if(votes >= voteQuota - .01) {
	                    currentWinners[candidateIndex] = true
	                    if(votes > voteQuota) {
	                        excessFound = true
	                        var excessVotes = votes - voteQuota
	                        var excessRatio = excessVotes/votes
	
	                        transferVotes(countedVotes[candidateIndex], votesInTranfer, excessRatio)
	
	                        // When testing, ensure that countedVotes[candidateIndex].currentCount already is equal to voteQuota when testing line A is uncommented
	                        countedVotes[candidateIndex].currentCount = voteQuota
	                    }
	                }
	            }
	
	            if(!excessFound) {
	                break
	            } else {
	                for(var candidateIndex in votesInTranfer) {
	                    var newVotes = votesInTranfer[candidateIndex]
	                    newVotes.currentVotes.forEach(function(vote) {
	                        countedVotes[candidateIndex].currentVotes.push(vote)
	                    })
	
	                    if(newVotes.currentCount > 0)
	                        countedVotes[candidateIndex].currentCount += newVotes.currentCount
	                }
	
	                votesInTranfer = newVotesMap()
	            }
	        }
	
	        if(Object.keys(currentWinners).length < seats) {
	            // find candidate with least votes
	            var candidateWithLeastCount=undefined, lowestCount=undefined
	            for(var candidateIndex in countedVotes) {
	                var candidate = countedVotes[candidateIndex]
	                if(lowestCount === undefined || candidate.currentCount < lowestCount) {
	                    lowestCount = candidate.currentCount
	                    candidateWithLeastCount = candidateIndex
	                }
	            }
	
	            eliminatedCandidates[candidateWithLeastCount] = true
	
	            // transfer votes from that candidate
	            transferVotes(countedVotes[candidateWithLeastCount], countedVotes, 1)
	
	            if(Object.keys(countedVotes).length === 1) { // if there's only one candidate left, make them a winner even tho they didn't reach the quota
	                currentWinners[candidateWithLeastCount] = true
	                break
	            } else {
	                // eliminate the candidate
	                delete countedVotes[candidateWithLeastCount]
	            }
	        } else {
	            break
	        }
	    }
	
	    var finalWinners = []
	    for(var candidateIndex in currentWinners) {
	        finalWinners.push({index: candidateIndex, weight:1})
	    }
	
	    return finalWinners
	}
	
	
	module.exports = {
	    random: {
	        '':function(votes, candidates, maxWinners) {
	            if(candidates.length < maxWinners) maxWinners = candidates.length
	
	            var winners = []
	            for(var n=0; n<maxWinners;) {
	                var winner = Math.round(random()*(candidates.length-1))
	                if(winners.indexOf(winner) === -1) {
	                    winners.push(winner)
	                    n++
	                }
	            }
	
	            return winners.map(function(winner) {
	                return {index: winner, weight:1}
	            })
	        }
	    },
	    randomVotersChoice: {
	        'single voter':function(votes, candidates, maxWinners) {
	            var luckyWinnerIndex = Math.round(random()*(votes.length-1))
	            var luckyWinnerVote = votes[luckyWinnerIndex]
	
	            return luckyWinnerVote.slice(0,maxWinners).map(function(vote) {
	                return {index: vote, weight:1}
	            })
	        },
	        '10% of the voters': function(votes, candidates, maxWinners) {
	            var luckyVotes = []
	            while(luckyVotes.length < votes.length*.1) {
	                var luckyWinnerIndex = Math.round(random()*(votes.length-1))
	                luckyVotes.push(votes[luckyWinnerIndex][0])
	            }
	
	            return pluralityAlg(luckyVotes, candidates, maxWinners)
	        }
	    },
	    plurality: {
	        '':pluralityAlg
	    },
	    range: {
	        'One Winner': function(votes, candidates) {
	            var results = []
	            for(var n=0; n<candidates.length;n++) {
	                results[n] = 0
	            }
	
	            votes.forEach(function(vote){
	                vote.forEach(function(value, index) {
	                    results[index] += value
	                })
	            })
	
	            var transformedResults = results.map(function(value,index){
	                return {candidate:index,votes:value}
	            })
	
	            transformedResults.sort(function(a,b) {
	                return b.votes - a.votes // reverse sort
	            })
	
	            var winner = transformedResults[0].candidate
	            return [{index: winner, weight:1, preferences:candidates[winner]}]
	        },
	        'Three Winners': function(votes, candidates) {
	            var results = []
	            for(var n=0; n<candidates.length;n++) {
	                results[n] = 0
	            }
	
	            votes.forEach(function(vote){
	                vote.forEach(function(value, index) {
	                    results[index] += value
	                })
	            })
	
	            var transformedResults = results.map(function(value,index){
	                return {candidate:index,votes:value}
	            })
	
	            transformedResults.sort(function(a,b) {
	                return b.votes - a.votes // reverse sort (most votes foist)
	            })
	
	            var winners = [], totalScore = 0
	            for(var n=0; n<3; n++) {
	                var winnerIndex = transformedResults[n].candidate
	                var winner = candidates[winnerIndex]
	                winners.push({index: winnerIndex, preferences:winner})
	                totalScore+= transformedResults[n].votes
	            }
	
	            winners.forEach(function(winner, index) {
	                winner.weight = transformedResults[index].votes/totalScore
	            })
	
	            return winners
	        }
	    },
	    singleTransferableVote: {
	        '':singleTransferrableVote
	    },
	    directRepresentativeRanked: {
	        '15% Threshold': {'':fractionalRepresentativeRankedVote(.15)},
	    },
	    directRepresentativeRanged: {
	        'split-weight, 0% threshold': directRepresentationRange('normal', 'split',0),
	        'highest-weight, 20% threshold': directRepresentationRange('normal', 'highest', .5),
	        'split-weight, 20% threshold': directRepresentationRange('normal', 'split', .9),
	        'equal-weight, 20% threshold': directRepresentationRange('normal', 'equal', .9),
	        'highest-weight, minority-max, 20% threshold': directRepresentationRange('maxMinority', 'highest', .9),
	        'split-weight, minority-max, 20% threshold': directRepresentationRange('maxMinority', 'split', .9),
	        'equal-weight, minority-max, 20% threshold': directRepresentationRange('maxMinority', 'equal', .9),
	        'highest-weight, <b>reweighted</b>': directRepresentationRange('reweighted', 'highest', 0),
	        'split-weight, <b>reweighted</b>': directRepresentationRange('reweighted', 'split', 0),
	        'equal-weight, <b>reweighted</b>': directRepresentationRange('reweighted', 'equal', 0),
	    }
	}

/***/ },
/* 3 */
/*!*****************************!*\
  !*** ./votingStrategies.js ***!
  \*****************************/
/***/ function(module, exports, __webpack_require__) {

	
	var utils = __webpack_require__(/*! ./utils */ 5)
	
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

/***/ },
/* 4 */
/*!********************!*\
  !*** ./ballots.js ***!
  \********************/
/***/ function(module, exports, __webpack_require__) {

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

/***/ },
/* 5 */
/*!******************!*\
  !*** ./utils.js ***!
  \******************/
/***/ function(module, exports, __webpack_require__) {

	
	
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

/***/ },
/* 6 */
/*!*************************!*\
  !*** ./aggregateFns.js ***!
  \*************************/
/***/ function(module, exports, __webpack_require__) {

	
	var utils = __webpack_require__(/*! ./utils */ 5)
	
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

/***/ },
/* 7 */
/*!**************************!*\
  !*** ./~/proto/proto.js ***!
  \**************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/
	
	var noop = function() {}
	
	var prototypeName='prototype', undefined, protoUndefined='undefined', init='init', ownProperty=({}).hasOwnProperty; // minifiable variables
	function proto() {
	    var args = arguments // minifiable variables
	
	    if(args.length == 1) {
	        var parent = {init: noop}
	        var prototypeBuilder = args[0]
	
	    } else { // length == 2
	        var parent = args[0]
	        var prototypeBuilder = args[1]
	    }
	
	    // special handling for Error objects
	    var namePointer = {}    // name used only for Error Objects
	    if([Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError].indexOf(parent) !== -1) {
	        parent = normalizeErrorObject(parent, namePointer)
	    }
	
	    // set up the parent into the prototype chain if a parent is passed
	    var parentIsFunction = typeof(parent) === "function"
	    if(parentIsFunction) {
	        prototypeBuilder[prototypeName] = parent[prototypeName]
	    } else {
	        prototypeBuilder[prototypeName] = parent
	    }
	
	    // the prototype that will be used to make instances
	    var prototype = new prototypeBuilder(parent)
	    namePointer.name = prototype.name
	
	    // if there's no init, assume its inheriting a non-proto class, so default to applying the superclass's constructor.
	    if(!prototype[init] && parentIsFunction) {
	        prototype[init] = function() {
	            parent.apply(this, arguments)
	        }
	    }
	
	    // constructor for empty object which will be populated via the constructor
	    var F = function() {}
	        F[prototypeName] = prototype    // set the prototype for created instances
	
	    var constructorName = prototype.name?prototype.name:''
	    if(prototype[init] === undefined || prototype[init] === noop) {
	        var ProtoObjectFactory = new Function('F',
	            "return function " + constructorName + "(){" +
	                "return new F()" +
	            "}"
	        )(F)
	    } else {
	        // dynamically creating this function cause there's no other way to dynamically name a function
	        var ProtoObjectFactory = new Function('F','i','u','n', // shitty variables cause minifiers aren't gonna minify my function string here
	            "return function " + constructorName + "(){ " +
	                "var x=new F(),r=i.apply(x,arguments)\n" +    // populate object via the constructor
	                "if(r===n)\n" +
	                    "return x\n" +
	                "else if(r===u)\n" +
	                    "return n\n" +
	                "else\n" +
	                    "return r\n" +
	            "}"
	        )(F, prototype[init], proto[protoUndefined]) // note that n is undefined
	    }
	
	    prototype.constructor = ProtoObjectFactory;    // set the constructor property on the prototype
	
	    // add all the prototype properties onto the static class as well (so you can access that class when you want to reference superclass properties)
	    for(var n in prototype) {
	        addProperty(ProtoObjectFactory, prototype, n)
	    }
	
	    // add properties from parent that don't exist in the static class object yet
	    for(var n in parent) {
	        if(ownProperty.call(parent, n) && ProtoObjectFactory[n] === undefined) {
	            addProperty(ProtoObjectFactory, parent, n)
	        }
	    }
	
	    ProtoObjectFactory.parent = parent;            // special parent property only available on the returned proto class
	    ProtoObjectFactory[prototypeName] = prototype  // set the prototype on the object factory
	
	    return ProtoObjectFactory;
	}
	
	proto[protoUndefined] = {} // a special marker for when you want to return undefined from a constructor
	
	module.exports = proto
	
	function normalizeErrorObject(ErrorObject, namePointer) {
	    function NormalizedError() {
	        var tmp = new ErrorObject(arguments[0])
	        tmp.name = namePointer.name
	
	        this.message = tmp.message
	        if(Object.defineProperty) {
	            /*this.stack = */Object.defineProperty(this, 'stack', { // getter for more optimizy goodness
	                get: function() {
	                    return tmp.stack
	                },
	                configurable: true // so you can change it if you want
	            })
	        } else {
	            this.stack = tmp.stack
	        }
	
	        return this
	    }
	
	    var IntermediateInheritor = function() {}
	        IntermediateInheritor.prototype = ErrorObject.prototype
	    NormalizedError.prototype = new IntermediateInheritor()
	
	    return NormalizedError
	}
	
	function addProperty(factoryObject, prototype, property) {
	    try {
	        var info = Object.getOwnPropertyDescriptor(prototype, property)
	        if(info.get !== undefined || info.get !== undefined && Object.defineProperty !== undefined) {
	            Object.defineProperty(factoryObject, property, info)
	        } else {
	            factoryObject[property] = prototype[property]
	        }
	    } catch(e) {
	        // do nothing, if a property (like `name`) can't be set, just ignore it
	    }
	}

/***/ }
/******/ ])
});

//# sourceMappingURL=elect.umd.js.map