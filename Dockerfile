# This is a Dockerfile to build an image for running
# node-cubrid tests.

FROM node:4.5.0

MAINTAINER Esen Sagynov <kadishmal@gmail.com>

WORKDIR /node-cubrid

# According to http://docs.travis-ci.com/user/build-configuration/
# prepare the system to install prerequisites or dependencies.
# Update the OS before installing prerequisites.
RUN apt-get update

# Install Ruby prerequisites. Necessary to run Chef.
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

# CUBRID requires `libgcrypt11` while the base Docker image does not
# have it.
RUN \
	LIBGCRYPT11_FILE_NAME=libgcrypt11_1.5.0-5+deb7u3_amd64.deb \
	curl -L http://security.debian.org/debian-security/pool/updates/main/libg/libgcrypt11/$LIBGCRYPT11_FILE_NAME > $LIBGCRYPT11_FILE_NAME \
	dpkg -i $LIBGCRYPT11_FILE_NAME \
	rm $LIBGCRYPT11_FILE_NAME

ENV NODE_ENV test
ENV CUBRID_VERSION=9.1.0

ENTRYPOINT /bin/bash
