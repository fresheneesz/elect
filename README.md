`elect`
============

A javascript library that tests multi-winner and single-winner election systems and their corresponding voting strategies with [Bayesian Regret](http://rangevoting.org/BayRegDum.html).
This uses a strategy of choosing a number of societal options (or issues) and measuring the net utility of the voters as a measure of the satisfaction (or regret) of any given outcome. 
This method is []described here](http://rangevoting.org/BRmulti.html). See [a working example of this library in use](http://rangevoting.org/multiWinnerBaysianRegret.html). 

Example:

```javascript
var elect = require('elect')

var resultsNode = document.getElementById("results")
elect.test(resultsNode, {issues: 10, candidates: 10, voters: 30, iterations: 1000}, {
    VotingSystemCategory1: {
        winners: [1,3],
        strategies: elect.strategies.ranked,
        algorithms: {
            'Random 1': function(votes, candidates) {
                return [{
                    candidate: Math.round(random()*(candidates.length-1)),
                    weight:1
                }]
            },
            'Random 2': function(votes, candidates) {
                return [{candidate: votes[0], weight:1}]
            }
        }
    },
})

```

Install
=======

```
npm install elect
```

Usage
=====

```javascript
var elect = require('elect') // node.js or webpack

require(['node_modules/elect/dist/elect.umd'], function(Unit) { // require.js
  // ...
}
```
```
<script src="node_modules/elect/dist/elect.umd.js"></script><!-- browser global -->
<script>
elect
</script>
```

**`elect.test(resultsNode, options, testSystems)`** - Outputs voter satisfaction test results (inverse of bayesian regret).

* **`resultsNode`** - An html dom node to output results to.
* **`options`** - An object that should contain the following parameters:
   * `issues` - The number of issues
   * `candidates` - The number of candidates
   * `voters` - The number of voters
   * `iterations` - The number of iterations
   * `aggregateFns` - (Optional) Aggregate functions to add in addition to the built-in ones. An object where each key is the name of an aggregate property, and each value is a function for computing that property. This exists to optimize expensive operations that may be shared by multiple different voting system combinations. The aggregate function must return an array where the index corresponds to a voter, and the value is whatever important voter-value desired. Each aggregate is calculated once per `Election` run. Each function gets the in-order parameters:
     * `voters` - An array of `Person` arrays each representing a voter.
     * `candidates` - An array of `Person` arrays each representing a candidate.
* **`testSystems`** - An object where each key is the name of a category of voting systems and each value is an object with the following keys:
   * `winners` - An array of different numbers of maximum winners to test.
   * `strategies` - An object where each key is the name of a voting strategy, and the value is a function implementing that strategy. The strategy functions have the following in-order parameters:
     * `aggregates` - The `aggregates` object for the particular Election calculated by one of the `aggregateFns`.
   * `ballot` - (Optional) An object where each key is the name of a ballot, and each value is a function that transforms the output of a voting strategy function. For example, this might take in a scored vote with floating point scores and translate it into discrete scores of 1-5. Each function gets the following parameter:
      * `vote` - An individual vote object in the form output by a strategy function.
   * `systems` - An object where each key is the name of a specific voting system algorithm, and the value is a function implementing that algorithm. The voting system functions have the following in-order parameters:
     * `votes` - An array of votes. Each vote is the output of the voting strategy used.
     * `candidates` - An array of `Person` arrays representing candidates.
     * `winners` - The maximum number of winners to accept.

Strategies
-------------
While you can create your own, there are a number of built-in voting strategies:

* `elect.strategies.ranked` - Ranked strategies output an array of candidate indexes, where the candidate at the first element is the first choice.
  * `elect.strategies.scored['Honest']` - Honest voting based on voter-utilities based on that candidate becoming dictator.
* `elect.strategies.scored` - Scored strategies output an array of candidate scores from 0 to 1, where the index is the score given to that candidate.
  * `elect.strategies.scored['Honest']` - Honest voting based on voter-utilities based on that candidate becoming dictator.
* `elect.strategies.noop` - For situations where votes aren't needed at all, like random selection.

Ballots
-------------

* `elect.ballots.ranked`
  * `elect.ballots.ranked["raw"]` - No transformation
  * `elect.ballots.ranked["Max 3"]`
* `elect.ballots.scored`
  * `elect.ballots.ranked["raw"]` - No transformation
  * `elect.ballots.ranked["Nearest 1-5"]`
* `elect.ballots.noop` - No transformations

Systems
-------------
While you can create your own, there are a number of built-in voting systems:

* `elect.systems.random` - A random candidate is chosen.
* `elect.systems.randomVotersChoice` - A candidate is chosen based on votes from a randomly selected set of voters.
  * `elect.systems.randomVotersChoice['single voter']` - One voter is randomly selected.
  * `elect.systems.randomVotersChoice['10% of the voters']` - 10% of the voters are selected and a plurality vote of that set determines the winner.
* `elect.systems.plurality` - [Plurality voting system](https://en.wikipedia.org/wiki/Plurality_voting_system)
* `elect.systems.range` - [Range voting system](https://en.wikipedia.org/wiki/Range_voting)
* `elect.systems.singleTransferableVote` - [STV voting system](https://en.wikipedia.org/wiki/Single_transferable_vote)
* `elect.systems.directRepresentativeRanked` - A proportional representation method using ranked voting.
  * `elect.systems.directRepresentativeRanked['15% Threshold']`
* `elect.systems.directRepresentativeRanged` - A proportional representation method using scored voting.
  * `elect.systems.directRepresentativeRanged['split-weight, 0% threshold']`
  * `elect.systems.directRepresentativeRanged['highest-weight, 20% threshold']`
  * `elect.systems.directRepresentativeRanged['split-weight, 20% threshold']`
  * `elect.systems.directRepresentativeRanged['equal-weight, 20% threshold']`
  * `elect.systems.directRepresentativeRanged['highest-weight, minority-max, 20% threshold']`
  * `elect.systems.directRepresentativeRanged['split-weight, minority-max, 20% threshold']`
  * `elect.systems.directRepresentativeRanged['equal-weight, minority-max, 20% threshold']`
  * `elect.systems.directRepresentativeRanged['highest-weight, <b>reweighted</b>']` - See http://www.rangevoting.org/RRV.html
  * `elect.systems.directRepresentativeRanged['split-weight, <b>reweighted</b>']` - See http://www.rangevoting.org/RRV.html
  * `elect.systems.directRepresentativeRanged['equal-weight, <b>reweighted</b>']` - See http://www.rangevoting.org/RRV.html

Aggregate Functions
--------------------
Aggregate functions are functions that calculate something about a set of candidates for each voter. They're used by strategy functions. When accessed, the results of the function are cached so that another voting strategy can also use that data if it needs to.
While you can create your own, there are a number of built-in aggregate functions:

* `elect.aggregates.candidateDictatorUtilities` - Returns a 2D array where each index represents a voter and each value is an array where the index represents a candidate and the value is the net utility that voter would get if that candidate was elected dictator.

Election
--------------

**`var election = elect.Election(voters, candidates, issues)`** - Creates a new election. This object is used internally to test elections with `elect.test`.

* **`voters`** - The number of voters to create.
* **`candidates`** - The number of candidates to create.
* **`issues`** - The number of societal issues people vote based on.

**`election.elect(algorithm, strategy, voters, candidates, maxWinners)`** - Returns an array of winning candidates represented by objects that have the properties:
    * `weight` - That winner's voting weight in the government body (eg legislature)
    * `utilities` - That winner's option utilities (in the same form as returned by generatePerson)

**`election.addAggregateFn(name, fn)`** - Adds an aggregate function `fn` named `name` to the list of functions voting strategies can use.

**`election.voters`** - An array of voters where each voter is a `Person`.
**`election.candidates`** - An array of candidates where each candidates is a `Person`.

Person
--------

A person is represented as an array of societal preferences from -1 to 1. Candidates and voters are both array of Person arrays.

Todo
====

* districts
* multiple election cycles
  * Probably should mutate candidate and voter preferences slightly each cycle
* politician behavior (gerrymandering, vote influencing [ie vote buying, campaigning, buying ads, etc])
* Election rounds where only a fraction of the government body is up for re-election
* more realistic voter preferences
* Display confidence / error ranges
* visualization of progression through election cycles
* Add abstain votes in scored ballots

Changelog
========

* 0.8.0 - Moving existing repository to github and major refactoring.

How to Contribute!
============

Anything helps:

* Creating issues (aka feature requests / bugs / etc). Please feel free to use issues to report bugs, request features, and discuss changes
* Updating the documentation: ie this readme file. Be bold! Help create amazing documentation!
* Submitting pull requests.

How to submit pull requests:

1. Please create an issue and get my input before spending too much time creating a feature. Work with me to ensure your feature or addition is optimal and fits with the purpose of the project.
2. Fork the repository
3. clone your forked repo onto your machine and run `npm install` at its root
4. If you're gonna work on multiple separate things, its best to create a separate branch for each of them
5. edit!
6. If it's a code change, please add to the unit tests (at test/tests.js) to verify that your change
7. When you're done, run the unit tests and ensure they all pass
8. Commit and push your changes
9. Submit a pull request: https://help.github.com/articles/creating-a-pull-request

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT
