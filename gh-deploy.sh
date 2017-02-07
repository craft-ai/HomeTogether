#!/bin/bash
set -e # exit with nonzero exit code if anything fails

gh_dir=gh

# clear and re-create the out directory
rm -rf ${gh_dir} || exit 0;
mkdir ${gh_dir};

# copy the needed stuffs
cp -r ./build/* ./${gh_dir}/

# go to the out directory and create a *new* Git repo
cd ${gh_dir}
git init

# inside this git repo we'll pretend to be a new user
git config user.name "Jenkins"
git config user.email "ops@craft.ai"

# The first and only commit to this new Git repo contains all the
# files present with the commit message "Deploy to GitHub Pages".
git add .
git commit -m "Deploy to GitHub Pages"

# Force push from the current repo's master branch to the remote
# repo's gh-pages branch. (All previous history on the gh-pages branch
# will be lost, since we are overwriting it.) We redirect any output to
# /dev/null to hide any sensitive credential data that might otherwise be exposed.
git push --force --quiet "https://${GH_TOKEN}@github.com/craft-ai/content.git" master:gh-pages
