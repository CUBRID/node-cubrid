# This is a Dockerfile to build an image for running
# node-cubrid tests.

# To auto run node-cubrid test execute the following:
# docker run --name node-cubrid -v /Users/naver/repos/node-cubrid:/node-cubrid lighthopper/node-cubrid:dev

# Note that the node-cubrid source code should reside under 
# /Users/naver/repos/node-cubrid directory. Otherwise
# set your own path. Internally it must bind to
# /node-cubrid path.

# When the container is run, it will enter into bash.
# 1) the first thing to do is:
# npm install

#	2) Prepare a build script for Chef to install CUBRID.
# echo '{"cubrid":{"version":"'$CUBRID_VERSION'"},"run_list":["cubrid::demodb"]}' > cubrid_chef.json

# 3) Run Chef:
# chef-solo -c test/testSetup/solo.rb -j cubrid_chef.json -r http://sourceforge.net/projects/cubrid/files/CUBRID-Demo-Virtual-Machines/Vagrant/chef-cookbooks.tar.gz/download

# 4) Now CUBRID is running. Run the node-cubrid tests.
# npm test


# To build an image, run:
# docker build -t="lighthopper/node-cubrid:dev" .

FROM dockerfile/nodejs
MAINTAINER Esen Sagynov <kadishmal@gmail.com>

WORKDIR /node-cubrid

# According to http://docs.travis-ci.com/user/build-configuration/
# prepare the system to install prerequisites or dependencies.
# Update the OS before installing prerequisites.
RUN apt-get update

# Install Ruby prerequisites.
RUN apt-get install -y build-essential zlib1g-dev libssl-dev libreadline6-dev libyaml-dev wget ssl-cert libffi6 libffi-dev

# Install Chef Solo prerequisites.
# Ruby >=2.0.0 is required by one of the Chef dependencies.
# Build Ruby from source. Will auto install gem. 
# Download Ruby source into the current directory.
RUN \
	RUBY_MAJOR_VERSION=2.2 && \
	RUBY_VERSION=$RUBY_MAJOR_VERSION.0 && \
	wget http://cache.ruby-lang.org/pub/ruby/$RUBY_MAJOR_VERSION/ruby-$RUBY_VERSION.tar.gz && \
	tar -xvzf ruby-$RUBY_VERSION.tar.gz && \
	cd ruby-$RUBY_VERSION && \
	./configure --prefix=/usr/local && \
	make && \
	make install && \
	cd .. && \
	rm -rf ruby-$RUBY_VERSION*

# Install Chef Solo.
# Chef Solo 11.4.4 is broken, so install one of the later versions.
# The bug was supposed to be fixed in 11.4.5 which is already released.
RUN gem install chef --no-rdoc --no-ri

# Make sure the target directory for cookbooks exists.
RUN mkdir -p /tmp/chef-solo

ENV NODE_ENV test
ENV CUBRID_VERSION=9.1.0

ENTRYPOINT /bin/bash
