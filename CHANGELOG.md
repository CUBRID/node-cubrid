# node-cubrid change log

## Version 2.1.0 (Unreleased)

- New: APIS-566, Release 3.0 - Add Travis support.
- Enh: APIS-568, Release 3.0 - Fix inconsistent function return values.
- Enh: APIS-567, Release 3.0 - Fix and improve code comments.
- Enh: added tests for APIS-582.
- Fix: test path for `node_modules`.
- Fix: host name for tests.
- Fix: travis script.
- Fix: broken test on CUBRID 9.1.
- Fix: cannot set the same timeout value twice. Gets reset to 0.
- Fix: APIS-603, Even if timeout occurs, the socket doesn't seem to get closed.
- Ref: cleanup package.json.
- Ref: revert version to 2.0.2.
- Ref: APIS-589, disable debugging mode by default.
- Ref: code cleanup.
- Ref: prefer files names to start with small letters.
- Ref: test on Node.js 0.10 as well.
- Ref: moved testing framework dependencies from Travis script to package.json.
- Ref: ignore `node_modules`.
- Ref: preparing the module for code coverage.
- Ref: keep connection configurations for test in one place and reuse it.
- Ref: refactored tests suite to prepare for code coverage.
- Ref: moved old tests into `old_tests` directory.
- Ref: moved `packets` unit tests outside of `src` to the main `test` directory.
- Ref: moved `utils` unit tests outside of `src` to the main `test` directory.
- Ref: moved all unit tests in `src` outside to the main `test` directory.
- Ref: merged unit tests in `test/nodeunit` directory with the main `test` directory.
- Ref: removed `console.log` output in test scripts.
- Ref: moved local variables in tests suite inside functions.
- Ref: added coverage report to `package.json`.
- Ref: added travis environment to test on different versions of CUBRID.
- Ref: use CUBRID Chef Cookbook to install different versions of CUBRID to run tests against.
- Ref: `demodb` recipe will install CUBRID as a prerequisite, so no need to specify explicitly.
- Ref: modified the test to handle incorrect error message when CUBRID is installed/started as root.
- Ref: install JSCoverage to instrument code covered version of the node-cubrid module.
- Doc: updated supported CUBRID version.
- Doc: updated README documentation.

## Version 2.0.2 (Apr 12, 2013)

- Fix: APIS-527, "Cannot call method 'parse' of undefined" in CUBRIDConnection.js:1333:20.

## Version 2.0.1 (Apr 10, 2013)

- New: APIS-437, Add travis testing support to node-cubrid Github project.
- Enh: APIS-506, `Result2Array.RowsArray(result)` should return an empty array if result is null or empty.
- Fix: APIS-521, In SHARD env, after queuing two different queries, second query doesn't respond.

## Version 2.0.0 (Mar 12, 2013)

- New: added compatibility with CUBRID 9.1 beta release.
- New: APIS-449, Implement Prepare-Bind protocol.
- New: APIS-450, Query queueing support.
- New: APIS-451, Database Sharding support.
- New: APIS-316, Implement lob support
- New: APIS-452, Full BLOB/CLOB support
- New: APIS-453, Support for database parameters.
- Enh: test cases.
- Enh: APIS-456, Implement a connection timeout feature.
- Enh: code quality improvements.
- Enh: support for more database schema.
- Fix: APIS-431, Error: -1100:CAS_ER_NOT_IMPLEMENTED when querying a SHARD Broker
- Fix: APIS-472, The `_doGetBrokerPort` function does not propagate an error.
- Task: APIS-438, CUBRID 9.1 code is available now. Please test node-cubrid with it.
- Task: APIS-429, Please update Node.js release notes.

## Version 1.1.1 (Jan 11, 2012)

- New: APIS-336, Create a function which converts a query result to a JSON object where column names are keys.
- Enh: APIS-304, Helpers._sqlFormat should be improved regarding detecting whether a val === 'number'.
- Enh: APIS-425, Export ActionQueue in node-cubrid module for users' convenience.
- Fix: APIS-376, _sqlFormat is incorrect (patch included).
- Fix: APIS-388, Why does node-cubrid export a new demodb connection? It should export a function wrapper instead.
- Fix: APIS-391, node-cubrid returns incorrect datatime. Adds one month + some hours to the actual value.
- Fix: APIS-430, Cannot find module '.src/utils/ActionQueue.js'. Must be "./" in front of the path.

## Version 1.1.0 (Dec 15, 2012)

- New: added compatibility with CUBRID 8.4.3 stable release, CUBRID 9.0.0 beta release.
- New: APIS-327, Advanced driver tutorial publish.
- New: APIS-326, Driver basics tutorial publish.
- New: APIS-325, Documentation publishing.
- New: APIS-324, Web site code tutorials.
- New: APIS-331, Node.js Stable release.
- Enh: test cases.
- Fix: APIS-389, `exports.DRIVER_VER` is still = '1.0' while we release 1.0.1 already.
- Fix: APIS-380, passing NULL to _escapeString in Node.js crashes.
- Ref: code quality improvements (based on SHint/JSLint code analysis).
- Doc: APIS-269, improve Node.js tutorial examples.
- Doc: APIS-381, Updated Node.js driver tutorials written before beta release. Users complain that examples don't work.
- Doc: APIS-377, Please document the purpose of arrDelimiters parameter in _sqlFormat.
- Task: APIS-383, Please push the latest bug fixes to NPM.

## Version 1.0.0 (Oct 26, 2012)

- New: initial release compatible with CUBRID 8.4.1 stable release.
- New: APIS-15, Porting CUBRID to Node.js.
- New: APIS-315, Implement schema support.
- New: APIS-333, Node.js Linux Testing.
- New: APIS-334, NPM installer publish.
- New: APIS-339, Implement `batchExecuteNoQueryWithParams` function similar to `queryWithParams`.
- Enh: APIS-231, Function naming convention is not constant
- Enh: APIS-332, Windows testing.
- Fix: APIS-305, Password with multiple single quotes is not correctly quoted or passed which fails the connection.
- Fix: APIS-349, Node driver doesn't escape single quotes in strings [fix included].

## Version 1.0.0 beta (Sep 29, 2012)

- New: APIS-15, first beta release.
- New: APIS-330, Node.js driver beta release.
- New: APIS-323, Error handling test cases.
- New: APIS-322, E2E test cases.
- New: APIS-321, Functional test cases.
- New: APIS-320, Implement transactions support.
- New: APIS-319, Implement implicit connect for execute.
- New: APIS-318, Implement implicit connect for query.
- New: APIS-317, Implement events model support.
- New: APIS-314, Implement fetch support.
- New: APIS-313, Implement query/close query support.
- New: APIS-312, Implement batch execute support.
- New: APIS-311, Implement engine support.
- New: APIS-310, Implement connect/disconnect support.
- New: APIS-309, CUBRID protocol packets implementation.
- New: APIS-308, Project code structure definition.
- New: APIS-307, Project repository setup.
- New: APIS-306, Project technology stack definition.
- Fix: APIS-299, Cannot connect to remote host.
- Fix: APIS-300, Result2Array has no method 'GetResultsCount'.

## Milestone 2 (Sep 16, 2012)

- New: APIS-329, Milestone 2 release.

## Milestone 1 (Aug 18, 2012)

- New: APIS-328, Milestone 1 release.

