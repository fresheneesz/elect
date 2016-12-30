var random = require("./utils").random


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