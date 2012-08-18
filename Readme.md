node-cubrid
June-August, 2012
http://www.cubrid.org


Introduction
=======================================================================================================
The CUBRID node.js driver is an open-source project with the goal of implementing a 100% native node.js driver for the CUBRID database engine (www.cubrid.org).

The driver is currently under development and this (August 2012) is the first release (Milestone 1) of the driver code, which features:
- 2.000+ LOC
- Connect/Close, Query, Execute, Fetch, Close request etc. completed
- 15+ functional test cases
- 15+ unit tests
- E2E demos

These are the main project deliverables we target for the project:
-	The driver source code
-	Test cases
-	Code documentation
-	Demos & Tutorials
-	npm package; registered on http://search.npmjs.org/


Installation
=======================================================================================================

This first release does not feature yet an npm installer – it will be available in the upcoming beta release.
Therefore, if you want to use it now, please download the driver code on your machine.


Usage
=======================================================================================================
This first release contains many test cases and demos which will show you how to use the driver.
These examples are located in the following (sub)folders:
	\demo
	\src\test


TODOs
=======================================================================================================
In the next code release (Technology preview - September 2012), we are targeting:
- Transactions support
- Additional data types support
- Schema support
- Documentation release
- More functionality & more testing
- Additional demos and E2E scenarios
- Code improvements, optimizations and refactoring


Author and Contributors
=======================================================================================================
The main authors of this driver are the members of the CUBRID API team - http://www.cubrid.org/wiki_apis.

We welcome any contributors and we hope you will enjoy coding with CUBRID! J


Special thanks
=======================================================================================================
We would like to thanks to the following people & projects for inspiration, 
code we have reused and for doing such a great job for the open-source community!
-	https://github.com/caolan/async
-	https://github.com/felixge/node-mysql
-	https://github.com/jeromeetienne/microcache.js


TODO
=======================================================================================================
This release is just the first milestone for this project.
We intend to release soon a beta version, followed by a stable release, with demos and tutorials.
Here are the scheduled releases:
-	Milestone 1. Basic driver interfaces: connect, queries support
-	Milestone 2. Technology preview release: ~80% functionality ready
-	Milestone 3. Beta release
-	Milestone 4. Stable release
-	Milestone 5. Tutorials & Installer/Package completed; web awareness achieved.

...Stay tuned! :)

 

